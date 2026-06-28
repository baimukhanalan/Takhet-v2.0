import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../services/useLanguage';

type TestimonialCopy = {
  heading: string;
  intro: string;
  ageLabel: (age: number) => string;
  quotes: string[];
};

const copyByLanguage: Record<'ru' | 'kk' | 'en', TestimonialCopy> = {
  ru: {
    heading: 'Истории пользователей Takhet+',
    intro: 'Как единый медицинский маршрут помогает быстрее получать ответы, поддержку и сохранять контроль.',
    ageLabel: (age) => `${age} лет`,
    quotes: [
      'Takhet помог мне легко получить помощь профильного специалиста без поездок и отгулов. Я наконец чувствую, что контролирую свое здоровье и увереннее смотрю в будущее.',
      'С Takhet я быстрее получил ответы и избежал лишних визитов в клинику. Это помогло мне сосредоточиться на работе и проводить больше времени с семьей.',
      'Takhet связал меня с нужными врачами именно тогда, когда они были нужны больше всего. Поддержка и сопровождение дали мне спокойствие и ощутимый результат.',
      'Раньше мне было сложно управлять здоровьем всей семьи. Takhet объединил все в одном месте и сделал процесс намного понятнее.',
      'Takhet помог вовремя обратить внимание на проблему со здоровьем, и это многое изменило. Я стал здоровее, активнее и по-новому отношусь к своему будущему.',
    ],
  },
  kk: {
    heading: 'Takhet+ пайдаланушыларының оқиғалары',
    intro: 'Біртұтас медициналық бағыт жауапты тезірек алуға, қолдау табуға және жағдайды бақылауда ұстауға көмектеседі.',
    ageLabel: (age) => `${age} жаста`,
    quotes: [
      'Takhet маған жұмыстан сұранбай және жолға уақыт жоғалтпай, бейінді маманның көмегін алуға мүмкіндік берді. Енді денсаулығымды бақылауда ұстайтыныма сенімдімін.',
      'Takhet арқылы жауаптарды тезірек алып, клиникаға артық барудан құтылдым. Жұмысқа көңіл бөліп, отбасыма көбірек уақыт бөле алдым.',
      'Takhet маған дәл қажет кезде дұрыс дәрігерлерді табуға көмектесті. Қолдау мен кейінгі сүйемелдеу көңіліме тыныштық берді.',
      'Бұрын бүкіл отбасымның денсаулығын басқару қиын еді. Takhet барлығын бір жерге жинап, процесті әлдеқайда түсінікті етті.',
      'Takhet денсаулық мәселесін ерте байқауға көмектесті, бұл көп нәрсені өзгертті. Қазір өзімді сергек сезініп, болашаққа басқаша қараймын.',
    ],
  },
  en: {
    heading: 'Stories from Takhet+ users',
    intro: 'How one connected health journey helps people get answers sooner, receive support, and stay in control.',
    ageLabel: (age) => `${age} years old`,
    quotes: [
      'Takhet made it so easy to get specialist care without taking time off work or traveling. I finally feel in control of my health and more confident about my future.',
      'With Takhet, I got answers faster and avoided unnecessary clinic visits. It helped me focus on my work and spend more quality time with my family.',
      'Takhet connected me with the right doctors when I needed them most. The support and follow-up I received gave me peace of mind and real results.',
      'I used to feel overwhelmed managing my family\'s health. Takhet brought everything together in one place and made it so much simpler.',
      'Takhet helped me detect a health issue early, which changed everything. I am healthier, more active, and living my life with a new sense of purpose.',
    ],
  },
};

const people = [
  { name: 'Emily Chen', age: 28, image: '/media/testimonials/emily-david.webp', position: '25% center' },
  { name: 'David Kim', age: 32, image: '/media/testimonials/emily-david.webp', position: '82% center' },
  { name: 'Sophia Williams', age: 35, image: '/media/testimonials/sophia-williams.webp', position: 'center' },
  { name: 'Isabella Martinez', age: 31, image: '/media/testimonials/isabella-martinez.webp', position: 'center' },
  { name: 'James Patel', age: 29, image: '/media/testimonials/james-patel.webp', position: 'center' },
] as const;

const TakhetTestimonials: React.FC = () => {
  const { lang } = useLanguage();
  const copy = copyByLanguage[lang];
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const scrollFrameRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveCard = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(cardCenter - viewportCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveIndex(closestIndex);
  }, []);

  const handleScroll = useCallback(() => {
    cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = requestAnimationFrame(updateActiveCard);
  }, [updateActiveCard]);

  const scrollToCard = useCallback((index: number) => {
    const viewport = viewportRef.current;
    const card = cardRefs.current[index];
    if (!viewport || !card) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    viewport.scrollTo({
      left: card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    updateActiveCard();
    const handleResize = () => updateActiveCard();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(scrollFrameRef.current);
    };
  }, [updateActiveCard]);

  return (
    <section className="takhet-testimonials" aria-labelledby="takhet-testimonials-title">
      <div className="takhet-testimonials__header">
        <h2 id="takhet-testimonials-title">{copy.heading}</h2>
        <p>{copy.intro}</p>
      </div>

      <div
        ref={viewportRef}
        className="takhet-testimonials__viewport"
        onScroll={handleScroll}
        tabIndex={0}
        aria-label={copy.heading}
      >
        <div className="takhet-testimonials__track">
          {people.map((person, index) => (
            <article
              key={person.name}
              ref={(element) => { cardRefs.current[index] = element; }}
              className="takhet-testimonials__card"
              data-active={activeIndex === index}
              aria-current={activeIndex === index ? 'true' : undefined}
            >
              <img
                src={person.image}
                alt={person.name}
                style={{ objectPosition: person.position }}
                loading="lazy"
                decoding="async"
              />
              <div className="takhet-testimonials__copy">
                <h3>{person.name}</h3>
                <span>{copy.ageLabel(person.age)}</span>
                <blockquote>{copy.quotes[index]}</blockquote>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="takhet-testimonials__navigation" aria-label={`${activeIndex + 1} / ${people.length}`}>
        <div className="takhet-testimonials__segments">
          {people.map((person, index) => (
            <button
              key={person.name}
              type="button"
              className="takhet-testimonials__segment"
              data-active={activeIndex === index}
              onClick={() => scrollToCard(index)}
              aria-label={`${index + 1} / ${people.length}: ${person.name}`}
              aria-current={activeIndex === index ? 'step' : undefined}
            />
          ))}
        </div>
        <span className="takhet-testimonials__counter">{activeIndex + 1} / {people.length}</span>
      </div>
    </section>
  );
};

export default TakhetTestimonials;
