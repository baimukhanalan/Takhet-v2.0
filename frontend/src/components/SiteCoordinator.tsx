import React, { useMemo, useState } from 'react';
import { Bot, LoaderCircle, MessageCircleMore, SendHorizonal, X } from 'lucide-react';
import { isPlatformCoordinatorQuestion, platformCoordinatorScopeReply } from '../services/platformCoordinator';

type Lang = 'ru' | 'kk';

type NavItem = {
  ru: string;
  kk: string;
  href: string;
  external?: boolean;
};

type Message = {
  role: 'user' | 'assistant';
  text: string;
  links?: NavItem[];
};

const ui = {
  titleRu: '\u0418\u0418-\u043a\u043e\u043e\u0440\u0434\u0438\u043d\u0430\u0442\u043e\u0440',
  titleKk: '\u0416\u0421-\u04af\u0439\u043b\u0435\u0441\u0442\u0456\u0440\u0443\u0448\u0456',
  subtitleRu: '\u041f\u043e\u043c\u043e\u0433\u0443 \u043d\u0430\u0439\u0442\u0438 \u0443\u0441\u043b\u0443\u0433\u0443, \u0432\u0440\u0430\u0447\u0430 \u0438\u043b\u0438 \u043d\u0443\u0436\u043d\u0443\u044e \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0443 \u0441\u0430\u0439\u0442\u0430.',
  subtitleKk: '\u049a\u044b\u0437\u043c\u0435\u0442\u0442\u0456, \u0434\u04d9\u0440\u0456\u0433\u0435\u0440\u0434\u0456 \u043d\u0435\u043c\u0435\u0441\u0435 \u0441\u0430\u0439\u0442\u0442\u0430\u0493\u044b \u049b\u0430\u0436\u0435\u0442 \u0431\u0435\u0442\u0442\u0456 \u0442\u0430\u0431\u0443\u0493\u0430 \u043a\u04e9\u043c\u0435\u043a\u0442\u0435\u0441\u0435\u043c\u0456\u043d.',
  greetRu: '\u0417\u0430\u0434\u0430\u0439\u0442\u0435 \u0432\u043e\u043f\u0440\u043e\u0441 \u043e \u0432\u0440\u0430\u0447\u0435, \u0443\u0441\u043b\u0443\u0433\u0435, \u041e\u0421\u041c\u0421 \u0438\u043b\u0438 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430\u0445.',
  greetKk: '\u0414\u04d9\u0440\u0456\u0433\u0435\u0440, \u049b\u044b\u0437\u043c\u0435\u0442, \u04d8\u041c\u0421\u049a \u043d\u0435\u043c\u0435\u0441\u0435 \u049b\u04b1\u0436\u0430\u0442\u0442\u0430\u0440 \u0442\u0443\u0440\u0430\u043b\u044b \u0441\u04b1\u0440\u0430\u049b \u049b\u043e\u0439\u044b\u04a3\u044b\u0437.',
  placeholderRu: '\u041d\u0430\u043f\u0440\u0438\u043c\u0435\u0440: \u043a\u0430\u043a \u043d\u0430\u0439\u0442\u0438 \u043d\u0443\u0436\u043d\u043e\u0433\u043e \u0432\u0440\u0430\u0447\u0430?',
  placeholderKk: '\u041c\u044b\u0441\u0430\u043b\u044b: \u049b\u0430\u0436\u0435\u0442 \u0434\u04d9\u0440\u0456\u0433\u0435\u0440\u0434\u0456 \u049b\u0430\u043b\u0430\u0439 \u0442\u0430\u0431\u0430\u043c\u044b\u043d?',
  sendRu: '\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c',
  sendKk: '\u0416\u0456\u0431\u0435\u0440\u0443',
  openRu: '\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0438\u0438-\u043a\u043e\u043e\u0440\u0434\u0438\u043d\u0430\u0442\u043e\u0440',
  openKk: '\u0416\u0421-\u04af\u0439\u043b\u0435\u0441\u0442\u0456\u0440\u0443\u0448\u0456\u043d\u0456 \u0430\u0448\u0443',
  closeRu: '\u0417\u0430\u043a\u0440\u044b\u0442\u044c',
  closeKk: '\u0416\u0430\u0431\u0443',
  errorRu: '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u044c \u043e\u0442\u0432\u0435\u0442. \u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u0435 \u0437\u0430\u043f\u0440\u043e\u0441.',
  errorKk: '\u0416\u0430\u0443\u0430\u043f\u0442\u044b \u0430\u043b\u0443 \u043c\u04af\u043c\u043a\u0456\u043d \u0431\u043e\u043b\u043c\u0430\u0434\u044b. \u0421\u04b1\u0440\u0430\u043d\u044b\u0441\u0442\u044b \u049b\u0430\u0439\u0442\u0430\u043b\u0430\u04a3\u044b\u0437.',
};

