-- Seed core role users after schema + RLS setup
-- id values are aligned with auth.service JWT subject ids

insert into users (id, email, role, disabled)
values
  ('11111111-1111-1111-1111-111111111111', 'baimukhanalan1@gmail.com', 'admin', false),
  ('22222222-2222-2222-2222-222222222222', 'doctor@takhet.local', 'doctor', false),
  ('33333333-3333-3333-3333-333333333333', 'partner@takhet.local', 'partner', false),
  ('44444444-4444-4444-4444-444444444444', 'patient@takhet.local', 'patient', false)
on conflict (id) do update
set email = excluded.email,
    role = excluded.role,
    disabled = excluded.disabled;

insert into doctors (id, full_name, specialty, active)
values ('22222222-2222-2222-2222-222222222222', 'Dr. Takhet Demo', 'General Practice', true)
on conflict (id) do update
set full_name = excluded.full_name,
    specialty = excluded.specialty,
    active = excluded.active;

insert into patients (id, user_id, birth_date, gender)
values ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', date '2000-01-01', 'unspecified')
on conflict (id) do update
set user_id = excluded.user_id,
    birth_date = excluded.birth_date,
    gender = excluded.gender;
