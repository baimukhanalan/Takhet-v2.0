import { useState, useEffect } from 'react';
import { getStoredLanguage, setStoredLanguage, type Language } from './language';
import { useMemo } from 'react';

const stableTranslations: Record<Language, any> = {
  ru: {
    nav: {
      patients: 'Пациентам',
      takhetAI: 'Takhet AI',
      doctors: 'Врачам',
      partners: 'Партнерам',
      mental: 'Mental',
      auth: 'Войти',
      reg: 'Регистрация'
    },
    auth: {
      login: 'Вход',
      register: 'Регистрация',
      email: 'Email',
      password: 'Пароль',
      continue: 'Продолжить',
      back: 'Назад',
      error: 'Неверная почта или пароль'
    },
    sidebar: {
      panel: 'Панель',
      takhetAI: 'Takhet AI',
      booking: 'Запись к врачу',
      mental: 'Mental',
      appointments: 'Мои записи',
      chat: 'Чат',
      archive: 'Медархив',
      services: 'Сервисы',
      settings: 'Настройки',
      logout: 'Выйти',
      billing: 'Финансы',
      reports: 'Отчеты',
      doctors: 'Врачи',
      patients: 'Пациенты',
      swarm: 'Swarm Medicine'
    },
    common: {
      logout: 'Выйти',
      loading: 'Загрузка...',
      searchPlaceholder: 'Поиск по платформе...',
      notifications: 'Уведомления',
      emptyNotifications: 'Пока нет уведомлений'
    },
    services: {
      title: 'Сервисы',
      subtitle: 'Дополнительные сервисы пациента.',
      pharmacy: 'Заказ лекарств',
      pharmacyDesc: 'Сервис временно недоступен, пока мы восстанавливаем стабильную логистику доставки.',
      homeVisit: 'Вызов врача на дом',
      homeVisitDesc: 'Раздел временно приостановлен из-за проблем с логистикой.',
      go: 'Открыть',
      safe: 'Безопасно',
      safeDesc: 'Подключаем только те сервисы, которые готовы работать стабильно и предсказуемо.',
      express: 'Статус',
      expressDesc: 'Новые заявки временно не принимаются.',
      accessible: 'Причина',
      accessibleDesc: 'Сейчас команда донастраивает маршруты, сроки и качество сервиса.'
    },
    dashboard: {
      welcome: 'Добро пожаловать',
      patient: {
        profile: 'Профиль',
        aiTitle: 'AI-разбор',
        aiDesc: 'Быстрый разбор симптомов, анализов и следующих шагов.',
        aiBtn: 'Открыть',
        pharmacy: 'Лекарства',
        pharmacyDesc: 'Сервис временно приостановлен из-за логистики.',
        homeVisit: 'Врач на дом',
        homeVisitDesc: 'Сервис временно приостановлен из-за логистики.',
        go: 'Перейти'
      },
      doctor: {
        planned: 'записей',
        expertStatus: 'Статус',
        sessions: 'Сессии',
        patients: 'Пациенты',
        revenue: 'Доход',
        load: 'Загрузка',
        weeklyRevenue: 'Доход за неделю',
        detailReport: 'Отчет',
        upcoming: 'Предстоящие',
        fullSchedule: 'График',
        join: 'Войти',
        prepare: 'Подготовиться',
        noAppts: 'Записей пока нет',
        copilotTitle: 'Координатор',
        copilotDesc: 'Помогает распределять поток, не терять важные задачи и быстрее принимать решения.',
        runAssistant: 'Открыть',
        swarm: {
          title: 'Задачи Swarm Medicine',
          points: '+50 баллов за консенсус',
          newCase: 'Новый случай',
          anonymous: 'Анонимный разбор',
          description: 'Нетипичный случай требует второго экспертного мнения для уточнения решения.',
          participate: 'Участвовать'
        }
      },
      partner: {
        orgTitle: 'Организация',
        efficiency: 'Эффективность',
        export: 'Экспорт',
        manageDocs: 'Управление',
        activeDocs: 'Врачи',
        totalConsults: 'Консультации',
        revenueMTD: 'Выручка',
        whiteLabel: 'White Label',
        growth: 'Рост',
        period: 'Период',
        verificationStatus: 'Статус',
        verified: 'Подтверждено',
        complianceDesc: 'Текущий статус соответствия и контроля качества.',
        viewCompliance: 'Открыть'
      }
    },
    mental: {
      assistant: {
        title: 'Душевный помощник',
        tag: 'Soulful Mode',
        aiDefault: 'Я рядом. Расскажи, что сейчас больше всего тревожит.',
        placeholder: 'Спокойный диалог, поддержка, тревога, перегрузка, сон.',
        inputPlaceholder: 'Напишите, что вы чувствуете...'
      }
    },
    landing: {
      whyTitle: 'Почему люди выбирают Takhet+',
      whyCards: [
        {
          title: '1. Не «погуглить симптомы», а понять, что с вами происходит',
          desc: 'Takhet+ анализирует симптомы, фото, анализы и историю здоровья, чтобы:',
          items: ['выделить реальные риски,', 'отсечь лишние тревоги,', 'подсказать, что делать дальше.'],
          footer: 'Вы получаете понятный маршрут, а не абстрактный диагноз.'
        },
        {
          title: '2. Решения, а не просто консультации',
          desc: 'В Takhet+ вы получаете:',
          grid: ['рекомендации,', 'альтернативные варианты,', 'объяснение «почему так»,', 'понимание последствий.'],
          footer: 'Вы контролируете решения, а не слепо следуете советам.'
        },
        {
          title: '3. Ваше здоровье — в динамике, а не в отдельных справках',
          desc: 'Система формирует цифровой профиль здоровья:',
          items: ['учитывает изменения со временем,', 'показывает тенденции,', 'помогает предотвращать проблемы, а не лечить последствия.']
        }
      ],
      capabilitiesTitle: 'Ключевые возможности Takhet+',
      capConsultation: {
        title: 'Онлайн-консультации врачей',
        desc: 'Видео, аудио или чат. Терапевты, узкие специалисты, психологи. Быстро, без очередей и поездок.',
        btn: 'Записаться'
      },
      capSecondary: [
        { title: 'Персональный медицинский маршрут', desc: 'Takhet+ помогает понять: к какому врачу идти, срочно или можно подождать, какие обследования действительно нужны. Без лишних трат и хаоса.' },
        { title: 'Коллективный интеллект врачей (Swarm Medicine)', desc: 'В сложных случаях ваше обращение может быть анонимно рассмотрено несколькими врачами, оценено с учетом опыта и успешных кейсов. Профессиональный консенсус.' }
      ],
      archiveTitle: 'Медицинский архив — всё в одном месте',
      archiveDesc: 'История консультаций, назначения, анализы, документы. Данные всегда под рукой и доступны только вам и тем, кому вы разрешили.',
      archiveBtn: 'Открыть архив',
      logistics: [
        { title: 'Доставка лекарств', desc: 'Сервис временно приостановлен из-за проблем с логистикой и пересборки операционного контура.' },
        { title: 'Вызов врача на дом', desc: 'Сервис временно приостановлен из-за проблем с логистикой и маршрутизацией выездов.' },
        { title: 'Забота о ментальном здоровье', desc: 'Психологи, психотерапевты, конфиденциально и удобно.' },
        { title: 'Ветеринарные консультации', desc: 'Помощь вашему питомцу: онлайн, без поездок, по записи.' }
      ],
      controlTitle: 'Ваше здоровье — под контролем',
      controlSubtitle: 'Takhet+ создан для людей, которые:',
      controlItems: ['не хотят теряться в симптомах,', 'ценят время,', 'хотят понимать последствия решений,', 'заботятся о себе и семье.'],
      philosophy: 'Takhet+ — это не просто онлайн-врачи. Это система, которая собирает ваши данные, оценивает риски и помогает выбрать лучший путь лечения — быстро, понятно и под контролем.',
      faqTitle: 'Частые вопросы',
      faqItems: [
        { q: 'Чем Takhet+ отличается от обычной телемедицины?', a: 'Takhet+ помогает не только поговорить с врачом, но и понять, что делать дальше и почему.' },
        { q: 'Это безопасно?', a: 'Да. Все данные защищены и передаются только с вашего согласия.' }
      ],
      finalCtaTitle: 'Медицина, которая думает вместе с вами.',
      finalCtaReg: 'Зарегистрироваться',
      finalCtaConsult: 'Получить консультацию',
      footerRights: '© 2026 Takhet+. Все права защищены.'
    },
    ai_consultation: {
      heroTag: 'AI-консультация',
      heroTitle: 'Почему выбирают AI-консультацию',
      heroDesc: 'Быстрый старт, понятный разбор ситуации и следующий шаг без лишней задержки.',
      payment: {
        title: 'Оплата консультации',
        subtitle: 'Доступ к AI-консультации Takhet+',
        tariff: 'Тариф',
        oneTime: 'Разовая консультация',
        price: 'Стоимость',
        currency: '₸',
        allFeatures: 'Включены чат, разбор документов и итоговый отчет',
        payKaspi: 'Оплатить',
        back: 'Назад'
      },
      room: {
        title: 'AI-консультация Takhet+',
        connected: 'Соединение активно',
        connecting: 'Подключение...',
        reconnect: 'Переподключить',
        aiSpeaking: 'AI отвечает...',
        aiListening: 'AI слушает...',
        finish: 'Завершить',
        chatTab: 'Чат и разбор',
        docsTab: 'Документы',
        docAnalysis: 'Разбор документов',
        placeholder: 'Опишите жалобу, вопрос или попросите разобрать анализы...',
        thinking: 'AI анализирует...',
        deepAnalysis: 'Глубокий разбор',
        fastSearch: 'Быстрый поиск',
        reportBtn: 'Сформировать итог',
        safePayments: 'Безопасная оплата Takhet+',
        aiAssistant: 'AI-помощник'
      }
    },
    settings: {
      tabs: {
        profile: 'Профиль',
        medical: 'Медицина',
        security: 'Безопасность',
        notifications: 'Уведомления',
        finance: 'Финансы',
        community: 'Сообщество',
        organization: 'Организация',
        integrations: 'Интеграции',
        team: 'Команда',
        legal: 'Документы'
      },
      patient: {
        fullname: 'Полное имя',
        dob: 'Дата рождения',
        gender: 'Пол',
        phone: 'Телефон',
        address: 'Адрес',
        lang: 'Язык',
        archive: 'Архив',
        export: 'Экспорт',
        subscription: 'Подписка',
        family: 'Семья',
        password: 'Пароль',
        privacy: 'Конфиденциальность'
      },
      partner: {
        name: 'Название',
        bin: 'БИН',
        team: 'Команда',
        status: 'Статус',
        emis: 'EMIS',
        emr: 'EMR',
        whiteLabel: 'White Label'
      },
      doctor: {
        pro: 'Профиль',
        specialty: 'Специальность',
        exp: 'Опыт',
        edu: 'Образование',
        social: 'Публичный профиль',
        finance: 'Финансы',
        pricePrimary: 'Основная цена',
        priceSecondary: 'Повторный прием',
        reputation: 'Рейтинг',
        complaintsChat: 'Обращения'
      }
    },
    community: {
      title: 'Сообщество Takhet+',
      desc: 'Вопросы пациентов, ответы врачей и открытый профессиональный разбор',
      postTitle: 'Задать вопрос',
      postTopic: 'Коротко сформулируйте тему вопроса',
      postBody: 'Опишите ситуацию, симптомы или контекст обращения',
      anonymous: 'Публикация анонимно',
      postBtn: 'Опубликовать',
      filterAll: 'Все вопросы',
      filterUnanswered: 'Без ответа',
      doctorReply: 'Ответ врача',
      doctorPrompt: 'Напишите ответ...',
      reputationPoints: 'Репутационные баллы',
      topDoctors: 'Лучшие врачи'
    },
    pharmacy: {
      title: 'Аптека',
      subtitle: 'Раздел временно работает как витрина, пока мы не восстановим логистику и подтверждение наличия.',
      cart: 'Корзина',
      searchPlaceholder: 'Поиск по товарам',
      total: 'Итого',
      empty: 'Корзина пуста',
      checkoutDisabled: 'Временно недоступно',
      pausedLine: 'Заказы временно приостановлены из-за проблем с логистикой и интеграцией доставки.',
      pausedAlert: 'Раздел аптеки пока работает как витрина. Оформление заказа временно отключено: логистика и подтверждение наличия проходят переработку.',
      pausedError: 'Заказ лекарств временно приостановлен: логистический контур доставки и подтверждения наличия сейчас перерабатывается.',
      categories: {
        all: 'Все',
        vitamins: 'Витамины',
        painRelief: 'Обезболивание',
        coldFlu: 'Простуда и грипп',
        personalCare: 'Уход'
      }
    },
    admin: {
      title: 'Takhet+ Admin',
      subtitle: 'Панель управления системой',
      emailPlaceholder: 'Почта администратора',
      passwordPlaceholder: 'Пароль',
      loginBtn: 'Войти в систему',
      checking: 'Проверка...',
      backToMain: 'На главную',
      error: 'Неверные данные администратора.',
      protocol: 'Контур управления Takhet+'
    }
  },
  kz: {
    nav: {
      patients: 'Пациенттерге',
      takhetAI: 'Takhet AI',
      doctors: 'Дәрігерлерге',
      partners: 'Серіктестерге',
      mental: 'Mental',
      auth: 'Кіру',
      reg: 'Тіркелу'
    },
    auth: {
      login: 'Кіру',
      register: 'Тіркелу',
      email: 'Email',
      password: 'Құпия сөз',
      continue: 'Жалғастыру',
      back: 'Артқа',
      error: 'Email немесе құпия сөз қате'
    },
    sidebar: {
      panel: 'Панель',
      takhetAI: 'Takhet AI',
      booking: 'Дәрігерге жазылу',
      mental: 'Mental',
      appointments: 'Жазбаларым',
      chat: 'Чат',
      archive: 'Медархив',
      services: 'Сервистер',
      settings: 'Баптаулар',
      logout: 'Шығу',
      billing: 'Қаржы',
      reports: 'Есептер',
      doctors: 'Дәрігерлер',
      patients: 'Пациенттер',
      swarm: 'Swarm Medicine'
    },
    common: {
      logout: 'Шығу',
      loading: 'Жүктелуде...',
      searchPlaceholder: 'Платформа бойынша іздеу...',
      notifications: 'Хабарламалар',
      emptyNotifications: 'Хабарлама жоқ'
    },
    services: {
      title: 'Сервистер',
      subtitle: 'Пациентке арналған қосымша сервистер.',
      pharmacy: 'Дәрі-дәрмек тапсырысы',
      pharmacyDesc: 'Жеткізу логистикасын тұрақтандырғанша сервис уақытша қолжетімсіз.',
      homeVisit: 'Үйге дәрігер шақыру',
      homeVisitDesc: 'Бөлім логистика мәселелеріне байланысты уақытша тоқтатылды.',
      go: 'Ашу',
      safe: 'Қауіпсіз',
      safeDesc: 'Тек тұрақты және сенімді жұмысқа дайын сервистер ғана қосылады.',
      express: 'Мәртебе',
      expressDesc: 'Жаңа өтінімдер уақытша қабылданбайды.',
      accessible: 'Себеп',
      accessibleDesc: 'Қазір команда маршруттарды, мерзімдерді және сервис сапасын реттеп жатыр.'
    },
    mental: {
      assistant: {
        title: 'Жан көмекшісі',
        tag: 'Soulful Mode',
        aiDefault: 'Мен осындамын. Қазір не мазалайтынын айтыңыз.',
        placeholder: 'Сабырлы диалог, қолдау, уайым, күйзеліс, ұйқы.',
        inputPlaceholder: 'Не сезіп тұрғаныңызды жазыңыз...'
      }
    },
    community: {
      title: 'Takhet+ қауымдастығы',
      desc: 'Пациент сұрақтары, дәрігер жауаптары және ашық кәсіби талқылау',
      postTitle: 'Сұрақ қою',
      postTopic: 'Сұрақ тақырыбын қысқаша жазыңыз',
      postBody: 'Жағдайды, симптомдарды немесе контексті сипаттаңыз',
      anonymous: 'Анонимді жариялау',
      postBtn: 'Жариялау',
      filterAll: 'Барлық сұрақтар',
      filterUnanswered: 'Жауапсыз',
      doctorReply: 'Дәрігер жауабы',
      doctorPrompt: 'Жауап жазыңыз...',
      reputationPoints: 'Репутациялық ұпайлар',
      topDoctors: 'Үздік дәрігерлер'
    },
    pharmacy: {
      title: 'Дәріхана',
      subtitle: 'Логистика мен қолжетімділікті растау қалпына келгенше бөлім уақытша витрина ретінде жұмыс істейді.',
      cart: 'Себет',
      searchPlaceholder: 'Тауар іздеу',
      total: 'Жиыны',
      empty: 'Себет бос',
      checkoutDisabled: 'Уақытша қолжетімсіз',
      pausedLine: 'Тапсырыстар логистика және жеткізу интеграциясындағы мәселелерге байланысты уақытша тоқтатылды.',
      pausedAlert: 'Дәріхана бөлімі әзірге витрина ретінде жұмыс істейді. Тапсырыс беру уақытша өшірілген: логистика мен қолжетімділікті растау қайта реттеліп жатыр.',
      pausedError: 'Дәрі-дәрмек тапсырысы уақытша тоқтатылды: жеткізу логистикасы мен қолжетімділікті растау контуры қайта өңделуде.',
      categories: {
        all: 'Барлығы',
        vitamins: 'Витаминдер',
        painRelief: 'Ауырсынуды басу',
        coldFlu: 'Тұмау және суық тию',
        personalCare: 'Күтім'
      }
    },
    landing: {
      whyTitle: 'Неліктен адамдар Takhet+ таңдайды',
      capabilitiesTitle: 'Takhet+ негізгі мүмкіндіктері',
      archiveTitle: 'Медициналық мұрағат — бәрі бір жерде',
      archiveBtn: 'Мұрағатты ашу',
      controlTitle: 'Сіздің денсаулығыңыз — бақылауда',
      controlSubtitle: 'Takhet+ мына адамдарға арналған:',
      faqTitle: 'Жиі қойылатын сұрақтар',
      finalCtaTitle: 'Сізбен бірге ойлайтын медицина.',
      finalCtaReg: 'Тіркелу',
      finalCtaConsult: 'Кеңес алу',
      footerRights: '© 2026 Takhet+. Барлық құқықтар қорғалған.'
    }
  },
  en: {
    nav: {
      patients: 'Patients',
      takhetAI: 'Takhet AI',
      doctors: 'Doctors',
      partners: 'Partners',
      mental: 'Mental',
      auth: 'Sign in',
      reg: 'Register'
    },
    auth: {
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      continue: 'Continue',
      back: 'Back',
      error: 'Invalid email or password'
    },
    sidebar: {
      panel: 'Dashboard',
      takhetAI: 'Takhet AI',
      booking: 'Book a doctor',
      mental: 'Mental',
      appointments: 'Appointments',
      chat: 'Chat',
      archive: 'Archive',
      services: 'Services',
      settings: 'Settings',
      logout: 'Logout',
      billing: 'Finances',
      reports: 'Reports',
      doctors: 'Doctors',
      patients: 'Patients',
      swarm: 'Swarm Medicine'
    },
    common: {
      logout: 'Logout',
      loading: 'Loading...',
      searchPlaceholder: 'Search platform...',
      notifications: 'Notifications',
      emptyNotifications: 'No notifications yet'
    },
    services: {
      title: 'Services',
      subtitle: 'Additional patient services.',
      pharmacy: 'Medicine ordering',
      pharmacyDesc: 'This service is temporarily unavailable while delivery logistics are being stabilized.',
      homeVisit: 'Doctor home visit',
      homeVisitDesc: 'This section is temporarily paused due to logistics issues.',
      go: 'Open',
      safe: 'Safe',
      safeDesc: 'Only services ready for stable and predictable operation are being enabled.',
      express: 'Status',
      expressDesc: 'New requests are temporarily disabled.',
      accessible: 'Reason',
      accessibleDesc: 'Routes, timing and service quality are currently being refined.'
    },
    mental: {
      assistant: {
        title: 'Soulful assistant',
        tag: 'Soulful Mode',
        aiDefault: 'I am here. Tell me what feels hardest right now.',
        placeholder: 'Calm dialogue, support, anxiety, overload, sleep.',
        inputPlaceholder: 'Write what you feel...'
      }
    },
    community: {
      title: 'Takhet+ Community',
      desc: 'Patient questions, doctor replies and open professional discussion',
      postTitle: 'Ask a question',
      postTopic: 'Briefly describe the topic',
      postBody: 'Describe the situation, symptoms or context',
      anonymous: 'Publish anonymously',
      postBtn: 'Publish',
      filterAll: 'All questions',
      filterUnanswered: 'Unanswered',
      doctorReply: 'Doctor reply',
      doctorPrompt: 'Write a reply...',
      reputationPoints: 'Reputation points',
      topDoctors: 'Top doctors'
    },
    pharmacy: {
      title: 'Pharmacy',
      subtitle: 'This section currently works as a showcase while logistics and stock confirmation are being restored.',
      cart: 'Cart',
      searchPlaceholder: 'Search products',
      total: 'Total',
      empty: 'Cart is empty',
      checkoutDisabled: 'Temporarily unavailable',
      pausedLine: 'Orders are temporarily paused due to logistics and delivery integration issues.',
      pausedAlert: 'The pharmacy section currently works as a showcase. Checkout is temporarily disabled while logistics and stock confirmation are being reworked.',
      pausedError: 'Medicine ordering is temporarily paused while delivery logistics and stock confirmation are being rebuilt.',
      categories: {
        all: 'All',
        vitamins: 'Vitamins',
        painRelief: 'Pain relief',
        coldFlu: 'Cold and flu',
        personalCare: 'Personal care'
      }
    },
    landing: {
      whyTitle: 'Why People Choose Takhet+',
      capabilitiesTitle: 'Key Capabilities of Takhet+',
      archiveTitle: 'Medical Archive — All in One Place',
      archiveBtn: 'Open archive',
      controlTitle: 'Your Health — Under Control',
      controlSubtitle: 'Takhet+ is created for people who:',
      faqTitle: 'Frequently Asked Questions',
      finalCtaTitle: 'Medicine that thinks with you.',
      finalCtaReg: 'Register',
      finalCtaConsult: 'Get Consultation',
      footerRights: '© 2026 Takhet+. All rights reserved.'
    }
  }
};

