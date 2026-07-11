create extension if not exists "uuid-ossp";

create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  update_public_token text unique,

  name text not null,
  description text,
  setup_prompt text default '',

  type text default 'landing_page'
    check (type in ('landing_page','saas','mobile_app')),

  payment_status text default 'pending' check (payment_status in ('pending','paid')),
  status text default 'created'
    check (status in ('created','preparing','coding','completed')),

  admin_note text,

  is_archived boolean default false,
  is_favorited boolean default false,

  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table project_todos (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,

  title text not null,
  is_completed boolean default false,
  sort_order integer not null default 0,

  color text check (color is null or color in ('blue','amber','rose')),
  is_archived boolean default false,
  is_later boolean not null default false,
  is_deleted boolean not null default false,
  deleted_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Mevcut veritabanı için (bir kez):
-- alter table project_todos add column if not exists is_deleted boolean not null default false;
-- alter table project_todos add column if not exists deleted_at timestamptz;
-- alter table project_todos add column if not exists is_later boolean not null default false;

create index idx_project_todos_project_id on project_todos(project_id);
create index idx_project_todos_project_sort on project_todos(project_id, sort_order);
create index idx_project_todos_active on project_todos(project_id) where is_deleted = false;

-- Kullanıcı öncelikli hedefleri (dashboard hedef yönetimi)
create table user_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  progress integer not null default 0
    check (progress >= 0 and progress <= 100),
  sort_order integer not null default 0,
  is_archived boolean not null default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table user_goal_subgoals (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid not null references user_goals(id) on delete cascade,

  title text not null,
  progress integer not null default 0
    check (progress >= 0 and progress <= 100),
  sort_order integer not null default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_user_goals_user_id on user_goals(user_id);
create index idx_user_goals_user_sort on user_goals(user_id, sort_order);
create index idx_user_goal_subgoals_goal_id on user_goal_subgoals(goal_id);
create index idx_user_goal_subgoals_goal_sort on user_goal_subgoals(goal_id, sort_order);

-- Proje hedefleri (proje özeti hedef yönetimi)
create table project_goals (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,

  title text not null,
  progress integer not null default 0
    check (progress >= 0 and progress <= 100),
  sort_order integer not null default 0,
  is_archived boolean not null default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table project_goal_subgoals (
  id uuid primary key default uuid_generate_v4(),
  goal_id uuid not null references project_goals(id) on delete cascade,

  title text not null,
  progress integer not null default 0
    check (progress >= 0 and progress <= 100),
  sort_order integer not null default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_project_goals_project_id on project_goals(project_id);
create index idx_project_goals_project_sort on project_goals(project_id, sort_order);
create index idx_project_goal_subgoals_goal_id on project_goal_subgoals(goal_id);
create index idx_project_goal_subgoals_goal_sort on project_goal_subgoals(goal_id, sort_order);

create table project_mvp_features (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,

  title text not null,
  description text default '',

  label text check (label is null or label in ('mvp', 'normal', 'later')),
  sort_order integer not null default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_project_mvp_features_project_id on project_mvp_features(project_id);
create index idx_project_mvp_features_project_sort on project_mvp_features(project_id, sort_order);

create table domains (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,

  domain text not null,

  is_primary boolean default false,

  availability_status text default 'checking'
    check (availability_status in ('available','unavailable','invalid','checking')),

  purchase_status text default 'not_purchased'
    check (purchase_status in ('not_purchased','pending','purchased')),

  vercel_status text default 'pending'
    check (vercel_status in ('pending','connected','failed')),

  created_at timestamp default now()
);
create index idx_domains_project_id on domains(project_id);


-- Sitede yer alan sayfalar (kurulum formundaki pages listesi ile senkron)
create table site_pages (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,

  title text not null,
  sort_order int not null default 0,

  created_at timestamptz default now()
);
create index idx_site_pages_project_id on site_pages(project_id);
create index idx_site_pages_project_sort on site_pages(project_id, sort_order);


create table installation_forms (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid unique references projects(id) on delete cascade,

  public_token text unique not null,

  -- İş akışı (proje yönetimi / kurulum); UI ile uyumlu İngilizce değerler
  status text default 'pending'
    check (status in ('pending','in_review','in_progress','completed')),

  -- BASIC
  business_name text,
  contact_name text,
  contact_phone text,
  contact_phone_has_whatsapp boolean default false,
  landline_phone text,

  email text,
  address text,
  google_maps_link text,
  working_hours text,

  sector text,

  -- MEDIA
  logo_url text,
  logo_generate boolean default false,
  logo_ai_urls text[] default array[]::text[],

  gallery_images text[],

  -- CONTENT
  services jsonb,
  service_regions jsonb,
  menu_items jsonb,

  -- SOCIAL
  social_links jsonb,

  -- DOMAIN (birden fazla aday domain)
  requested_domains text[] default array[]::text[],

  -- BRAND
  color_palette jsonb,
  color_palette_mode text default 'preset'
    check (color_palette_mode in ('ai','preset','manual')),
  color_generate boolean default false,
  color_ai_palettes jsonb default '[]'::jsonb,
  brand_tone text check (brand_tone in ('formal','friendly','young','premium')),

  -- COMPETITOR
  competitor_website text,
  similarity_level text check (similarity_level in ('low','medium','high')),

  -- GOAL
  main_goal text check (main_goal in ('search','whatsapp','reservation','order')),

  -- AI CONTENT
  about_text text,
  about_generate boolean default false,
  slogan text,

  -- LEGAL
  kvkk_required boolean default false,
  privacy_required boolean default false,

  -- Sayfa listesi: site_pages tablosunda (project_id ile)
  -- authorized_person_name -> deleted
  -- INTERNAL CONTACT (CRM iç iletişim)
  authorized_person_phone text,

  -- Site hakkında genel istek/not alanı (admin + ekip kullanımı)
  site_requests text,

  is_completed boolean default false,

  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Eski veritabanlarında installation_forms.pages kaldırmak için (bir kez):
-- alter table installation_forms drop column if exists pages;


create table update_requests (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,

  status text default 'pending'
    check (status in ('pending','in_progress','completed','cancelled')),

  title text not null,
  pages text[],
  custom_page text,

  description text,

  created_by uuid references auth.users(id),

  created_at timestamp default now(),
  updated_at timestamp default now()
);


create table update_request_images (
  id uuid primary key default uuid_generate_v4(),
  update_request_id uuid references update_requests(id) on delete cascade,

  image_url text,

  created_at timestamp default now()
);


create table site_settings (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid unique references projects(id) on delete cascade,

  google_analytics_id text,
  google_search_console text,
  supabase_account text,

  created_at timestamp default now(),
  updated_at timestamp default now()
);






CREATE TABLE crm_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);


CREATE TABLE crm_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  group_id uuid REFERENCES crm_groups(id) ON DELETE CASCADE,

  -- CSV’den gelen alanlar
  business_name text,
  maps_url text,
  phone_number text,
  province text,
  district text,
  rating numeric,
  review_count integer,

  -- CRM alanları
  status text DEFAULT 'pending'
    CHECK (status IN ('pending', 'callback', 'positive', 'negative')),

  note text DEFAULT '',

  callback_date timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status_changed_at timestamptz
);

CREATE INDEX idx_crm_customers_group_status 
ON crm_customers(group_id, status);

-- crm_customers otomatik zaman alanları
CREATE OR REPLACE FUNCTION set_crm_customers_timestamps()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_crm_customers_timestamps ON crm_customers;
CREATE TRIGGER trg_set_crm_customers_timestamps
BEFORE UPDATE ON crm_customers
FOR EACH ROW
EXECUTE FUNCTION set_crm_customers_timestamps();


-- =========================
-- AI Logo Generator
-- =========================

create table if not exists logo_generations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  created_by uuid references auth.users(id) on delete cascade,

  fixed_prompt text default '',
  user_prompt text default '',
  full_prompt text default '',

  -- public storage url
  logo_url text not null,
  -- bucket içi yol (debug/yeniden kullanım için)
  storage_path text not null,

  created_at timestamptz not null default now()
);

create index if not exists idx_logo_generations_project_id_created_at
  on logo_generations(project_id, created_at desc);

create index if not exists idx_logo_generations_created_by_created_at
  on logo_generations(created_by, created_at desc);

-- DB Schema Planner (proje başına bir tasarım)
create table if not exists project_db_schemas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id) on delete cascade,

  project_context text default '',

  -- { tables: [{ id, name, x, y, columns: [{ id, name, type, isPk, fkRef? }] }] }
  schema_data jsonb not null default '{"tables":[]}'::jsonb,

  -- [{ id, role, content, schemaSnapshot? }] — schemaSnapshot yalnızca user mesajlarında
  chat_messages jsonb not null default '[]'::jsonb,

  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_project_db_schemas_project_id
  on project_db_schemas(project_id);

-- Keyword Explorer Modül Tabloları

create table keyword_groups (
    id uuid primary key default gen_random_uuid(),

    project_id uuid not null references projects(id) on delete cascade,

    name text not null,

    sort_order integer default 0,

    created_at timestamptz default now()
);

create table keyword_group_items (
    id uuid primary key default gen_random_uuid(),

    keyword_group_id uuid not null references keyword_groups(id) on delete cascade,

    value text not null,

    created_at timestamptz default now()
);


create table keyword_candidates (
    id uuid primary key default gen_random_uuid(),

    project_id uuid not null references projects(id) on delete cascade,

    keyword text not null,

    source text not null,

    score integer default 0,

    search_intent text,

    cluster_name text,

    city text,

    district text,

    selected boolean default false,

    metadata jsonb,

    parent_id uuid references keyword_candidates(id) on delete cascade,

    created_at timestamptz default now()
);


create table project_keywords (
    id uuid primary key default gen_random_uuid(),

    project_id uuid not null references projects(id) on delete cascade,

    keyword text not null,

    score integer,

    search_intent text,

    cluster_name text,

    status text default 'pending',

    source text,

    created_at timestamptz default now()
);

create table keyword_clusters (
    id uuid primary key default gen_random_uuid(),

    project_id uuid not null references projects(id) on delete cascade,

    name text not null,

    description text,

    created_at timestamptz default now()
);


create table keyword_cluster_items (
    id uuid primary key default gen_random_uuid(),

    cluster_id uuid references keyword_clusters(id) on delete cascade,

    keyword_id uuid references project_keywords(id) on delete cascade
);

create table seo_settings (
    project_id uuid primary key references projects(id) on delete cascade,

    weekly_content_goal integer default 5,

    auto_generate_keywords boolean default true,

    auto_cluster_keywords boolean default true,

    auto_detect_intent boolean default true,

    created_at timestamptz default now()
);

create table keyword_generation_jobs (
    id uuid primary key default gen_random_uuid(),

    project_id uuid not null references projects(id),

    status text default 'pending',

    source text,

    total_keywords integer default 0,

    processed_keywords integer default 0,

    created_at timestamptz default now(),

    completed_at timestamptz
);

-- =========================
-- Deep Work (Odak Çalışma)
-- =========================

create table deep_work_tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  description text default '',

  status text not null default 'todo'
    check (status in ('todo', 'doing', 'done', 'archive')),

  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high')),

  estimated_minutes integer not null default 0,
  worked_minutes integer not null default 0,
  sort_order integer not null default 0,

  project_id uuid references projects(id) on delete set null,
  planned_date date,
  is_today_plan boolean not null default false,

  completed_at timestamptz,
  archived_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_deep_work_tasks_user_id on deep_work_tasks(user_id);
create index idx_deep_work_tasks_status on deep_work_tasks(user_id, status);
create index idx_deep_work_tasks_planned_date on deep_work_tasks(user_id, planned_date);
create index idx_deep_work_tasks_today_plan on deep_work_tasks(user_id, is_today_plan);

create table deep_work_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references deep_work_tasks(id) on delete cascade,

  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes integer not null default 0,

  session_type text not null default 'focus'
    check (session_type in ('focus', 'break'))
);

create index idx_deep_work_sessions_user_id on deep_work_sessions(user_id);
create index idx_deep_work_sessions_task_id on deep_work_sessions(task_id);
create index idx_deep_work_sessions_active on deep_work_sessions(user_id) where ended_at is null;

create table daily_reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,

  review_date date not null,
  today_summary text default '',
  tomorrow_first_task text default '',
  notes text default '',

  created_at timestamptz not null default now(),

  unique (user_id, review_date)
);

