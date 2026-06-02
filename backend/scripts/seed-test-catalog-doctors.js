const crypto = require('crypto');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const doctorCards = [
  { fullName: 'Аскар Нурланов', specialty: 'Терапевт', experienceYears: 14, pricePrimary: 15000, city: 'Алматы', audience: 'doctor' },
  { fullName: 'Айгерим Садыкова', specialty: 'Кардиолог', experienceYears: 11, pricePrimary: 18000, city: 'Астана', audience: 'doctor' },
  { fullName: 'Ермек Жумагулов', specialty: 'Невролог', experienceYears: 16, pricePrimary: 19000, city: 'Шымкент', audience: 'doctor' },
  { fullName: 'Динара Абдрахманова', specialty: 'Эндокринолог', experienceYears: 9, pricePrimary: 17000, city: 'Алматы', audience: 'doctor' },
  { fullName: 'Руслан Тлеубергенов', specialty: 'Гастроэнтеролог', experienceYears: 13, pricePrimary: 18500, city: 'Караганда', audience: 'doctor' },
  { fullName: 'Меруерт Кенжебаева', specialty: 'Педиатр', experienceYears: 12, pricePrimary: 16000, city: 'Астана', audience: 'doctor' },
  { fullName: 'Бекзат Касымов', specialty: 'ЛОР', experienceYears: 10, pricePrimary: 15500, city: 'Алматы', audience: 'doctor' },
  { fullName: 'Ляззат Омарова', specialty: 'Дерматолог', experienceYears: 8, pricePrimary: 16500, city: 'Шымкент', audience: 'doctor' },
  { fullName: 'Самат Ибраев', specialty: 'Ортопед', experienceYears: 15, pricePrimary: 20000, city: 'Актобе', audience: 'doctor' },
  { fullName: 'Жанна Мусина', specialty: 'Гинеколог', experienceYears: 17, pricePrimary: 21000, city: 'Алматы', audience: 'doctor' },
  { fullName: 'Нуржан Сериков', specialty: 'Уролог', experienceYears: 12, pricePrimary: 18000, city: 'Астана', audience: 'doctor' },
  { fullName: 'Салтанат Бекова', specialty: 'Офтальмолог', experienceYears: 7, pricePrimary: 15000, city: 'Тараз', audience: 'doctor' },
  { fullName: 'Елдос Турсынов', specialty: 'Пульмонолог', experienceYears: 10, pricePrimary: 17500, city: 'Алматы', audience: 'doctor' },
  { fullName: 'Гульмира Куанышова', specialty: 'Ревматолог', experienceYears: 14, pricePrimary: 19000, city: 'Павлодар', audience: 'doctor' },
  { fullName: 'Арман Сулейменов', specialty: 'Инфекционист', experienceYears: 11, pricePrimary: 18500, city: 'Костанай', audience: 'doctor' },
  { fullName: 'Асем Смагулова', specialty: 'Психотерапевт', experienceYears: 12, pricePrimary: 20000, city: 'Алматы', audience: 'mental' },
  { fullName: 'Мадина Жаксылыкова', specialty: 'Психолог', experienceYears: 9, pricePrimary: 17000, city: 'Астана', audience: 'mental' },
  { fullName: 'Данияр Рахимов', specialty: 'Психосоматолог', experienceYears: 15, pricePrimary: 19000, city: 'Шымкент', audience: 'mental' },
  { fullName: 'Жазира Есенова', specialty: 'Семейный психолог', experienceYears: 8, pricePrimary: 16000, city: 'Алматы', audience: 'mental' },
  { fullName: 'Тимур Алибеков', specialty: 'Клинический психолог', experienceYears: 13, pricePrimary: 18000, city: 'Атырау', audience: 'mental' }
];

const avatarFor = (fullName) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0D47A1&color=fff`;

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zа-яё0-9]+/gi, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.{2,}/g, '.');

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
};

const weeklyAvailability = () => [
  { date: 'weekly:1', slots: ['09:00', '10:30', '14:00'] },
  { date: 'weekly:2', slots: ['09:00', '11:00', '15:00'] },
  { date: 'weekly:3', slots: ['10:00', '12:00', '16:00'] },
  { date: 'weekly:4', slots: ['09:30', '13:00', '17:00'] },
  { date: 'weekly:5', slots: ['09:00', '11:30', '14:30'] }
];

const profileFor = (entry) => ({
  avatar: avatarFor(entry.fullName),
  fullName: entry.fullName,
  specialty: entry.specialty,
  catalogAudience: entry.audience,
  bio: `${entry.specialty} с клиническим опытом ${entry.experienceYears} лет. Проводит онлайн-консультации и первичный разбор состояния пациента.`,
  headline:
    entry.audience === 'mental'
      ? 'Поддержка, разбор состояния и понятный маршрут следующего шага.'
      : 'Онлайн-консультации, структурированный разбор жалоб и понятные рекомендации.',
  languages: ['Русский', 'Қазақша'],
  consultationModes: entry.audience === 'mental' ? ['Chat', 'Video'] : ['Chat', 'Video', 'AI triage'],
  focusAreas: [entry.specialty, entry.audience === 'mental' ? 'Эмоциональное состояние' : 'Первичный прием'],
  education: ['Высшее медицинское образование', 'Повышение квалификации по специальности'],
  city: entry.city,
  clinicName: 'Takhet+ Network',
  responseTargetHours: 2,
  pricePrimary: entry.pricePrimary,
  experienceYears: entry.experienceYears,
  accepts: 'Взрослых',
  availability: weeklyAvailability()
});

async function upsertDoctor(client, entry, index) {
  const login = `catalog.${String(index + 1).padStart(2, '0')}.${slugify(entry.fullName)}@takhet.local`;
  const existingUser = await client.query('select id from public.users where email = $1 limit 1', [login]);
  const userId = existingUser.rows[0]?.id || crypto.randomUUID();

  if (!existingUser.rows[0]) {
    await client.query(
      `insert into public.users (id, email, password_hash, role, created_at)
       values ($1, $2, $3, 'doctor', now())
       on conflict (id) do nothing`,
      [userId, login, hashPassword(`catalog-disabled-${userId}`)]
    );
  }

  await client.query(
    `insert into public.doctors (id, specialization, license_number, experience_years, verified, created_at)
     values ($1, $2, $3, $4, true, now())
     on conflict (id) do update
     set specialization = excluded.specialization,
         license_number = excluded.license_number,
         experience_years = excluded.experience_years,
         verified = excluded.verified`,
    [userId, entry.specialty, `CATALOG-${String(index + 1).padStart(3, '0')}`, entry.experienceYears]
  );

  await client.query(
    `insert into public.settings (user_id, key, value)
     values ($1, 'doctor_profile', $2::jsonb)
     on conflict do nothing`,
    [userId, JSON.stringify(profileFor(entry))]
  );

  await client.query(
    `update public.settings
     set value = $3::jsonb
     where user_id = $1 and key = $2`,
    [userId, 'doctor_profile', JSON.stringify(profileFor(entry))]
  );

  return { userId, login };
}

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  try {
    const created = [];
    for (const [index, entry] of doctorCards.entries()) {
      created.push(await upsertDoctor(client, entry, index));
    }

    console.log(`Seeded catalog doctors: ${created.length}`);
    console.table(
      doctorCards.map((entry, index) => ({
        login: created[index].login,
        fullName: entry.fullName,
        specialty: entry.specialty,
        audience: entry.audience
      }))
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