const mergeDeep = (base: any, override: any): any => {
  if (!override) return base;
  if (Array.isArray(base) || Array.isArray(override)) return override ?? base;
  if (typeof base !== 'object' || base === null) return override ?? base;
  if (typeof override !== 'object' || override === null) return override ?? base;

  const result: any = { ...base };
  for (const key of Object.keys(override)) {
    result[key] = key in base ? mergeDeep(base[key], override[key]) : override[key];
  }
  return result;
};

const isCorruptedText = (value: unknown) => {
  return (
    typeof value === 'string' &&
    (value.includes('�') ||
      value.includes('вЂ') ||
      value.includes('В©') ||
      value.includes('???') ||
      value.includes('Рџ') ||
      value.includes('РЎ') ||
      value.includes('Рќ') ||
      value.includes('Р‘') ||
      value.includes('Р§') ||
      value.includes('Рњ') ||
      value.includes('Р—') ||
      value.includes('Р’С‹') ||
      value.includes('РџР°С†'))
  );
};

const sanitizeTranslations = (current: any, ...fallbacks: any[]): any => {
  if (Array.isArray(current)) {
    return current.map((item, index) =>
      sanitizeTranslations(
        item,
        ...fallbacks.map((fallback) => (Array.isArray(fallback) ? fallback[index] : undefined))
      )
    );
  }

  if (typeof current === 'object' && current !== null) {
    const result: Record<string, any> = {};
    const keys = new Set([
      ...Object.keys(current),
      ...fallbacks.flatMap((fallback) => (fallback && typeof fallback === 'object' ? Object.keys(fallback) : []))
    ]);

    for (const key of keys) {
      result[key] = sanitizeTranslations(
        current?.[key],
        ...fallbacks.map((fallback) => (fallback && typeof fallback === 'object' ? fallback[key] : undefined))
      );
    }

    return result;
  }

  if (!isCorruptedText(current)) return current;

  for (const fallback of fallbacks) {
    const cleaned = sanitizeTranslations(fallback);
    if (typeof cleaned === 'string' && !isCorruptedText(cleaned)) {
      return cleaned;
    }
  }

  return current;
};