create index idx_daily_reviews_user_date on daily_reviews(user_id, review_date);

create table deep_work_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,

  daily_goal_minutes integer not null default 120,
  pomodoro_work_minutes integer not null default 25,
  pomodoro_break_minutes integer not null default 5,

  updated_at timestamptz not null default now()
);

-- =========================
-- Marketing Blueprint (Marketing OS)
-- =========================

create table marketing_blueprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id) on delete cascade,

  stage text not null default 'idea'
    check (stage in ('idea','validation','mvp','beta','launch','growth','scale')),

  marketing_score integer default 0 check (marketing_score >= 0 and marketing_score <= 100),
  score_summary text default '',
  score_gaps jsonb not null default '[]'::jsonb,

  target_audience text default '',
  problem text default '',
  solution text default '',
  competitors text default '',
  value_proposition text default '',

  organic_percentage integer default 50 check (organic_percentage >= 0 and organic_percentage <= 100),
  paid_percentage integer default 50 check (paid_percentage >= 0 and paid_percentage <= 100),

  funnel_data jsonb not null default '{
    "awareness": "",
    "interest": "",
    "signup": "",
    "activation": "",
    "revenue": "",
    "referral": ""
  }'::jsonb,

  reverse_engineering jsonb not null default '{
    "product": "",
    "landing": "",
    "pricing": "",
    "ads": "",
    "seo": "",
    "content": "",
    "funnel": "",
    "notes": ""
  }'::jsonb,

  notes text default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_marketing_blueprints_project_id on marketing_blueprints(project_id);

