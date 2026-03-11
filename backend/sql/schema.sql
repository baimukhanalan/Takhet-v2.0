-- Takhet+ backend schema (MVP + phase-2/3 expansion)
create extension if not exists "uuid-ossp";

-- CORE
create table if not exists users (id uuid primary key default uuid_generate_v4(), email text unique not null, role text not null, disabled boolean default false, created_at timestamptz default now());
create table if not exists roles (id uuid primary key default uuid_generate_v4(), code text unique, name text);
create table if not exists permissions (id uuid primary key default uuid_generate_v4(), code text unique, description text);
create table if not exists sessions (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id), device_id text, expires_at timestamptz);
create table if not exists devices (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id), platform text, push_token text);
create table if not exists audit_logs (id uuid primary key default uuid_generate_v4(), event text not null, actor_id uuid not null, payload jsonb default '{}'::jsonb, created_at timestamptz default now());
create table if not exists notifications (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id), title text, body text, is_read boolean default false, created_at timestamptz default now());
create table if not exists settings (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id), key text, value jsonb);

-- PATIENTS
create table if not exists patients (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id), birth_date date, gender text, created_at timestamptz default now());
create table if not exists patient_profiles (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), anamnesis text, chronic_conditions text, allergies text);
create table if not exists patient_contacts (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), phone text, emergency_name text, emergency_phone text);
create table if not exists patient_addresses (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), address_line text, city text, is_primary boolean default false);
create table if not exists patient_insurance (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), provider text, policy_number text, valid_until date);
create table if not exists patient_preferences (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), timezone text, notification_mode text);
create table if not exists patient_conditions (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), title text, status text);
create table if not exists patient_allergies (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), allergen text, reaction text);
create table if not exists patient_medications (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), title text, dosage text);
create table if not exists patient_family_history (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), condition text, relation text);

-- DOCTORS
create table if not exists doctors (id uuid primary key default uuid_generate_v4(), full_name text not null, specialty text not null, active boolean default true, bio text default '', approved_by uuid, created_at timestamptz default now(), updated_at timestamptz default now());
create table if not exists doctor_profiles (id uuid primary key default uuid_generate_v4(), doctor_id uuid references doctors(id), bio text, experience_years int);
create table if not exists doctor_specialties (id uuid primary key default uuid_generate_v4(), doctor_id uuid references doctors(id), code text, label text);
create table if not exists doctor_licenses (id uuid primary key default uuid_generate_v4(), doctor_id uuid references doctors(id), license_number text, valid_until date);
create table if not exists doctor_availability (id uuid primary key default uuid_generate_v4(), doctor_id uuid references doctors(id), starts_at timestamptz, ends_at timestamptz, mode text);
create table if not exists doctor_reviews (id uuid primary key default uuid_generate_v4(), doctor_id uuid references doctors(id), patient_id uuid references patients(id), review text, created_at timestamptz default now());
create table if not exists doctor_ratings (id uuid primary key default uuid_generate_v4(), doctor_id uuid references doctors(id), score numeric(2,1), source text);
create table if not exists doctor_payouts (id uuid primary key default uuid_generate_v4(), doctor_id uuid references doctors(id), amount bigint, period_start date, period_end date);
create table if not exists doctor_sessions (id uuid primary key default uuid_generate_v4(), doctor_id uuid references doctors(id), session_date timestamptz, mode text);

-- CONSULTATIONS / CASES
create table if not exists cases (id uuid primary key default uuid_generate_v4(), patient_id uuid not null, doctor_id uuid, status text default 'open', summary text not null, created_at timestamptz default now());
create table if not exists consultations (id uuid primary key default uuid_generate_v4(), case_id uuid references cases(id), mode text, started_at timestamptz, ended_at timestamptz);
create table if not exists consultation_messages (id uuid primary key default uuid_generate_v4(), consultation_id uuid references consultations(id), author_id uuid references users(id), body text, created_at timestamptz default now());
create table if not exists consultation_notes (id uuid primary key default uuid_generate_v4(), consultation_id uuid references consultations(id), doctor_id uuid references doctors(id), note text, created_at timestamptz default now());
create table if not exists consultation_files (id uuid primary key default uuid_generate_v4(), consultation_id uuid references consultations(id), file_id uuid, uploaded_at timestamptz default now());
create table if not exists consultation_status (id uuid primary key default uuid_generate_v4(), case_id uuid references cases(id), from_status text, to_status text, changed_at timestamptz default now());
create table if not exists treatment_plans (id uuid primary key default uuid_generate_v4(), case_id uuid references cases(id), plan_json jsonb, created_at timestamptz default now());
create table if not exists follow_up_tasks (id uuid primary key default uuid_generate_v4(), case_id uuid references cases(id), task text, due_at timestamptz, done boolean default false);

