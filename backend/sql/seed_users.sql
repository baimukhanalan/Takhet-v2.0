-- Seed core users and MVP domain data

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

insert into cases (id, patient_id, doctor_id, status, summary)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'consultation_finished', 'Headache and low fever for 2 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', null, 'payment_pending', 'Follow-up consultation request')
on conflict (id) do update
set patient_id = excluded.patient_id,
    doctor_id = excluded.doctor_id,
    status = excluded.status,
    summary = excluded.summary;

insert into payments (id, user_id, case_id, amount, currency, status, provider)
values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 10000, 'KZT', 'paid', 'kaspi'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 10000, 'KZT', 'pending', 'kaspi')
on conflict (id) do update
set status = excluded.status,
    amount = excluded.amount;

insert into documents (id, case_id, patient_id, doctor_id, type, status, title)
values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'report', 'signed', 'Medical report #1')
on conflict (id) do update
set status = excluded.status,
    title = excluded.title;

insert into document_versions (id, document_id, version_number, payload_json, pdf_path, created_by)
values ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1, '{"complaints":"Headache","recommendations":["rest","hydration"]}'::jsonb, 'documents-signed/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee/v1.pdf', '22222222-2222-2222-2222-222222222222')
on conflict (id) do update
set pdf_path = excluded.pdf_path,
    payload_json = excluded.payload_json;

insert into signatures (id, user_id, document_id, signature_hash)
values ('abababab-abab-abab-abab-abababababab', '22222222-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'demo-hash-signature')
on conflict (id) do update
set signature_hash = excluded.signature_hash;

insert into rtc_sessions (id, case_id, doctor_id, patient_id, status, started_at, ended_at, duration)
values ('12121212-1212-1212-1212-121212121212', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'ended', now() - interval '20 minutes', now() - interval '5 minutes', 900)
on conflict (id) do update
set status = excluded.status,
    duration = excluded.duration;

insert into doctor_earnings (doctor_id, payment_id, amount)
values ('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 7000)
on conflict do nothing;

insert into platform_commission (payment_id, amount)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 3000)
on conflict do nothing;

insert into notifications (user_id, title, body)
values
  ('44444444-4444-4444-4444-444444444444', 'Document ready', 'Your signed medical report is available in archive.'),
  ('22222222-2222-2222-2222-222222222222', 'Consultation completed', 'Case aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa completed.')
on conflict do nothing;
