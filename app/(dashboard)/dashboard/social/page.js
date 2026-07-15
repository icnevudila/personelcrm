"use client";

import { useEffect, useState } from "react";

function AccountCard({ provider, account, configured }) {
  const label = provider === "x" ? "X (Twitter)" : "Instagram";
  if (account) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-[#121214] p-4 shadow-md transition hover:border-zinc-700">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-zinc-300">{label}</p>
            <p className="mt-1 font-mono text-[10px] text-zinc-500">{account.display_name || account.external_account_id}</p>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
              account.status === "connected"
                ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                : "bg-amber-950/40 text-amber-400 border border-amber-900/30"
            }`}
          >
            {account.status === "connected" ? "Bağlı" : "Yeniden bağlanmalı"}
          </span>
        </div>
        <a
          href={`/api/oauth/${provider}/start`}
          className="mt-3.5 inline-flex text-[10px] font-semibold text-zinc-400 hover:text-zinc-250 underline underline-offset-4"
        >
          Bağlantıyı Yenile
        </a>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#121214] p-4 shadow-md transition hover:border-zinc-700">
      <p className="text-xs font-bold text-zinc-300">{label}</p>
      <p className="mt-1 min-h-[36px] text-[10px] leading-relaxed text-zinc-500">
        {configured ? "Henüz hesap bağlanmadı." : "Sunucu OAuth yapılandırması eksik."}
      </p>
      {configured ? (
        <a
          href={`/api/oauth/${provider}/start`}
          className="mt-3 inline-flex rounded-lg bg-zinc-100 px-3.5 py-1.5 text-[10px] font-bold text-zinc-900 hover:bg-zinc-250"
        >
          {label} Bağlantısını Kur
        </a>
      ) : (
        <span className="mt-3 inline-flex rounded-lg border border-zinc-800 px-2.5 py-1 text-[9px] text-zinc-650">
          Yapılandırılmamış
        </span>
      )}
    </div>
  );
}

export default function SocialPage() {
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [providers, setProviders] = useState({});
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("x");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [publishing, setPublishing] = useState("");

  // Config Status Check States
  const [configStatus, setConfigStatus] = useState(null);
  const [showSettingsGuide, setShowSettingsGuide] = useState(false);

  // AI Planner States
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [aiPlanSummary, setAiPlanSummary] = useState("");

  // AI Chat Agent States
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: "Merhaba! Ben senin AI Sosyal Medya Ajanınım. 🤖\n\nSenin için yüksek kaliteli X ve Instagram paylaşımları yazabilir, ilgi çekici görsel promptları hazırlayıp içerik kuyruğuna ekleyebilirim. Ne paylaşmak istediğini bana yazman yeterli!"
    }
  ]);

  async function load() {
    const [contentResponse, accountsResponse, configResponse] = await Promise.all([
      fetch("/api/social/content"),
      fetch("/api/social/accounts"),
      fetch("/api/social/config-status"),
    ]);
    const contentData = await contentResponse.json();
    const accountData = await accountsResponse.json();
    if (contentResponse.ok) setItems(contentData.content);
    else setError(contentData.error);
    if (accountsResponse.ok) {
      setAccounts(accountData.accounts);
      setProviders(accountData.providers || {});
    } else setError(accountData.error);

    if (configResponse.ok) {
      const configData = await configResponse.json();
      setConfigStatus(configData);
    }
  }

  useEffect(() => {
    load();
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) setNotice(`${params.get("connected") === "x" ? "X" : "Instagram"} hesabı bağlandı.`);
    if (params.get("connection_error")) setError(params.get("connection_error"));
  }, []);

  async function create(event) {
    if (event) event.preventDefault();
    const response = await fetch("/api/social/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, title, format: "post", body: { text: title } }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error);
    setTitle("");
    setItems((current) => [data.content, ...current]);
  }

  async function publish(contentId) {
    setPublishing(contentId);
    setError("");
    const response = await fetch(`/api/social/content/${contentId}/publish`, { method: "POST" });
    const data = await response.json();
    setPublishing("");
    if (!response.ok) return setError(data.error || "Yayınlama başarısız oldu.");
    setNotice("İçerik yayınlandı.");
    await load();
  }

  async function requestApproval(contentId) {
    setPublishing(contentId);
    setError("");
    const response = await fetch(`/api/social/content/${contentId}/approval`, { method: "POST" });
    const data = await response.json();
    setPublishing("");
    if (!response.ok) return setError(data.error || "Onay isteği gönderilemedi.");
    setNotice(
      data.delivery === "telegram"
        ? "Telegram onay kartı gönderildi."
        : "Onay kaydı oluşturuldu; Telegram bağlantısı yapılandırılmamış."
    );
    await load();
  }

  // AI Content Planner
  async function planWithAI() {
    if (!aiPrompt) return;
    setAiLoading(true);
    setError("");
    setNotice("AI içerik taslaklarını ve görselleri planlıyor...");
    try {
      const res = await fetch("/api/automation/ai-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, type: "social" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI içerik planlayamadı.");
      setSuggestions(data.items || []);
      setAiPlanSummary(data.plan || "");
      setNotice("AI içerik önerileri başarıyla oluşturuldu!");
    } catch (err) {
      setError("Planlama hatası: " + err.message);
    } finally {
      setAiLoading(false);
    }
  }

  // Helper to build clean image URL
  function buildImageUrl(promptText) {
    if (!promptText) return "";
    // Remove special characters that could break URL encoding
    const clean = promptText.replace(/[^a-zA-Z0-9\s]/g, "").trim();
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(clean)}?width=1024&height=1024&nologo=true`;
  }

  // Add suggestion to draft queue
  async function insertDraftIntoDatabase(platformVal, titleVal, textVal, mediaPromptVal) {
    const mediaUrl = mediaPromptVal ? buildImageUrl(mediaPromptVal) : null;

    const response = await fetch("/api/social/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: platformVal,
        title: titleVal,
        format: mediaPromptVal ? "image" : "post",
        body: {
          text: textVal,
          mediaUrl: mediaUrl,
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Eklenirken hata oluştu.");
    setItems((current) => [data.content, ...current]);
  }

  async function addSuggestedDraft(sug) {
    setError("");
    try {
      await insertDraftIntoDatabase(sug.platform, sug.title, sug.body.text, sug.mediaPrompt);
      setSuggestions((current) => current.filter((item) => item !== sug));
      setNotice(`"${sug.title}" taslak kuyruğuna eklendi.`);
    } catch (err) {
      setError(err.message);
    }
  }

  // Send message to AI Agent Copilot
  async function sendChatMessage() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: "user", content: chatInput };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          context: { type: "social", state: items }
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ajan yanıt veremedi.");

      let text = data.reply || "";
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = text.match(jsonRegex);
      if (match) {
        try {
          const actionData = JSON.parse(match[1].trim());
          if (actionData.action) {
            await handleAgentAction(actionData.action);
          }
          text = text.replace(jsonRegex, "").trim();
        } catch (e) {
          console.error("Action parsing error:", e);
        }
      }

      setChatMessages((prev) => [...prev, { role: "assistant", content: text }]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: "Bir hata oluştu: " + err.message }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleAgentAction(action) {
    if (action.type === "CREATE_SOCIAL_DRAFT") {
      await insertDraftIntoDatabase(
        action.platform,
        action.title,
        action.body?.text || action.title,
        action.mediaPrompt
      );
      setNotice(`AI Ajanı '${action.platform}' için yeni bir taslak oluşturdu!`);
    }
  }

  const xAccount = accounts.find((account) => account.provider === "x");
  const instagramAccount = accounts.find((account) => account.provider === "instagram");

  return (
    <div className="flex h-[calc(100vh-var(--dashboard-header-height,3.75rem))] w-full overflow-hidden bg-[#09090b] text-zinc-150">
      {/* Left Column - Main Studio (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 min-h-0 bg-[#141416] bg-[radial-gradient(circle_at_1px_1px,#2d2d30_1px,transparent_0)] bg-[size:20px_20px]">
        
        {/* Header Section */}
        <header className="flex flex-col gap-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Social OS</p>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100">İçerik Stüdyosu</h1>
            <button
              onClick={() => setShowSettingsGuide(!showSettingsGuide)}
              className="rounded-xl border border-zinc-800 bg-[#121214] px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800"
            >
              ⚙️ Entegrasyon Anahtarları
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            Yapay zeka ile detaylı sosyal medya kampanyaları tasarlayın, görseller üretin ve yayın sırasını planlayın.
          </p>
        </header>

        {/* Integration Credentials Status Guide Panel */}
        {showSettingsGuide && configStatus && (
          <section className="rounded-2xl border border-blue-900 bg-blue-950/10 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">🛠️ Entegrasyon Anahtarları Durumu</h3>
              <button onClick={() => setShowSettingsGuide(false)} className="text-xs text-blue-500 hover:text-blue-300">Kapat</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-zinc-900 border border-zinc-850 p-3 shadow-inner">
                <span>X OAuth (X_CLIENT_ID)</span>
                <span className={`h-2 w-2 rounded-full ${configStatus.x_configured ? "bg-emerald-500" : "bg-rose-500"}`} />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-zinc-900 border border-zinc-850 p-3 shadow-inner">
                <span>Meta API (META_APP_ID)</span>
                <span className={`h-2 w-2 rounded-full ${configStatus.meta_configured ? "bg-emerald-500" : "bg-rose-500"}`} />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-zinc-900 border border-zinc-850 p-3 shadow-inner">
                <span>Groq AI Key</span>
                <span className={`h-2 w-2 rounded-full ${configStatus.groq_configured ? "bg-emerald-500" : "bg-rose-500"}`} />
              </div>
            </div>

            <div className="rounded-xl bg-zinc-900/60 border border-zinc-850 p-4 text-xs leading-relaxed space-y-2 text-zinc-400">
              <p className="font-bold text-zinc-300">💡 Bağlantıları Yapılandırmak İçin:</p>
              <p>Projeyi çalıştırdığınız sunucunun env (çevre değişkenleri) ayarlarından veya <code>.env.local</code> dosyasından aşağıdaki anahtarları girin:</p>
              <ul className="list-disc pl-5 space-y-1 font-mono text-[10px] text-zinc-550">
                <li>X_CLIENT_ID = "X Geliştirici Portalı -&gt; OAuth 2.0 Client ID"</li>
                <li>META_APP_ID = "Meta Developer Console -&gt; App ID"</li>
                <li>META_APP_SECRET = "Meta Developer Console -&gt; App Secret"</li>
                <li>GROQ_API_KEY = "Groq Console -&gt; API Key"</li>
                <li>APP_URL = "Uygulamanın yayındaki URL'i"</li>
              </ul>
              <p className="pt-2 text-[10px] text-zinc-500">Mevcut callback adresiniz: <code>{configStatus.app_url}/api/oauth/[sağlayıcı]/callback</code></p>
            </div>
          </section>
        )}

        {/* AI Campaign Co-Pilot Panel */}
        <section className="rounded-2xl border border-zinc-800 bg-[#121214] p-5 shadow-lg">
          <h2 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
            <span>🚀</span> AI Kampanya Planlayıcı & Görsel Stüdyosu
          </h2>
          <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
            Kampanya hedefinizi doğal dille detaylıca belirtin (örneğin: "Yapay zeka asistanımız için X platformunda 2 adet detaylı teknik tweet yaz, görseller fütüristik olsun").
          </p>
          <div className="mt-4 flex gap-3">
            <input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Kampanya detayları veya içerik konunuz..."
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
              onKeyDown={(e) => {
                if (e.key === "Enter") planWithAI();
              }}
            />
            <button
              onClick={planWithAI}
              disabled={aiLoading || !aiPrompt}
              className="rounded-xl bg-zinc-100 px-5 py-2.5 text-xs font-bold text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
            >
              {aiLoading ? "Planlanıyor..." : "Planla ⚡"}
            </button>
          </div>

          {/* AI Suggested Items Grid */}
          {suggestions.length > 0 && (
            <div className="mt-5 space-y-4 border-t border-zinc-800 pt-4">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">AI Planlama Özeti</p>
                <p className="mt-1 text-xs font-medium text-zinc-300">{aiPlanSummary}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {suggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
                        <span className={sug.platform === "x" ? "text-sky-400" : "text-pink-400"}>{sug.platform.toUpperCase()}</span>
                        <span className="text-zinc-500">Plan Taslağı</span>
                      </div>
                      <h4 className="mt-2 text-xs font-bold text-zinc-250">{sug.title}</h4>
                      <p className="mt-2 text-[11px] leading-relaxed text-zinc-400 whitespace-pre-wrap">{sug.body.text}</p>

                      {sug.mediaPrompt && (
                        <div className="mt-3.5 overflow-hidden rounded-xl border border-zinc-800 bg-[#0e0e11]">
                          <img
                            src={buildImageUrl(sug.mediaPrompt)}
                            alt="AI Görsel Önizleme"
                            className="w-full object-cover h-36"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                          <div className="p-2.5 bg-zinc-950/60 border-t border-zinc-850">
                            <p className="text-[9px] font-mono leading-relaxed text-zinc-500 italic">
                              Visual: {sug.mediaPrompt}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => addSuggestedDraft(sug)}
                        className="w-full rounded-lg bg-zinc-100 py-2 text-[10px] font-bold text-zinc-900 hover:bg-zinc-250"
                      >
                        Sıraya Ekle ✅
                      </button>
                      <button
                        onClick={() => setSuggestions((current) => current.filter((item) => item !== sug))}
                        className="rounded-lg border border-zinc-800 px-3 py-2 text-[10px] text-zinc-500 hover:bg-zinc-800"
                      >
                        Yoksay
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Account Status Grid */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-400">Aktif Yayın Kanalları</h2>
            <span className="text-[10px] text-zinc-650">OAuth Yetkilendirmeleri</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <AccountCard provider="x" account={xAccount} configured={providers.x?.configured} />
            <AccountCard provider="instagram" account={instagramAccount} configured={providers.instagram?.configured} />
          </div>
        </section>

        {/* Simple Draft Form */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-zinc-400">Manuel Post Girişi</h2>
          <form
            onSubmit={create}
            className="flex flex-wrap gap-3 rounded-2xl border border-zinc-800 bg-[#121214] p-3 shadow-md"
          >
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-300"
            >
              <option value="x">X (Twitter)</option>
              <option value="instagram">Instagram</option>
            </select>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              placeholder="İçerik fikrini yazın..."
              className="min-w-48 flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            />
            <button className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-900 hover:bg-zinc-250">
              Taslak Oluştur
            </button>
          </form>
        </section>

        {/* Notices */}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-rose-950/20 border border-rose-900/30 px-4 py-2.5 text-xs text-rose-300"
          >
            ⚠️ {error}
          </p>
        )}
        {notice && (
          <p className="rounded-xl bg-emerald-950/20 border border-emerald-900/30 px-4 py-2.5 text-xs text-emerald-300">
            ✨ {notice}
          </p>
        )}

        {/* Main Content Draft Queue */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-zinc-400">Yayınlanacak İçerik Sırası ({items.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-zinc-850 bg-[#121214]/60 p-4 shadow-md flex flex-col justify-between transition hover:border-zinc-800"
              >
                <div>
                  <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider">
                    <span className={item.platform === "x" ? "text-sky-400" : "text-pink-400"}>{item.platform.toUpperCase()}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${
                        item.status === "published"
                          ? "bg-emerald-950/40 text-emerald-400"
                          : "bg-zinc-900 text-zinc-500"
                      }`}
                    >
                      {item.status === "published" ? "Paylaşıldı" : "Taslak"}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-bold text-zinc-200">{item.title}</p>
                  {item.body?.text && item.body.text !== item.title && (
                    <p className="mt-2 text-[11px] leading-relaxed text-zinc-400 whitespace-pre-wrap">{item.body.text}</p>
                  )}

                  {item.body?.mediaUrl && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800 bg-[#0e0e11]">
                      <img src={item.body.mediaUrl} alt="Görsel" className="w-full object-cover h-36" />
                    </div>
                  )}
                </div>

                {item.status !== "published" && (
                  <div className="mt-5 flex gap-2">
                    <button
                      disabled={publishing === item.id}
                      onClick={() => requestApproval(item.id)}
                      className="flex-1 rounded-lg border border-zinc-800 py-2 text-[10px] font-bold text-zinc-400 hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Onaya Gönder
                    </button>
                    <button
                      disabled={publishing === item.id}
                      onClick={() => publish(item.id)}
                      className="flex-1 rounded-lg bg-zinc-100 py-2 text-[10px] font-bold text-zinc-900 hover:bg-zinc-250 disabled:opacity-50"
                    >
                      {publishing === item.id ? "..." : "Yayınla"}
                    </button>
                  </div>
                )}

                {item.external_id && (
                  <p className="mt-3 font-mono text-[9px] text-zinc-650">Post ID: {item.external_id}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Right Column - AI Social Agent Copilot (Cohesive Theme) */}
      <aside className="w-[340px] border-l border-zinc-800 bg-[#121214] flex flex-col justify-between min-h-0">
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
            <span>🤖</span> AI Sosyal Medya Ajanı
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-3 text-xs leading-relaxed max-w-[85%] ${
                msg.role === "user"
                  ? "bg-zinc-800 text-zinc-250 self-end ml-auto"
                  : "bg-blue-950/20 text-blue-300 border border-blue-900/30"
              }`}
            >
              <p className="font-semibold text-[8px] uppercase tracking-wider opacity-60 mb-1">
                {msg.role === "user" ? "Sen" : "AI Ajanı"}
              </p>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))}
          {chatLoading && (
            <div className="rounded-xl p-3 text-xs bg-blue-950/10 text-blue-400 w-[60%] animate-pulse">
              Ajan planlıyor...
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-850 flex gap-2">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ajan ile konuşun..."
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-250 placeholder:text-zinc-650 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") sendChatMessage();
            }}
          />
          <button
            onClick={sendChatMessage}
            disabled={chatLoading || !chatInput.trim()}
            className="rounded-xl bg-zinc-100 px-3.5 py-2 text-xs font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            Gönder
          </button>
        </div>
      </aside>
    </div>
  );
}
