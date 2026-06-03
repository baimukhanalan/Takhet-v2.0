import React, { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, CreditCard, FileText, Mail, RotateCcw, ShieldCheck } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import ComplianceFooter from '../components/ComplianceFooter';
import { FadeIn } from '../components/FadeIn';

type LegalKind = 'offer' | 'privacy' | 'refund' | 'terms' | 'contacts';

type LegalSection = {
  title: string;
  body: string[];
};

const paymentMethods = 'Visa, Mastercard, Halyk QR';

const pageCopy: Record<LegalKind, { title: string; eyebrow: string; description: string; icon: React.ElementType; sections: LegalSection[] }> = {
  offer: {
    title: 'Публичная оферта',
    eyebrow: 'Offer / Terms',
    description: 'Условия использования цифровых медицинских сервисов Takhet+ и оформления онлайн-услуг.',
    icon: FileText,
    sections: [
      {
        title: '1. Общие положения',
        body: [
          'ИП "Алам", БИН 850707401371, ADDRESS предоставляет пользователям информационную платформу для записи к специалистам, онлайн-консультаций, работы с медицинскими документами и цифровыми сервисами поддержки здоровья.',
          'Платформа не является системой экстренной медицинской помощи. При признаках угрозы жизни или резком ухудшении состояния необходимо обращаться в скорую помощь или профильные службы.'
        ]
      },
      {
        title: '2. Предмет услуги',
        body: [
          'Пользователь может оформить запись к врачу, получить онлайн-консультацию, загрузить медицинские материалы, получить информационную поддержку и итоговые документы в рамках доступных функций платформы.',
          'Информация, сформированная цифровыми инструментами Takhet+, носит справочный и организационный характер и не заменяет очный прием, диагностику и назначения лицензированного врача.'
        ]
      },
      {
        title: '3. Оплата и доставка услуги',
        body: [
          `Оплата может приниматься банковскими картами и доступными методами интернет-эквайринга: ${paymentMethods}.`,
          'Услуга считается оказанной после проведения консультации, предоставления доступа к цифровому сервису или формирования результата, предусмотренного выбранным сервисом.'
        ]
      }
    ]
  },
  privacy: {
    title: 'Политика конфиденциальности',
    eyebrow: 'Privacy Policy',
    description: 'Как Takhet+ обрабатывает персональные данные и медицинскую информацию пользователей.',
    icon: ShieldCheck,
    sections: [
      {
        title: '1. Какие данные обрабатываются',
        body: [
          'Платформа может обрабатывать имя, контакты, данные аккаунта, информацию о записи, историю обращений, документы, загруженные пользователем, и технические данные, необходимые для работы сервиса.',
          'Данные используются для авторизации, записи на консультации, коммуникации, предоставления медицинской информационной поддержки, формирования документов и выполнения требований безопасности.'
        ]
      },
      {
        title: '2. Защита данных',
        body: [
          'Takhet+ применяет организационные и технические меры защиты, ограничивает доступ к данным по ролям и использует защищенные каналы передачи информации.',
          'Медицинская информация доступна только пользователю и специалистам, которым она необходима для оказания выбранной услуги.'
        ]
      },
      {
        title: '3. Контакты по вопросам данных',
        body: [
          'По вопросам доступа, исправления или удаления данных пользователь может обратиться в службу поддержки: takhetplus@gmail.com, +7 (778) 532 4978.'
        ]
      }
    ]
  },
  refund: {
    title: 'Политика возврата',
    eyebrow: 'Refund Policy',
    description: 'Условия отмены, возврата и обработки технических сбоев при оплате онлайн-услуг.',
    icon: RotateCcw,
    sections: [
      {
        title: '1. Отмена консультации',
        body: [
          'Пользователь может запросить отмену консультации до ее начала через доступные каналы поддержки или интерфейс платформы, если такая возможность предусмотрена выбранной услугой.',
          'Если консультация уже началась или была оказана, возврат рассматривается индивидуально с учетом фактического оказания услуги.'
        ]
      },
      {
        title: '2. Технический сбой',
        body: [
          'Если услуга не была предоставлена из-за подтвержденного технического сбоя платформы или платежной инфраструктуры, пользователь может запросить повторное оказание услуги или возврат.',
          'Для проверки обращения может потребоваться номер заказа, дата оплаты, контактный телефон или email.'
        ]
      },
      {
        title: '3. Сроки возврата',
        body: [
          'После подтверждения основания возврата заявка передается на обработку. Срок зачисления зависит от банка-эмитента и правил платежной системы.',
          'Возврат производится тем же способом, которым была совершена оплата, если иное не требуется правилами банка или платежного провайдера.'
        ]
      }
    ]
  },
  terms: {
    title: 'Пользовательские условия',
    eyebrow: 'Terms of Service',
    description: 'Правила использования аккаунта, консультаций, медархива и цифровых сервисов Takhet+.',
    icon: FileText,
    sections: [
      {
        title: '1. Аккаунт и доступ',
        body: [
          'Пользователь отвечает за корректность указанных контактных данных, безопасность доступа к аккаунту и своевременное обновление личной информации.',
          'Отдельные разделы платформы могут быть доступны только после регистрации, подтверждения контактов, оплаты или проверки роли.'
        ]
      },
      {
        title: '2. Медицинская информация',
        body: [
          'Пользователь самостоятельно принимает решение о предоставлении медицинских документов и информации специалисту.',
          'Результаты цифровой обработки материалов являются информационной поддержкой и должны интерпретироваться совместно с медицинским специалистом.'
        ]
      },
      {
        title: '3. Ограничения',
        body: [
          'Платформа не предназначена для экстренной помощи, самостоятельной постановки диагноза или гарантированного результата лечения.',
          'При остром состоянии, сильной боли, нарушении сознания, одышке, кровотечении или других опасных симптомах необходимо обращаться за неотложной помощью.'
        ]
      }
    ]
  },
  contacts: {
    title: 'Контакты',
    eyebrow: 'Contacts',
    description: 'Информация для связи, обращений по оплате, консультациям и работе цифровой платформы.',
    icon: Mail,
    sections: [
      {
        title: 'Компания',
        body: ['ИП "Алам"', 'БИН: 850707401371', 'ADDRESS']
      },
      {
        title: 'Поддержка',
        body: [
          'Email: takhetplus@gmail.com',
          'Телефон: +7 (778) 532 4978',
          'Время обработки обращений: в рабочие часы службы поддержки. Срочные медицинские состояния не обрабатываются через этот канал.'
        ]
      },
      {
        title: 'Оплата',
        body: [
          `Доступные способы оплаты: ${paymentMethods}.`,
          'По вопросам платежа, отмены или возврата укажите номер заказа, дату платежа и контактные данные.'
        ]
      }
    ]
  }
};

