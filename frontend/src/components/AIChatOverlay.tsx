import React, { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Mic, MicOff, Send, X } from 'lucide-react';
import { advancedChatStream } from '../services/gemini';
import { isPlatformCoordinatorQuestion, platformCoordinatorScopeReply } from '../services/platformCoordinator';

type ChatMessage = { role: 'user' | 'ai'; text: string };

const coordinatorPrompt =
  [
    'You are the Takhet+ platform coordinator. Reply in Russian by default. Be direct, specific and route-oriented.',
    'Know the platform map: public landing, Пациентам, Сервисы, Takhet AI, Врачам, Партнерам, Mental; patient portal with dashboard, appointment booking, AI consultation, Takhet AI, AI analysis, doctor chat, medical archive, services and settings; doctor portal with dashboard, appointments/consultations, patients, AI analysis, patient chats, billing and settings; partner portal with doctors, finances, reports and settings; admin portal with doctors, partners, contracts, reviews, medicines, users, analytics and settings.',
    'Explain the intended flows: patient searches a doctor or Mental specialist, opens the profile, chooses date/time from doctor availability, confirms payment/booking, then the appointment appears for both patient and the exact doctor; AI consultation costs 300 KZT and opens an AI consultation room; Takhet AI can be used in guest mode from public pages and portal mode from dashboards; AI Browser can search symptoms and pass context into Takhet AI.',
    'For medical questions, do not pretend to be a doctor. Direct the user to Takhet AI, AI consultation or doctor booking, and mention emergency numbers for Kazakhstan such as 103 or 112 when there are red flags.',
    'If a feature is role-gated, explain which portal or role is needed. If something is not available, say it directly and offer the closest next action.',
    'Answer format: first give the exact route/action, then 2-5 short steps. Do not say "choose a format", do not use a medical template for platform questions, do not add filler.'
  ].join('\n');

const isLowValueCoordinatorReply = (reply: string) =>
  /без медицинского шаблона|выберите формат|нужна справка|Коротко по запросу|не выглядит медицинским|отвечу без медицинского шаблона|если вам нужна справка/i.test(reply);

const buildCoordinatorFallback = (query: string) => {
  const normalized = query.toLowerCase();

  if (/сервис|функц|что уме|раздел|возможност/.test(normalized)) {
    return [
      'В Takhet+ основные сервисы такие:',
      '',
      '1. Takhet AI — чат для разбора состояния, вопросов и продолжения контекста после AI-браузера.',
      '2. ИИ консультация — видеокомната с ИИ за 300 ₸, где можно голосом описать симптомы и прикреплять данные.',
      '3. ИИ браузер — быстрый поиск и разбор симптомов или вопросов с источниками.',
      '4. Разбор анализов — загрузка анализов, фото или документов с переносом результата в медархив.',
      '5. Запись к врачу — каталог врачей, профиль врача, календарь доступности и запись.',
      '6. Консультационная комната — видео, чат, документы и итоговое заключение.',
      '7. Медицинский архив — консультации, PDF-заключения, анализы и загруженные файлы.',
      '8. Mental — отдельный путь для психологов, психосоматики и психотерапии.',
      '',
      'Если вы уже в аккаунте, нужные разделы открываются из меню портала. Если вы гость, можно начать с Takhet AI, ИИ браузера или ИИ консультации.'
    ].join('\n');
  }

  if (/запис|врач|консультац/.test(normalized)) {
    return 'Чтобы записаться: откройте “Записаться на консультацию”, выберите врача, откройте профиль, выберите дату и время из календаря врача, подтвердите запись. После этого запись должна появиться у пациента в “Мои приемы” и у выбранного врача в “Приемы/консультации”.';
  }

  if (/архив|анализ|документ/.test(normalized)) {
    return 'Медархив хранит консультации, PDF-заключения, анализы и файлы пациента. Данные из “Разобрать анализы” и документы из консультаций должны попадать в архив, чтобы врач видел контекст без повторной загрузки.';
  }

  return 'Я координатор Takhet+. Могу подсказать путь по платформе: где записаться к врачу, открыть ИИ консультацию, Takhet AI, ИИ браузер, разбор анализов, медархив, Mental, настройки профиля или админ-разделы. Напишите, что хотите сделать, и я дам прямой маршрут.';
};

const AIChatOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'ai',
          text: 'Здравствуйте. Я координатор платформы Takhet+. Помогу с навигацией, входом, записью, оплатой, настройками и вопросами по работе платформы.'
        }
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text: string = inputText) => {
    const value = text.trim();
    if (!value) return;

    if (!isPlatformCoordinatorQuestion(value)) {
      setMessages((prev) => [...prev, { role: 'user', text: value }, { role: 'ai', text: platformCoordinatorScopeReply }]);
      setInputText('');
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', text: value }]);
    setInputText('');
    setIsLoading(true);
    const aiMessageIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: 'ai', text: 'Координатор отвечает...' }]);

    try {
      const reply = await advancedChatStream(value, {
        useSearch: false,
        systemInstruction: coordinatorPrompt,
        onDelta: (_delta, fullText) => {
          setMessages((prev) =>
            prev.map((item, index) => (index === aiMessageIndex ? { ...item, text: fullText } : item))
          );
        }
      });
      const finalReply = isLowValueCoordinatorReply(reply) ? buildCoordinatorFallback(value) : reply;
      setMessages((prev) => prev.map((item, index) => (index === aiMessageIndex ? { ...item, text: finalReply } : item)));
    } catch {
      setMessages((prev) => [
        ...prev.filter((_item, index) => index !== aiMessageIndex),
        { role: 'ai', text: 'Координатор временно недоступен. Попробуйте еще раз или откройте нужный раздел через меню.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Голосовой ввод не поддерживается в этом браузере.' }
      ]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript || '';
      void handleSend(text);
    };
    recognition.start();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((value) => !value)}
        aria-label={isOpen ? 'Закрыть консультант Takhet+' : 'Открыть консультант Takhet+'}
        className="fixed bottom-8 right-8 w-16 h-16 bg-white text-slate-900 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.1)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group border border-slate-200"
      >
        <Bot className="w-8 h-8 group-hover:rotate-12 transition-transform text-primary" />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full border-2 border-white animate-pulse" />
      </button>

      {isOpen && (
          <>
            <button
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
              aria-label="Закрыть координатор"
            />

            <div className="fixed bottom-28 right-4 md:right-8 w-[calc(100vw-2rem)] md:w-[400px] h-[75vh] md:h-[600px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden z-50 border border-slate-100">
              <div className="p-6 bg-white border-b border-slate-100 text-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tighter">Координатор Takhet+</h3>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Онлайн</span>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 no-scrollbar">
                {messages.map((msg, i) => (
                  <div key={`${msg.role}-${i}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-white rounded-tr-none'
                          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Координатор отвечает...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 bg-white border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 pl-4">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
                    placeholder="Задайте вопрос по платформе..."
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                  />
                  <button
                    onClick={toggleVoice}
                    className={`p-3 rounded-xl transition-all ${
                      isListening ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-primary'
                    }`}
                  >
                    {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => void handleSend()}
                    disabled={!inputText.trim() || isLoading}
                    className="p-3 bg-primary text-white rounded-xl hover:bg-blue-800 transition-all disabled:opacity-50"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
    </>
  );
};

export default AIChatOverlay;