export const useLanguage = () => {
  const [lang, setLang] = useState<Language>(getStoredLanguage());
  const [loadedTranslations, setLoadedTranslations] = useState<Partial<Record<Language, any>> | null>(null);

  useEffect(() => {
    const handleUpdate = () => setLang(getStoredLanguage());
    window.addEventListener('storage_update', handleUpdate);
    return () => window.removeEventListener('storage_update', handleUpdate);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void import('./i18n')
      .then((module) => {
        if (!cancelled) {
          setLoadedTranslations(module.translations as Partial<Record<Language, any>>);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedTranslations(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const tObject = useMemo(
    () =>
      sanitizeTranslations(
        mergeDeep(loadedTranslations?.[lang], stableTranslations[lang]),
        stableTranslations[lang],
        loadedTranslations?.en,
        stableTranslations.en
      ),
    [lang, loadedTranslations]
  );

  const t = useMemo(() => {
    const translator = (path: string) => {
      if (typeof path !== 'string') return path;
      const keys = path.split('.');
      let current: any = tObject;
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return path;
        }
      }
      return current;
    };

    Object.assign(translator, tObject);
    return translator as any;
  }, [tObject]);

  const setLanguage = (newLang: Language) => {
    setStoredLanguage(newLang);
    setLang(newLang);
  };

  const toggleLang = () => {
    const newLang = lang === 'ru' ? 'kz' : 'ru';
    setLanguage(newLang);
  };

  return { lang, t: t as any, toggleLang, setLanguage };
};
