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

insert into clinics (id, name, license_number, address, partner_user_id)
values ('66666666-6666-6666-6666-666666666666', 'Takhet Clinic Hub', 'KZ-LIC-001', 'Almaty, Demo Street 1', '33333333-3333-3333-3333-333333333333')
on conflict (id) do update
set name = excluded.name,
    license_number = excluded.license_number,
    address = excluded.address,
    partner_user_id = excluded.partner_user_id;

insert into doctors (id, full_name, specialty, active, clinic_id)
values ('22222222-2222-2222-2222-222222222222', 'Dr. Takhet Demo', 'General Practice', true, '66666666-6666-6666-6666-666666666666')
on conflict (id) do update
set full_name = excluded.full_name,
    specialty = excluded.specialty,
    active = excluded.active,
    clinic_id = excluded.clinic_id;

insert into patients (id, user_id, birth_date, gender)
values ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', date '2000-01-01', 'unspecified')
on conflict (id) do update
set user_id = excluded.user_id,
    birth_date = excluded.birth_date,
    gender = excluded.gender;

insert into cases (id, patient_id, doctor_id, clinic_id, status, summary)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'consultation_finished', 'Headache and low fever for 2 days'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', null, null, 'payment_pending', 'Follow-up consultation request')
on conflict (id) do update
set patient_id = excluded.patient_id,
    doctor_id = excluded.doctor_id,
    clinic_id = excluded.clinic_id,
    status = excluded.status,
    summary = excluded.summary;

insert into payments (id, user_id, case_id, clinic_id, amount, gross_amount, currency, status, provider)
values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', 10000, 10000, 'KZT', 'paid', 'kaspi'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', null, 10000, 10000, 'KZT', 'pending', 'kaspi')
on conflict (id) do update
set status = excluded.status,
    amount = excluded.amount,
    gross_amount = excluded.gross_amount,
    clinic_id = excluded.clinic_id;

insert into doctor_earnings (doctor_id, case_id, payment_id, gross_amount, doctor_share, clinic_share, platform_share, hold_until, status)
values ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 10000, 7000, 1000, 2000, now() + interval '7 days', 'hold')
on conflict do nothing;

insert into platform_commission (case_id, payment_id, amount)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 2000)
on conflict do nothing;

insert into clinic_commission (clinic_id, case_id, amount)
values ('66666666-6666-6666-6666-666666666666', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1000)
on conflict do nothing;