const LegalPage: React.FC<{ kind: LegalKind }> = ({ kind }) => {
  const location = useLocation();
  const copy = pageCopy[kind];
  const Icon = copy.icon;

  const meta = useMemo(
    () => ({
      title: `${copy.title} | Takhet+`,
      description: copy.description
    }),
    [copy.description, copy.title]
  );

  useEffect(() => {
    document.title = meta.title;
    const updateMeta = (name: string, value: string, attr: 'name' | 'property' = 'name') => {
      let node = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
      if (!node) {
        node = document.createElement('meta');
        node.setAttribute(attr, name);
        document.head.appendChild(node);
      }
      node.content = value;
    };

    updateMeta('description', meta.description);
    updateMeta('og:title', meta.title, 'property');
    updateMeta('og:description', meta.description, 'property');
    updateMeta('og:type', 'website', 'property');
  }, [meta]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader activePath={location.pathname} />
      <main className="px-4 pb-20 pt-32 sm:px-6 lg:px-10 xl:px-20">
        <section className="mx-auto max-w-6xl">
          <FadeIn direction="up">
            <Link to="/" className="mb-10 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Link>
          </FadeIn>

          <FadeIn direction="up" delay={0.1}>
            <div className="relative overflow-hidden rounded-[3rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/50 sm:p-12 lg:rounded-[4rem] lg:p-16">
              <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-28 left-10 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
              <div className="relative z-10 grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
                <div className="space-y-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary text-white shadow-xl shadow-primary/20">
                    <Icon className="h-8 w-8" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">{copy.eyebrow}</p>
                  <h1 className="text-4xl font-black tracking-tighter text-slate-950 sm:text-5xl lg:text-6xl">{copy.title}</h1>
                </div>
                <div className="space-y-6">
                  <p className="text-lg font-semibold leading-8 text-slate-600">{copy.description}</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {['Visa', 'Mastercard', 'Halyk QR'].map((method) => (
                      <div key={method} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-600">
                        {method}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <div className="mt-10 grid gap-6">
            {copy.sections.map((section, index) => (
              <FadeIn key={section.title} direction="up" delay={index * 0.08}>
                <article className="rounded-[2rem] border border-slate-100 bg-white p-7 shadow-sm sm:p-9">
                  <h2 className="text-2xl font-black tracking-tight text-slate-900">{section.title}</h2>
                  <div className="mt-5 space-y-4">
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="text-base font-medium leading-8 text-slate-600">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </article>
              </FadeIn>
            ))}
          </div>

          <FadeIn direction="up" delay={0.2}>
            <div className="mt-10 rounded-[2rem] border border-primary/15 bg-primary/5 p-6 text-sm font-bold leading-7 text-slate-600">
              <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                <CreditCard className="h-4 w-4" />
                Payment compliance
              </div>
              <p>
                Оплата услуг проводится через защищенную платежную инфраструктуру. Перед оплатой пользователь видит стоимость, выбранную услугу, условия оказания и возможность обращения в поддержку по вопросам отмены или возврата.
              </p>
            </div>
          </FadeIn>
        </section>
      </main>
      <ComplianceFooter />
    </div>
  );
};

export default LegalPage;
