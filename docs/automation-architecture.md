# Native Automation OS

## İlk dikey dilim

`/dashboard/automations` kendi canvas'ını, node registry'sini ve API katmanını kullanır. n8n iframe'i route tarafından artık render edilmez.

- Workflow taslağı: `workflows.draft_definition` JSONB
- Yayınlanan sürüm: `workflow_versions` immutable snapshot
- Çalışmalar: `workflow_executions`, `node_executions`, `execution_logs`
- Dayanıklı iş: `jobs` + `job_attempts`; `claim_automation_job()` atomik kilit kullanır
- Tenant sınırı: her uygulama verisinde `workspace_id`, RLS policy ve server-side membership kontrolü

## Güvenlik sınırları

- Credential payload'ları sadece `credentials.encrypted_payload` içinde tutulur; bu tabloya browser policy verilmez.
- Expression dili yalnızca izinli yol erişimi destekler; JavaScript değerlendirmez.
- HTTP node localhost, private IP, link-local IP ve yalnızca HTTP dışı protokolleri engeller.
- API anahtarları yalnızca server route/worker içinde okunur. `NEXT_PUBLIC_` ile secret eklemeyin.

## Worker dağıtımı

Production'da `/api/automation/worker` endpoint'ini ayrı worker process veya güvenli scheduler ile tetikleyin. İstek `Authorization: Bearer $CRON_SECRET` içermelidir. Vercel tek başına uzun çalışan worker yerine queue tüketen ayrı process için uygun değildir.

## Uygulama adımları

1. `supabase/migrations/202607140001_native_automation_core.sql` migration'ını Supabase CLI ile uygulayın.
2. `.env.example` değerlerini server ortamında doldurun.
3. Bir kullanıcı giriş yaptığında kişisel workspace otomatik oluşturulur.
4. Automations ekranında workflow oluşturun, node'ları bağlayın, taslağı kaydedin ve test edin.

## Bilinen ilk dilim sınırları

Human approval, webhook/schedule trigger, OAuth credential vault UI, X/Instagram publish ve custom CRM record node'ları veri modelinde hazırlanmıştır ancak bu değişiklikte production entegrasyonu tamamlanmamıştır. Bunlar yapılandırılmış değilken UI başarılı bağlantı göstermeyecek şekilde tasarlanmalıdır.
