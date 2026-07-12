import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/isAdmin";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getAIClient, getAIModel } from "@/lib/ai";

const SYSTEM_PROMPT = `Sen bir uzman web sitesi planlama asistanısın.
Kullanıcının verdiği proje adına göre, o projenin amacını analiz etmeli ve aşağıdaki JSON yapısında bilgi üretmelisin:
{
  "description": "Projenin ne işe yaradığını açıklayan kısa Türkçe bir açıklama cümlesi.",
  "project_type": "landing_page" veya "saas" veya "mobile_app" değerlerinden biri,
  "setup_prompt": "Cursor AI editöründe projeyi Next.js ile sıfırdan kurmak için kullanılabilecek detaylı bir Türkçe teknik prompt.",
  "pages": ["Anasayfa", "Hakkımızda", "Hizmetler", "İletişim" gibi projeye uygun en az 4 sayfa başlığı dizisi],
  "features": ["Kullanıcı Kayıt Sistemi", "Ödeme Entegrasyonu", "Yönetim Paneli" gibi en az 4 MVP özellik başlığı dizisi],
  "schema": {
    "tables": [
      {
        "name": "tablo_adi (örn: users, products)",
        "columns": [
          {"name": "id", "type": "uuid", "isPk": true},
          {"name": "email", "type": "text"}
        ]
      }
    ]
  }
}
Yanıtı SADECE geçerli JSON olarak ver, başka hiçbir açıklama yazma.`;

async function generateAiProjectData(projectName) {
  try {
    const openai = getAIClient();
    const completion = await openai.chat.completions.create({
      model: getAIModel("gpt-4o-mini"),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Proje Adı: ${projectName}` },
      ],
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error(`[Vercel Sync] AI error for ${projectName}:`, err);
    return {
      description: `${projectName} projesi.`,
      project_type: "landing_page",
      setup_prompt: "",
      pages: ["Anasayfa", "Hakkımızda", "Hizmetler", "İletişim"],
      features: ["Kullanıcı Girişi", "İletişim Formu"],
      schema: { tables: [] },
    };
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { user, admin } = await getCurrentUser(supabase);
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const token = process.env.VERCEL_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "VERCEL_TOKEN çevre değişkeni tanımlı değil." },
        { status: 400 }
      );
    }

    const teamId = process.env.VERCEL_TEAM_ID;
    let url = "https://api.vercel.com/v9/projects";
    if (teamId) {
      url += `?teamId=${teamId}`;
    }

    console.log("[Vercel Sync] Fetching projects from Vercel API...");
    const vercelRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!vercelRes.ok) {
      const errText = await vercelRes.text();
      console.error("[Vercel Sync] Vercel API error:", errText);
      return NextResponse.json(
        { error: `Vercel API hatası: ${vercelRes.statusText}` },
        { status: vercelRes.status }
      );
    }

    const data = await vercelRes.json();
    const vercelProjects = data.projects || [];
    console.log(`[Vercel Sync] Found ${vercelProjects.length} projects in Vercel.`);

    // Fetch existing projects in Supabase
    const { data: existingProjects, error: fetchError } = await supabase
      .from("projects")
      .select("name");

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const existingNames = new Set(existingProjects.map((p) => p.name.toLowerCase().trim()));
    const importedProjects = [];

    for (const vProj of vercelProjects) {
      const name = vProj.name.trim();
      if (existingNames.has(name.toLowerCase())) {
        // Project already exists, skip
        continue;
      }

      // Generate AI blueprint data for the project
      console.log(`[Vercel Sync] Generating AI data for project: ${name}...`);
      const aiData = await generateAiProjectData(name);

      const allowedTypes = ["landing_page", "saas", "mobile_app"];
      const projectType = allowedTypes.includes(aiData.project_type)
        ? aiData.project_type
        : "landing_page";

      // Insert new project with AI description and setup prompt
      const { data: insertedProj, error: insertError } = await supabase
        .from("projects")
        .insert({
          name: name,
          user_id: user.id,
          update_public_token: nanoid(32),
          type: projectType,
          description: aiData.description,
          setup_prompt: aiData.setup_prompt,
        })
        .select()
        .single();

      if (insertError) {
        console.error(`[Vercel Sync] Error inserting project ${name}:`, insertError.message);
        continue;
      }

      // 1. Insert production domains from Vercel aliases
      const aliases = vProj.targets?.production?.alias || [];
      const prodUrl = vProj.targets?.production?.url;
      const domainsToInsert = [...aliases];

      if (domainsToInsert.length === 0 && prodUrl) {
        domainsToInsert.push(prodUrl);
      }

      for (let i = 0; i < domainsToInsert.length; i++) {
        await supabase.from("domains").insert({
          project_id: insertedProj.id,
          domain: domainsToInsert[i],
          is_primary: i === 0, // Mark the first one as primary
          vercel_status: "connected",
          availability_status: "unavailable",
          purchase_status: "purchased",
        });
      }

      // 2. Insert AI generated site pages
      if (Array.isArray(aiData.pages)) {
        for (let i = 0; i < aiData.pages.length; i++) {
          await supabase.from("site_pages").insert({
            project_id: insertedProj.id,
            title: aiData.pages[i],
            sort_order: i,
          });
        }
      }

      // 3. Insert AI generated MVP features
      if (Array.isArray(aiData.features)) {
        for (let i = 0; i < aiData.features.length; i++) {
          await supabase.from("project_mvp_features").insert({
            project_id: insertedProj.id,
            title: aiData.features[i],
            sort_order: i,
            label: "mvp",
          });
        }
      }

      // 4. Insert AI generated database schema
      if (aiData.schema) {
        await supabase.from("project_db_schemas").insert({
          project_id: insertedProj.id,
          project_context: aiData.description,
          schema_data: aiData.schema,
          chat_messages: [
            {
              role: "assistant",
              content: `Merhaba! Vercel eşitleme sırasında bu proje için otomatik bir başlangıç veritabanı şeması tasarladım. Şemayı yukarıdaki tuval üzerinden görebilir ve ihtiyaçlarınıza göre beni kullanarak özelleştirebilirsiniz.`,
            },
          ],
        });
      } else {
        await supabase.from("project_db_schemas").insert({
          project_id: insertedProj.id,
          schema_data: { tables: [] },
        });
      }

      // 5. Create installation form and site settings
      await supabase.from("installation_forms").insert({
        project_id: insertedProj.id,
        public_token: nanoid(32),
        business_name: name,
        sector: name,
      });

      await supabase.from("site_settings").insert({
        project_id: insertedProj.id,
      });

      importedProjects.push(insertedProj);
    }

    console.log(`[Vercel Sync] Successfully imported ${importedProjects.length} new projects.`);
    return NextResponse.json({
      success: true,
      importedCount: importedProjects.length,
      imported: importedProjects,
    });
  } catch (err) {
    console.error("[Vercel Sync] Exception:", err);
    return NextResponse.json({ error: err.message || "Sunucu hatası" }, { status: 500 });
  }
}