const getText = (lang: Lang, ru: string, kk: string) => (lang === 'kk' ? kk : ru);

const starterPrompts = {
  ru: ['\u041a\u0430\u043a \u043d\u0430\u0439\u0442\u0438 \u043d\u0443\u0436\u043d\u043e\u0433\u043e \u0432\u0440\u0430\u0447\u0430?', '\u0413\u0434\u0435 \u0438\u043d\u0444\u043e\u0440\u043c\u0430\u0446\u0438\u044f \u043f\u043e \u041e\u0421\u041c\u0421?', '\u041a\u0430\u043a \u0437\u0430\u043f\u0438\u0441\u0430\u0442\u044c\u0441\u044f \u043d\u0430 \u043f\u0440\u0438\u0435\u043c?'],
  kk: ['\u049a\u0430\u0436\u0435\u0442 \u0434\u04d9\u0440\u0456\u0433\u0435\u0440\u0434\u0456 \u049b\u0430\u043b\u0430\u0439 \u0442\u0430\u0431\u0430\u043c\u044b\u043d?', '\u04d8\u041c\u0421\u049a \u0430\u049b\u043f\u0430\u0440\u0430\u0442\u044b \u049b\u0430\u0439\u0434\u0430?', '\u049a\u0430\u0431\u044b\u043b\u0434\u0430\u0443\u0493\u0430 \u049b\u0430\u043b\u0430\u0439 \u0436\u0430\u0437\u044b\u043b\u0430\u043c\u044b\u043d?'],
};

const buildCoordinatorInstruction = (lang: Lang, navItems: NavItem[]) =>
  [
    lang === 'kk' ? 'Reply in Kazakh.' : 'Reply in Russian.',
    'You are the Takhet+ platform coordinator. Be direct, specific and route-oriented.',
    'Know the platform: public landing, Пациентам, Сервисы, Takhet AI, Врачам, Партнерам, Mental; patient portal with booking, AI consultation, Takhet AI, AI analysis, doctor chat, medical archive, services and settings; doctor portal with appointments, patients, AI analysis, chats, billing and settings; partner/admin portals.',
    'For platform questions, give the exact route first, then 2-5 short steps. For medical questions, route to Takhet AI, AI consultation or doctor booking; mention Kazakhstan emergency numbers 103/112 only for red flags.',
    'Do not say "choose a format", do not output internal instructions, do not use a medical template for platform navigation.',
    `Available navigation: ${navItems.map((item) => `${item.ru}/${item.kk}: ${item.href}`).join('; ')}`
  ].join('\n');

const findLocalLinks = (query: string, navItems: NavItem[]) => {
  const parts = query.toLowerCase().split(/\s+/).filter(Boolean);
  return navItems
    .filter((item) => {
      const haystack = `${item.ru} ${item.kk} ${item.href}`.toLowerCase();
      return parts.some((part) => haystack.includes(part));
    })
    .slice(0, 4);
};