create table marketing_channels (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references marketing_blueprints(id) on delete cascade,

  platform text not null,
  enabled boolean not null default false,
  priority text default 'medium' check (priority in ('low','medium','high')),
  notes text default '',

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (blueprint_id, platform)
);

create index idx_marketing_channels_blueprint_id on marketing_channels(blueprint_id);

create table marketing_content_categories (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references marketing_blueprints(id) on delete cascade,

  category text not null,
  weekly_target integer not null default 0 check (weekly_target >= 0),

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (blueprint_id, category)
);

create index idx_marketing_content_categories_blueprint_id on marketing_content_categories(blueprint_id);

create table marketing_contents (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references marketing_blueprints(id) on delete cascade,

  title text not null,
  category text default '',
  platform text default '',
  planned_date date,
  status text not null default 'planned'
    check (status in ('planned','preparing','ready','published')),
  notes text default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_marketing_contents_blueprint_id on marketing_contents(blueprint_id);
create index idx_marketing_contents_planned_date on marketing_contents(blueprint_id, planned_date);

create table marketing_tasks (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references marketing_blueprints(id) on delete cascade,

  title text not null,
  description text default '',
  platform text default '',
  stage text default 'idea'
    check (stage in ('idea','validation','mvp','beta','launch','growth','scale')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  assigned_to text default '',
  due_date date,
  status text not null default 'todo'
    check (status in ('todo','in_progress','done')),
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_marketing_tasks_blueprint_id on marketing_tasks(blueprint_id);
create index idx_marketing_tasks_status on marketing_tasks(blueprint_id, status);

create table marketing_weekly_tasks (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references marketing_blueprints(id) on delete cascade,

  title text not null,
  description text default '',
  due_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  assigned_to text default '',
  status text not null default 'todo'
    check (status in ('todo','doing','done')),
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_marketing_weekly_tasks_blueprint_id on marketing_weekly_tasks(blueprint_id);
create index idx_marketing_weekly_tasks_status on marketing_weekly_tasks(blueprint_id, status);

create table marketing_launch_checklist (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references marketing_blueprints(id) on delete cascade,

  item_name text not null,
  completed boolean not null default false,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (blueprint_id, item_name)
);

create index idx_marketing_launch_checklist_blueprint_id on marketing_launch_checklist(blueprint_id);

create table marketing_competitors (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references marketing_blueprints(id) on delete cascade,

  competitor_name text not null,
  website text default '',
  strengths text default '',
  weaknesses text default '',
  strategy text default '',
  notes text default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_marketing_competitors_blueprint_id on marketing_competitors(blueprint_id);

create table marketing_kpis (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null unique references marketing_blueprints(id) on delete cascade,

  visitors numeric default 0,
  downloads numeric default 0,
  signups numeric default 0,
  active_users numeric default 0,
  mrr numeric default 0,
  conversion_rate numeric default 0,
  cac numeric default 0,
  ltv numeric default 0,
  email_subscribers numeric default 0,
  followers numeric default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_marketing_kpis_blueprint_id on marketing_kpis(blueprint_id);

-- =========================
-- Product Blueprint
-- =========================

create table project_blueprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id) on delete cascade,

  short_description text default '',
  elevator_pitch text default '',
  problem text default '',
  solution text default '',

  target_audience text default '',
  industry text default '',
  country text default '',
  user_type text default '',
  company_type text default '',

  ideal_customer_profile jsonb not null default '{
    "user_profile": "",
    "company_size": "",
    "employee_count": "",
    "estimated_budget": "",
    "decision_maker": "",
    "technical_level": ""
  }'::jsonb,

  value_proposition text default '',

  monetization_model jsonb not null default '{
    "models": [],
    "price_note": ""
  }'::jsonb,

  roadmap_stage text not null default 'idea'
    check (roadmap_stage in ('idea','validation','mvp','beta','launch','growth','scale')),

  vision text default '',
  mission text default '',
  long_term_goal text default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_project_blueprints_project_id on project_blueprints(project_id);

create table blueprint_features (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references project_blueprints(id) on delete cascade,

  title text not null,
  description text default '',
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  is_mvp boolean not null default false,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_blueprint_features_blueprint_id on blueprint_features(blueprint_id);

create table blueprint_success_metrics (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references project_blueprints(id) on delete cascade,

  title text not null,
  target_value text default '',
  current_value text default '',
  completed boolean not null default false,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_blueprint_success_metrics_blueprint_id on blueprint_success_metrics(blueprint_id);

create table blueprint_competitors (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references project_blueprints(id) on delete cascade,

  competitor_name text not null,
  website text default '',
  strengths text default '',
  weaknesses text default '',
  differentiation text default '',
  notes text default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_blueprint_competitors_blueprint_id on blueprint_competitors(blueprint_id);

create table blueprint_tech_stack (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references project_blueprints(id) on delete cascade,

  technology text not null,
  category text default 'other'
    check (category in ('frontend','backend','database','ai','payment','hosting','analytics','other')),
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_blueprint_tech_stack_blueprint_id on blueprint_tech_stack(blueprint_id);

create table blueprint_mvp_items (
  id uuid primary key default gen_random_uuid(),
  blueprint_id uuid not null references project_blueprints(id) on delete cascade,

  title text not null,
  description text default '',
  stage text not null default 'mvp'
    check (stage in ('mvp','next_version','future')),
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_blueprint_mvp_items_blueprint_id on blueprint_mvp_items(blueprint_id);
create index idx_blueprint_mvp_items_stage on blueprint_mvp_items(blueprint_id, stage);

-- =========================
-- Proje İsim Bulucu
-- =========================

create table project_name_candidates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,

  name text not null,
  notes text default '',
  source text not null default 'manual' check (source in ('manual', 'ai')),
  is_favorited boolean not null default false,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_project_name_candidates_project_id on project_name_candidates(project_id);
create index idx_project_name_candidates_favorited on project_name_candidates(project_id, is_favorited desc, sort_order);

-- =========================
-- Slogan & Satış Metinleri
-- =========================

create table project_slogans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,

  content text not null,
  copy_type text not null default 'slogan'
    check (copy_type in ('slogan', 'sales_copy', 'tagline', 'headline')),
  notes text default '',
  source text not null default 'manual' check (source in ('manual', 'ai')),
  is_favorited boolean not null default false,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_project_slogans_project_id on project_slogans(project_id);
create index idx_project_slogans_favorited on project_slogans(project_id, is_favorited desc, sort_order);

-- =========================
-- Telegram AI COO Bot
-- =========================

create table telegram_chat_history (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  message text not null default '',
  project_id uuid references projects(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_telegram_chat_history_user_created
  on telegram_chat_history(telegram_user_id, created_at desc);

create index idx_telegram_chat_history_project
  on telegram_chat_history(project_id) where project_id is not null;

create table telegram_sessions (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null unique,
  current_project_id uuid references projects(id) on delete set null,
  last_context jsonb not null default '{}'::jsonb,
  last_message_at timestamptz,
  updated_at timestamptz not null default now()
);

create index idx_telegram_sessions_project
  on telegram_sessions(current_project_id) where current_project_id is not null;

create table telegram_ai_logs (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint,
  action text not null default '',
  intent text default '',
  token_usage integer default 0,
  response_time_ms integer default 0,
  created_at timestamptz not null default now()
);

create index idx_telegram_ai_logs_created
  on telegram_ai_logs(created_at desc);

create index idx_telegram_ai_logs_action
  on telegram_ai_logs(action, created_at desc);

-- =========================
-- Kullanıcı RoadMap Canvas
-- =========================
-- Supabase Table Editor'de default alanına SADECE ham JSON yapıştırın (tırnak ve ::jsonb YOK):
-- {"viewport":{"scrollX":0,"scrollY":0},"nodes":[],"edges":[],"annotations":[]}
-- Mevcut tabloda default güncellemek için aşağıdaki "RoadMap migration" bölümünü SQL Editor'de çalıştırın.

create table user_roadmaps (
  user_id uuid primary key references auth.users(id) on delete cascade,

  canvas_data jsonb not null default '{"viewport":{"scrollX":0,"scrollY":0},"nodes":[],"edges":[],"annotations":[]}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- Proje RoadMap Canvas
-- =========================

create table project_roadmaps (
  project_id uuid primary key references projects(id) on delete cascade,

  -- { viewport: { scrollX, scrollY }, nodes: [...], edges: [...], annotations: [...] }
  canvas_data jsonb not null default '{"viewport":{"scrollX":0,"scrollY":0},"nodes":[],"edges":[],"annotations":[]}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_project_roadmaps_updated_at on project_roadmaps(updated_at desc);

-- =========================
-- RoadMap migration (mevcut tablolar için — SQL Editor'de çalıştırın)
-- Tabloda kayıt varken Table Editor default alanı hata verebilir; bu blok güvenlidir.
-- Mevcut satırlar değişmez; yalnızca yeni kayıtların varsayılanı güncellenir.
-- =========================

-- alter table user_roadmaps
--   alter column canvas_data set default '{"viewport":{"scrollX":0,"scrollY":0},"nodes":[],"edges":[],"annotations":[]}'::jsonb;

-- alter table project_roadmaps
--   alter column canvas_data set default '{"viewport":{"scrollX":0,"scrollY":0},"nodes":[],"edges":[],"annotations":[]}'::jsonb;

-- =========================
-- CopyFast (Görsel → Tasarım Prompt)
-- =========================

create table copyfast_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  parent_id uuid references copyfast_items(id) on delete cascade,

  item_type text not null check (item_type in ('page', 'component')),
  name text not null,
  description text default '',

  web_image_url text,
  mobile_image_url text,
  is_responsive boolean not null default false,
  use_ai boolean not null default false,

  status text not null default 'pending'
    check (status in ('pending', 'generating', 'generated', 'error')),
  error_message text,
  generated_prompt text default '',

  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_copyfast_items_project_id on copyfast_items(project_id);
create index idx_copyfast_items_parent_id on copyfast_items(parent_id);
create index idx_copyfast_items_project_sort on copyfast_items(project_id, sort_order);
create index idx_copyfast_items_status on copyfast_items(project_id, status);

create table copyfast_meta (
  project_id uuid primary key references projects(id) on delete cascade,

  project_prompt text default '',
  project_prompt_status text not null default 'pending'
    check (project_prompt_status in ('pending', 'generating', 'generated', 'error')),
  project_prompt_error text,

  updated_at timestamptz not null default now()
);

-- MVP: tablo RLS kapalı
-- CopyFast records belong to the owner of their project. API routes also
-- verify access, but RLS keeps the Data API safe if it is reached directly.
alter table copyfast_items enable row level security;
alter table copyfast_meta enable row level security;

drop policy if exists "copyfast_items_select_own_project" on copyfast_items;
drop policy if exists "copyfast_items_insert_own_project" on copyfast_items;
drop policy if exists "copyfast_items_update_own_project" on copyfast_items;
drop policy if exists "copyfast_items_delete_own_project" on copyfast_items;
drop policy if exists "copyfast_meta_select_own_project" on copyfast_meta;
drop policy if exists "copyfast_meta_insert_own_project" on copyfast_meta;
drop policy if exists "copyfast_meta_update_own_project" on copyfast_meta;
drop policy if exists "copyfast_meta_delete_own_project" on copyfast_meta;

create policy "copyfast_items_select_own_project" on copyfast_items for select to authenticated using (exists (select 1 from projects where projects.id = copyfast_items.project_id and projects.user_id = (select auth.uid())));
create policy "copyfast_items_insert_own_project" on copyfast_items for insert to authenticated with check (exists (select 1 from projects where projects.id = copyfast_items.project_id and projects.user_id = (select auth.uid())));
create policy "copyfast_items_update_own_project" on copyfast_items for update to authenticated using (exists (select 1 from projects where projects.id = copyfast_items.project_id and projects.user_id = (select auth.uid()))) with check (exists (select 1 from projects where projects.id = copyfast_items.project_id and projects.user_id = (select auth.uid())));
create policy "copyfast_items_delete_own_project" on copyfast_items for delete to authenticated using (exists (select 1 from projects where projects.id = copyfast_items.project_id and projects.user_id = (select auth.uid())));
create policy "copyfast_meta_select_own_project" on copyfast_meta for select to authenticated using (exists (select 1 from projects where projects.id = copyfast_meta.project_id and projects.user_id = (select auth.uid())));
create policy "copyfast_meta_insert_own_project" on copyfast_meta for insert to authenticated with check (exists (select 1 from projects where projects.id = copyfast_meta.project_id and projects.user_id = (select auth.uid())));
create policy "copyfast_meta_update_own_project" on copyfast_meta for update to authenticated using (exists (select 1 from projects where projects.id = copyfast_meta.project_id and projects.user_id = (select auth.uid()))) with check (exists (select 1 from projects where projects.id = copyfast_meta.project_id and projects.user_id = (select auth.uid())));
create policy "copyfast_meta_delete_own_project" on copyfast_meta for delete to authenticated using (exists (select 1 from projects where projects.id = copyfast_meta.project_id and projects.user_id = (select auth.uid())));

-- =========================
-- CopyFast Storage (crm-copyfast bucket)
-- MVP: storage.objects üzerinde açık politikalar
-- =========================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'crm-copyfast',
  'crm-copyfast',
  true,
  10485760,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "copyfast_storage_select" on storage.objects;
drop policy if exists "copyfast_storage_insert" on storage.objects;
drop policy if exists "copyfast_storage_update" on storage.objects;
drop policy if exists "copyfast_storage_delete" on storage.objects;

create policy "copyfast_storage_select"
  on storage.objects for select
  using (bucket_id = 'crm-copyfast');

create policy "copyfast_storage_insert"
  on storage.objects for insert
  with check (bucket_id = 'crm-copyfast');

create policy "copyfast_storage_update"
  on storage.objects for update
  using (bucket_id = 'crm-copyfast')
  with check (bucket_id = 'crm-copyfast');

create policy "copyfast_storage_delete"
  on storage.objects for delete
  using (bucket_id = 'crm-copyfast');

-- Mevcut veritabanı için (bir kez — SQL Editor'de çalıştırın):
-- alter table copyfast_items disable row level security;
-- alter table copyfast_meta disable row level security;
-- insert into storage.buckets ... (yukarıdaki insert)
-- drop/create policy ... (yukarıdaki storage politikaları)
-- update storage.buckets set file_size_limit = 10485760 where id = 'crm-copyfast';

