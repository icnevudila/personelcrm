# Native Automation OS — architecture

## Current vertical slice

The application uses its own workflow definition and executor; no product route renders an n8n iframe. `/dashboard/automations` and the legacy `/dashboard/n8n` URL both open the native builder.

The implemented path is:

```text
Builder draft → validation → test execution + immutable job snapshot
  → jobs queue → /api/automation/worker → node executor
  → workflow_executions + node_executions + execution_logs
  → execution detail polling in the builder
```

The first runnable node chain is `Manual Trigger → Set Fields → If → HTTP Request → AI Chat → Telegram Send`. HTTP nodes reject localhost, private ranges and non-HTTP protocols. AI reports `not configured` instead of pretending a provider exists. The Telegram node uses the existing server-side bot configuration.

## Data isolation

All Automation OS records carry `workspace_id`. The first migration creates the data model and the second migration adds explicit Data API grants plus role-aware policies:

- `viewer`: workspace reads
- `analyst`: workspace reads
- `operator`: execution operation scope (reserved for worker/run APIs)
- `builder`: workflow, social and CRM configuration writes
- `admin`, `owner`: all builder capabilities

Credentials and jobs have no authenticated-client policies. They remain service-role/worker-only. Execution previews and logs redact keys matching `token`, `secret`, `password`, `authorization`, and `api_key`.

## Deployment

1. Apply both files in `supabase/migrations/` to the intended Supabase project.
2. Add `SUPABASE_SERVICE_ROLE_KEY` and a strong `CRON_SECRET` to the server environment.
3. Deploy `vercel.json`; it invokes `/api/automation/worker` each minute. Vercel supplies `Authorization: Bearer $CRON_SECRET` for cron requests.
4. Configure one of `XAI_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `GROQ_API_KEY` and the existing Telegram variables before placing those nodes in an active workflow.
5. Register the exact callback URLs `APP_URL/api/oauth/x/callback` and `APP_URL/api/oauth/instagram/callback` in the X and Meta developer consoles. X needs `tweet.read`, `tweet.write`, `users.read`, and `offline.access`; Instagram publishing requires an eligible Business/Creator account connected through a Meta page.

X OAuth PKCE, encrypted connection storage, direct X text publishing, and the Instagram single-image media-container publish path are implemented. X/Meta developer approval, account eligibility, token refresh, media upload/processing polling, webhook triggers, scheduled triggers, human approval nodes, custom CRM views, and a separately scaled continuous worker remain deployment or next-phase work. Do not represent an unconfigured provider as connected in the UI.

## Node authoring

Add a registry entry in `lib/automation/schema.js`, validate its configuration in `validateNodeConfig`, then add its executor branch in `lib/automation/engine.js`. Every executor must return a JSON-serializable output, throw `AutomationError` for user-safe failures, avoid exposing secrets in its output, and supply retryability accurately. Add a focused test in `tests/automation.test.js` before exposing the node in `components/automation/AutomationBuilder.js`.