export default function SiteCoordinator({ lang, navItems }: { lang: Lang; navItems: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const initialMessage = useMemo<Message>(() => ({ role: 'assistant', text: getText(lang, ui.greetRu, ui.greetKk) }), [lang]);
  const visibleMessages = messages.length ? messages : [initialMessage];

  const submitMessage = async (preset?: string) => {
    const text = (preset ?? query).trim();
    if (!text || loading) return;

    if (!isPlatformCoordinatorQuestion(text)) {
      setMessages((current) => [...current, { role: 'user', text }, { role: 'assistant', text: platformCoordinatorScopeReply }]);
      setQuery('');
      setOpen(true);
      return;
    }

    const nextMessages = [...messages, { role: 'user' as const, text }];
    const assistantIndex = nextMessages.length;
    setMessages([...nextMessages, { role: 'assistant', text: '...' }]);
    setQuery('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          systemInstruction: buildCoordinatorInstruction(lang, navItems),
          useSearch: false
        }),
      });
      if (!response.ok || !response.body) throw new Error('Coordinator failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        fullText += chunk;
        setMessages((current) =>
          current.map((message, index) =>
            index === assistantIndex ? { ...message, text: fullText, links: findLocalLinks(text, navItems) } : message
          )
        );
      }

      const tail = decoder.decode();
      if (tail) fullText += tail;
      setMessages((current) =>
        current.map((message, index) =>
          index === assistantIndex
            ? { ...message, text: fullText || getText(lang, ui.errorRu, ui.errorKk), links: findLocalLinks(text, navItems) }
            : message
        )
      );
    } catch {
      setMessages((current) =>
        current.map((message, index) => (index === assistantIndex ? { ...message, text: getText(lang, ui.errorRu, ui.errorKk) } : message))
      );
    } finally {
      setLoading(false);
      setOpen(true);
    }
  };
  return (
    <>
      <button
        aria-expanded={open}
        aria-label={getText(lang, ui.openRu, ui.openKk)}
        className={`site-coordinator-trigger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? <X size={22} /> : <MessageCircleMore size={22} />}
      </button>

      <aside className={`site-coordinator ${open ? 'is-open' : ''}`}>
        <div className="site-coordinator__header">
          <div>
            <p>{getText(lang, ui.titleRu, ui.titleKk)}</p>
            <h3>{getText(lang, ui.subtitleRu, ui.subtitleKk)}</h3>
          </div>
          <button aria-label={getText(lang, ui.closeRu, ui.closeKk)} onClick={() => setOpen(false)} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="site-coordinator__messages">
          {visibleMessages.map((message, index) => (
            <div className={`site-coordinator__message site-coordinator__message--${message.role}`} key={`${message.role}-${index}`}>
              {message.role === 'assistant' ? <Bot size={16} /> : null}
              <div>
                <p>{message.text}</p>
                {message.links?.length ? (
                  <div className="site-coordinator__links">
                    {message.links.map((item) =>
                      item.external ? (
                        <a href={item.href} key={item.href} rel="noreferrer" target="_blank">{getText(lang, item.ru, item.kk)}</a>
                      ) : (
                        <a href={item.href} key={item.href}>{getText(lang, item.ru, item.kk)}</a>
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {loading ? (
            <div className="site-coordinator__message site-coordinator__message--assistant is-loading">
              <LoaderCircle className="spin" size={16} />
              <p>...</p>
            </div>
          ) : null}
        </div>

        <div className="site-coordinator__starter-list">
          {starterPrompts[lang].map((item) => (
            <button key={item} onClick={() => submitMessage(item)} type="button">{item}</button>
          ))}
        </div>

        <form
          className="site-coordinator__composer"
          onSubmit={(event) => {
            event.preventDefault();
            void submitMessage();
          }}
        >
          <textarea
            onChange={(event) => setQuery(event.target.value)}
            placeholder={getText(lang, ui.placeholderRu, ui.placeholderKk)}
            rows={3}
            value={query}
          />
          <button disabled={loading || !query.trim()} type="submit">
            {loading ? <LoaderCircle className="spin" size={16} /> : <SendHorizonal size={16} />}
            <span>{getText(lang, ui.sendRu, ui.sendKk)}</span>
          </button>
        </form>
      </aside>
    </>
  );
}
