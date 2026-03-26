import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, X, Send, Mic, MicOff, 
  BrainCircuit, Sparkles, Loader2, Volume2, 
  Search, Zap, Bot, Smartphone, ZapOff
} from 'lucide-react';
import { advancedChat, generateSpeech, fastChat } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';

const AIChatOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [useFast, setUseFast] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'ai', text: 'Здравствуйте! Я координатор платформы Takhet+. Я помогу вам разобраться в работе сервиса, приму ваш отзыв или помогу решить техническую проблему. Чем я могу быть полезен?' }]);
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, messages]);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim()) return;
    
    const userMsg = text.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputText('');
    setIsLoading(true);

    try {
      let response = "";
      if (useFast) {
        response = await fastChat(userMsg) || "Извините, не удалось получить быстрый ответ.";
      } else {
        response = await advancedChat(userMsg, { 
          useThinking, 
          useSearch,
          systemInstruction: "Вы — координатор платформы Takhet+. Ваша роль — помогать пользователям с навигацией по сайту, отвечать на вопросы о работе сервиса (запись к врачу, личный кабинет, оплата), принимать отзывы и предложения, а также помогать в решении технических проблем и ошибок. Вы НЕ медицинский помощник. Если вас спрашивают о здоровье, вежливо направьте пользователя в раздел 'Takhet AI' на главной странице сайта. Будьте вежливы, лаконичны и полезны."
        });
      }
      setMessages(prev => [...prev, { role: 'ai', text: response || 'Извините, я не смог обработать ваш запрос.' }]);
      
      // Auto-speak if it's a short response
      if (response && response.length < 300) {
        const audioUrl = await generateSpeech(response);
        if (audioUrl) {
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            audioRef.current.play();
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Ваш браузер не поддерживает распознавание речи.");
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
      const text = event.results[0][0].transcript;
      handleSend(text);
    };

    recognition.start();
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-white text-slate-900 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.1)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group border border-slate-200"
      >
        <Bot className="w-8 h-8 group-hover:rotate-12 transition-transform text-primary" />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-28 right-8 w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden z-50 border border-slate-100"
          >
            {/* Header */}
            <div className="p-6 bg-white border-b border-slate-100 text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tighter">Координатор Takhet+</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Онлайн</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 no-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Координатор печатает...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Controls */}
            <div className="p-6 bg-white border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 pl-4">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Задайте вопрос по платформе..."
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                />
                <button 
                  onClick={toggleVoice}
                  className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-primary'}`}
                >
                  {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isLoading}
                  className="p-3 bg-primary text-white rounded-xl hover:bg-blue-800 transition-all disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
            <audio ref={audioRef} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatOverlay;
