# Automation OS — Teslim Maratonu

Bu liste, yalnızca gerçek çalışan kod tamamlandığında işaretlenir. Migration'lar proje içindeki `supabase/migrations/` altında saklanır; remote uygulama son aşamadadır.

## 1. Database, güvenlik ve tenancy

- [x] Supabase CLI proje yapısı ve sürümlü migration klasörü
- [x] Workspace, üyelik, workflow, execution, queue, Social ve CRM temel tabloları
- [x] Workspace bazlı RLS politikaları, audit log ve credential tablosu
- [ ] Migration'ı remote Supabase'e uygula ve advisor/RLS izolasyon testini çalıştır
- [ ] Secret encryption, credential CRUD/test UI ve masked preview
- [ ] Usage metering, retention ve dead-letter operasyon ekranları

## 2. Native workflow engine

- [x] Native builder, node registry, draft save ve immutable activate sürümü
- [x] Manual, Set Fields, If, HTTP (SSRF korumalı), AI, Telegram, CRM create node'ları
- [x] Execution/node log kayıtları, hata normalizasyonu, queue claim worker altyapısı
- [ ] Retry/backoff, timeout, cancel, pause/resume, idempotency ve rate-limit UI
- [ ] Webhook trigger/test listener/response node ve schedule trigger görsel editörü
- [ ] Realtime execution updates, execution detail drawer, retry-from-node
- [ ] Sub-workflow, approval/wait, merge/loop ve güvenli Code node feature flag'i

## 3. Social OS

- [x] Content queue veri modeli ve native taslak ekranı
- [x] Süreli, hash'li approval request başlangıcı
- [ ] Brand Studio, Idea Bank, Content Studio, Calendar, Approval Center, Analytics UI
- [ ] Telegram inline callback doğrulama, replay koruması ve waiting execution resume
- [ ] X OAuth, post/thread/media publish, idempotency/retry ve metrics fetch
- [ ] Meta/Instagram OAuth, media container/reel/carousel publish ve status polling
- [ ] Günlük AI içerik workflow template'i, publish scheduler ve Telegram bildirimleri

## 4. CRM workspace

- [x] Workspace CRM custom-table API başlangıcı ve engine CRM create action
- [ ] Field CRUD, record CRUD/upsert, relation/formula, table/kanban/calendar views
- [ ] CRM created/updated/stage trigger'ları ve workflow mapping UI
- [ ] Contacts/companies/deals/tasks migration ve kullanıcı arayüzleri

## 5. Settings ve product UX

- [ ] Workspace/members/roles/permissions UI
- [ ] Providers, OAuth, credentials, webhooks, notifications ve security settings UI
- [ ] Onboarding, template gallery, empty/loading/error states, responsive QA
- [ ] n8n migration/compatibility import aracı ve eski iframe assetlerinin kaldırılması

## 6. Production hardening ve teslim

- [ ] Unit: graph, expressions, retry, crypto, schedule, SSRF, idempotency
- [ ] Integration: workflow/manual/webhook/schedule/approval/CRM/RLS
- [ ] E2E: builder → activate → trigger → execution detail → retry
- [ ] Load/recovery: queue stall, worker restart, provider rate limit
- [ ] README, architecture, node authoring, OAuth, worker, incident ve env docs
- [ ] Remote migration + DB advisors + tenant isolation doğrulaması
- [ ] Full lint/typecheck/test/build, commit ve tek final push
