export type LocalizedText = {
  ru: string;
  kk: string;
  en: string;
};

export type ServiceDetail = {
  id: string;
  title: LocalizedText;
  short: LocalizedText;
  what: LocalizedText;
  why: LocalizedText;
  forWho: LocalizedText[];
  includes: LocalizedText[];
  status: LocalizedText;
  note: LocalizedText;
};

export const serviceCatalog: ServiceDetail[] = [
  {
    id: 'pharmacy',
    title: {
      ru: 'Заказ лекарств',
      kk: 'Дәрі-дәрмек тапсырысы',
      en: 'Medicine ordering',
    },
    short: {
      ru: 'Помогает быстро оформить запрос на нужные лекарства без лишних звонков и уточнений.',
      kk: 'Қажетті дәрілерге сұранысты артық қоңыраусыз және нақтылаусыз жылдам рәсімдеуге көмектеседі.',
      en: 'Helps patients request needed medicines without unnecessary calls or back-and-forth.',
    },
    what: {
      ru: 'Это сервис для пациентов, которым нужно удобно передать запрос на лекарства и получить понятный дальнейший сценарий.',
      kk: 'Бұл дәріге сұранысты ыңғайлы жіберіп, келесі қадамды түсінікті түрде алғысы келетін пациенттерге арналған сервис.',
      en: 'This service helps patients submit a medicine request and understand the next step clearly.',
    },
    why: {
      ru: 'Он нужен, чтобы экономить время пациента, снизить путаницу в заявках и сделать получение лекарств более понятным.',
      kk: 'Ол пациенттің уақытын үнемдеу, өтінімдердегі шатасуды азайту және дәріні алу процесін түсініктірек ету үшін қажет.',
      en: 'It exists to save time, reduce confusion in requests, and make medicine access easier to understand.',
    },
    forWho: [
      {
        ru: 'Для пациентов, которым нужны препараты по назначению врача.',
        kk: 'Дәрігер тағайындаған препараттар қажет пациенттерге.',
        en: 'For patients who need medicines prescribed by a doctor.',
      },
      {
        ru: 'Для семей, которые хотят оформить запрос заранее и без спешки.',
        kk: 'Өтінімді алдын ала және асықпай рәсімдегісі келетін отбасыларға.',
        en: 'For families who want to submit requests in advance without stress.',
      },
      {
        ru: 'Для людей, которым важна понятная коммуникация по наличию и дальнейшим шагам.',
        kk: 'Қолжетімділік пен келесі қадамдар туралы түсінікті байланыс маңызды адамдарға.',
        en: 'For people who need clear communication about availability and next steps.',
      },
    ],
    includes: [
      {
        ru: 'Оформление запроса на лекарства.',
        kk: 'Дәріге сұранысты рәсімдеу.',
        en: 'Submitting a medicine request.',
      },
      {
        ru: 'Уточнение состава заявки и контакта для обратной связи.',
        kk: 'Өтінім құрамын және кері байланыс үшін контактіні нақтылау.',
        en: 'Clarifying the request and contact details for follow-up.',
      },
      {
        ru: 'Понятный маршрут по дальнейшему получению.',
        kk: 'Одан әрі алу бойынша түсінікті маршрут.',
        en: 'A clear route for the next fulfillment step.',
      },
    ],
    status: {
      ru: 'Сервис временно недоступен.',
      kk: 'Сервис уақытша қолжетімсіз.',
      en: 'This service is temporarily unavailable.',
    },
    note: {
      ru: 'Сейчас команда донастраивает логистику и операционные процессы, чтобы сервис работал стабильно.',
      kk: 'Қазір команда сервистің тұрақты жұмыс істеуі үшін логистика мен операциялық процестерді реттеп жатыр.',
      en: 'The team is currently refining logistics and operations so the service can work reliably.',
    },
  },
  {
    id: 'homevisit',
    title: {
      ru: 'Вызов врача на дом',
      kk: 'Үйге дәрігер шақыру',
      en: 'Doctor home visit',
    },
    short: {
      ru: 'Позволяет пациенту запросить очный выезд врача, когда ехать в клинику неудобно или тяжело.',
      kk: 'Клиникаға бару қиын немесе ыңғайсыз болғанда пациентке дәрігердің үйге келуін сұратуға мүмкіндік береді.',
      en: 'Lets patients request an in-person doctor visit when getting to the clinic is difficult.',
    },
    what: {
      ru: 'Это сервис домашнего визита врача, когда первичный осмотр удобнее провести по месту нахождения пациента.',
      kk: 'Бұл пациент тұрған жерде алғашқы қарауды өткізу ыңғайлы болған жағдайда дәрігердің үйге бару сервисі.',
      en: 'This is a home-visit service for situations where an initial check is easier at the patient’s location.',
    },
    why: {
      ru: 'Он нужен, чтобы помочь людям с ограниченной мобильностью, высокой нагрузкой или состоянием, при котором поездка в клинику осложнена.',
      kk: 'Ол қозғалысы шектеулі, жүктемесі жоғары немесе клиникаға баруы қиындаған адамдарға көмектесу үшін қажет.',
      en: 'It is designed for people with limited mobility, heavy schedules, or conditions that make clinic travel difficult.',
    },
    forWho: [
      {
        ru: 'Для пациентов, которым тяжело добраться до клиники самостоятельно.',
        kk: 'Клиникаға өздігінен жетуі қиын пациенттерге.',
        en: 'For patients who have difficulty reaching the clinic on their own.',
      },
      {
        ru: 'Для семей с детьми или пожилыми родственниками, когда нужен более спокойный сценарий осмотра.',
        kk: 'Балалары немесе егде туыстары бар отбасыларға, қаралу үрдісін тыныш жағдайда өткізгісі келетіндерге.',
        en: 'For families with children or older relatives who need a calmer visit flow.',
      },
      {
        ru: 'Для случаев, когда важна оценка состояния на месте до следующего этапа лечения.',
        kk: 'Емнің келесі кезеңіне дейін жағдайды сол жерде бағалау маңызды болғанда.',
        en: 'For cases where an on-site assessment is important before the next treatment step.',
      },
    ],
    includes: [
      {
        ru: 'Запрос на домашний визит врача.',
        kk: 'Дәрігердің үйге келуіне сұраныс.',
        en: 'A request for a doctor home visit.',
      },
      {
        ru: 'Первичный сбор информации о состоянии пациента.',
        kk: 'Пациенттің жағдайы туралы бастапқы ақпаратты жинау.',
        en: 'Initial intake about the patient’s condition.',
      },
      {
        ru: 'Понимание, какой следующий шаг нужен после визита.',
        kk: 'Визиттен кейін қандай келесі қадам қажет екенін түсіну.',
        en: 'A clear understanding of the next step after the visit.',
      },
    ],
    status: {
      ru: 'Сервис временно недоступен.',
      kk: 'Сервис уақытша қолжетімсіз.',
      en: 'This service is temporarily unavailable.',
    },
    note: {
      ru: 'Раздел временно приостановлен, пока команда восстанавливает логистику выездов и маршрутизацию.',
      kk: 'Команда шығу логистикасы мен маршруттауды қалпына келтіріп жатқанша бөлім уақытша тоқтатылған.',
      en: 'The service is paused while the team restores route logistics and dispatch stability.',
    },
  },
];

export const serviceCatalogMap = Object.fromEntries(serviceCatalog.map((service) => [service.id, service]));