-- MEDICAL RECORDS
create table if not exists medical_records (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), case_id uuid references cases(id), summary text, created_at timestamptz default now());
create table if not exists diagnoses (id uuid primary key default uuid_generate_v4(), record_id uuid references medical_records(id), code text, title text, confidence numeric(5,2));
create table if not exists symptoms (id uuid primary key default uuid_generate_v4(), record_id uuid references medical_records(id), label text, severity text);
create table if not exists vitals (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), heart_rate int, systolic int, diastolic int, measured_at timestamptz default now());
create table if not exists lab_results (id uuid primary key default uuid_generate_v4(), record_id uuid references medical_records(id), marker text, value text, unit text, range_text text);
create table if not exists prescriptions (id uuid primary key default uuid_generate_v4(), case_id uuid references cases(id), doctor_id uuid references doctors(id), patient_id uuid references patients(id), status text, created_at timestamptz default now());
create table if not exists procedures (id uuid primary key default uuid_generate_v4(), record_id uuid references medical_records(id), title text, details text);
create table if not exists imaging_results (id uuid primary key default uuid_generate_v4(), record_id uuid references medical_records(id), modality text, findings text);
create table if not exists documents (id uuid primary key default uuid_generate_v4(), case_id uuid references cases(id), type text, title text, created_at timestamptz default now());
create table if not exists document_versions (id uuid primary key default uuid_generate_v4(), document_id uuid references documents(id), version int, payload jsonb, created_at timestamptz default now());
create table if not exists medications (id uuid primary key default uuid_generate_v4(), prescription_id uuid references prescriptions(id), title text, dosage text, duration_days int);
create table if not exists care_pathways (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), pathway text, stage text, updated_at timestamptz default now());

-- AI
create table if not exists triage_sessions (id uuid primary key default uuid_generate_v4(), patient_id uuid not null, symptoms text not null, ai_result jsonb default '{}'::jsonb, created_at timestamptz default now());
create table if not exists ai_evaluations (id uuid primary key default uuid_generate_v4(), triage_id uuid references triage_sessions(id), model text, output jsonb, created_at timestamptz default now());
create table if not exists ai_recommendations (id uuid primary key default uuid_generate_v4(), triage_id uuid references triage_sessions(id), recommendation text, priority text);
create table if not exists ai_risk_scores (id uuid primary key default uuid_generate_v4(), triage_id uuid references triage_sessions(id), risk_code text, risk_value numeric(5,2));
create table if not exists ai_symptom_vectors (id uuid primary key default uuid_generate_v4(), triage_id uuid references triage_sessions(id), vector jsonb);

-- PAYMENTS
create table if not exists payments (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id), case_id uuid references cases(id), amount bigint, currency text default 'KZT', status text, provider text default 'kaspi', provider_id text, provider_payment_id text unique, created_at timestamptz default now());
create table if not exists payment_methods (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id), provider text, token text, is_default boolean default false);
create table if not exists transactions (id uuid primary key default uuid_generate_v4(), payment_id uuid references payments(id), amount bigint, status text, raw_payload jsonb, created_at timestamptz default now());
create table if not exists refunds (id uuid primary key default uuid_generate_v4(), payment_id uuid references payments(id), amount bigint, reason text, status text);
create table if not exists invoices (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id), total bigint, status text, due_at timestamptz);
create table if not exists subscriptions (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id), plan_code text, status text, renews_at timestamptz);

-- HEALTH TRACKING
create table if not exists health_metrics (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), metric text, value numeric, measured_at timestamptz default now());
create table if not exists sleep_data (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), duration_minutes int, quality_score int, date date);
create table if not exists activity_data (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), steps int, calories int, date date);
create table if not exists nutrition_logs (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), calories int, protein numeric, carbs numeric, fats numeric, date date);
create table if not exists glucose_logs (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), value numeric, measured_at timestamptz default now());
create table if not exists blood_pressure_logs (id uuid primary key default uuid_generate_v4(), patient_id uuid references patients(id), systolic int, diastolic int, measured_at timestamptz default now());

-- CONTENT / COMMUNITY
create table if not exists articles (id uuid primary key default uuid_generate_v4(), title text, body text, author_id uuid references users(id), published_at timestamptz);
create table if not exists article_categories (id uuid primary key default uuid_generate_v4(), code text unique, title text);
create table if not exists article_views (id uuid primary key default uuid_generate_v4(), article_id uuid references articles(id), user_id uuid references users(id), viewed_at timestamptz default now());
create table if not exists comments (id uuid primary key default uuid_generate_v4(), article_id uuid references articles(id), user_id uuid references users(id), body text, created_at timestamptz default now());
create table if not exists likes (id uuid primary key default uuid_generate_v4(), article_id uuid references articles(id), user_id uuid references users(id), created_at timestamptz default now());
create table if not exists bookmarks (id uuid primary key default uuid_generate_v4(), article_id uuid references articles(id), user_id uuid references users(id), created_at timestamptz default now());

-- GAMIFICATION
create table if not exists achievements (id uuid primary key default uuid_generate_v4(), code text unique, title text, description text);
create table if not exists user_points (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id), points int default 0, updated_at timestamptz default now());
create table if not exists health_goals (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id), goal_type text, target_value numeric, starts_at date, ends_at date);
create table if not exists goal_progress (id uuid primary key default uuid_generate_v4(), goal_id uuid references health_goals(id), progress_value numeric, logged_at timestamptz default now());
create table if not exists leaderboards (id uuid primary key default uuid_generate_v4(), scope text, period text, ranking jsonb);

-- SIGNATURES + SECURITY
create table if not exists signatures (id uuid primary key default uuid_generate_v4(), user_id uuid not null, document_id uuid not null, signature_hash text not null, created_at timestamptz default now());
create table if not exists document_signatures (id uuid primary key default uuid_generate_v4(), document_id uuid references documents(id), signature_id uuid references signatures(id), signed_at timestamptz default now());
create table if not exists login_attempts (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id), ip text, success boolean, created_at timestamptz default now());
create table if not exists access_logs (id uuid primary key default uuid_generate_v4(), user_id uuid references users(id), endpoint text, method text, created_at timestamptz default now());
create table if not exists security_events (id uuid primary key default uuid_generate_v4(), event text, severity text, details jsonb, created_at timestamptz default now());
