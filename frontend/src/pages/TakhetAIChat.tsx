import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  BrainCircuit, Sparkles, MessageSquare, FileText, 
  Download, AlertCircle, Play, Volume2, VolumeX, 
  Radio, Loader2, Search, Zap, Clock, MapPin, 
  Shield, Send, Paperclip, Mic, X, Menu, 
  History, Star, Heart, Activity, Thermometer, 
  Stethoscope, Image as ImageIcon, FileSearch, 
  TrendingUp, Archive, User as UserIcon, Settings, Home, 
  ChevronRight, CreditCard, Wallet, Plus, MoreHorizontal,
  PhoneCall, ShoppingCart, Ambulance, Calendar, Save, 
  HelpCircle, LineChart, UserCircle, Smile, Frown, 
  Moon, Info, RefreshCw, Pill, BarChart3, Users
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { useLanguage } from '../services/useLanguage';
import { motion, AnimatePresence } from 'motion/react';
import { FadeIn, FadeInStagger } from '../components/FadeIn';

import { User, UserRole } from '../types';

interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: string;
  type?: 'text' | 'analysis' | 'doctors' | 'plan' | 'payment';
  meta?: any;
}

const TakhetAIChat: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [activeMode, setActiveMode] = useState<'medical' | 'soulful' | 'business'>(
    user.role === UserRole.PARTNER ? 'business' : 'medical'
  );

  // Disable mode switching for all users
  const canSwitchMode = false;
  const [notifications, setNotifications] = useState<{ id: string; text: string }[]>([]);
  
  // Theme configuration based on mode
  const theme = {
    medical: {
      bg: 'bg-slate-950',
      headerBg: 'bg-slate-950/50',
      accent: 'primary',
      border: 'border-white/5',
      cardBg: 'bg-slate-900/40',
      text: 'text-slate-200',
      muted: 'text-slate-500',
      buttonHover: 'hover:bg-white/5 hover:border-white/20'
    },
    soulful: {
      bg: 'bg-[#030308]', // Even deeper
      headerBg: 'bg-[#030308]/90',
      accent: 'indigo-500',
      border: 'border-indigo-500/20',
      cardBg: 'bg-indigo-500/5',
      text: 'text-indigo-50',
      muted: 'text-indigo-400/40',
      buttonHover: 'hover:bg-indigo-500/15 hover:border-indigo-500/40'
    },
    business: {
      bg: 'bg-slate-950',
      headerBg: 'bg-slate-950/50',
      accent: 'emerald-500',
      border: 'border-emerald-500/20',
      cardBg: 'bg-emerald-500/5',
      text: 'text-emerald-50',
      muted: 'text-emerald-400/40',
      buttonHover: 'hover:bg-emerald-500/15 hover:border-emerald-500/40'
    }
  }[activeMode];
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for transferred context from AI Health Browser
    const state = location.state as { initialMessage?: string; initialContext?: string; transferFrom?: string } | null;
    
    if (state?.initialMessage || state?.initialContext) {
      const userMsg: Message = {
        id: 'transfer-user-' + Date.now(),
        role: 'user',
        text: state.initialMessage || 'Запрос из браузера',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const aiMsg: Message = {
        id: 'transfer-ai-' + Date.now(),
        role: 'model',
        text: state.initialContext || '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'analysis'
      };

      setMessages([userMsg, aiMsg]);
      setChatStarted(true);
      setActiveMode('medical');
      
      // Clear location state to prevent re-triggering on refresh
      window.history.replaceState({}, document.title);
    }

    // Check if we just came back from a consultation
    const consultationResult = localStorage.getItem('last_ai_consultation');
    if (consultationResult) {
      const result = JSON.parse(consultationResult);
      localStorage.removeItem('last_ai_consultation');
      
      const aiMsg: Message = {
        id: 'consultation-' + Date.now(),
        role: 'model',
        text: `Ваша AI-консультация завершена. \n\n**Результаты:**\n${result.summary}\n\n**Рекомендованный путь лечения:**\n${result.plan}\n\nЯ сохранил эти данные в ваш архив. Вы можете просмотреть их в любое время.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'plan'
      };
      setMessages(prev => [...prev, aiMsg]);
      setChatStarted(true);
      
      // Add notification
      const newNotif = { id: Date.now().toString(), text: "Новый путь лечения добавлен в ваш профиль" };
      setNotifications(prev => [...prev, newNotif]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newNotif.id)), 5000);
    }
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAIThinking]);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  const handleSendMessage = async (text: string = inputText, type: Message['type'] = 'text') => {
    const messageText = text || inputText;
    if (!messageText.trim()) return;
    
    // Navigation logic for specific buttons
    const navActions: Record<string, string> = {
      'ИИ видеозвонок': '/ai-consultation',
      'AI-видеозвонок': '/ai-consultation',
      'Мой архив здоровья': '/archive',
      'Открыть архив': '/archive',
      'Вызвать врача на дом': '/home-visit',
      'Купить лекарства': '/pharmacy',
      'Записаться на приём': '/doctors-search',
      'Найти врача': '/doctors-search',
      'Подобрать врача': '/doctors-search',
      'Мой профиль': '/dashboard',
      'Настройки': '/settings',
    };

    if (navActions[messageText]) {
      navigate(navActions[messageText]);
      return;
    }

    // Mode switching logic with chat reset
    const soulfulTriggers = ['Душевный помощник', 'Поговорить', 'Мне плохо', 'Я устал', 'Я переживаю', 'Душевный разговор'];
    const medicalTriggers = [
      'Опиши симптомы', 'Прогноз и расшифровка', 'Проверить фото/кожу', 'Найти врача', 
      'Разобрать анализы', 'Продолжить лечение', 'Проверить здоровье сейчас', 'Мои риски',
      'Быстрая проверка', 'Есть ли улучшение', 'Я принимаю лекарства'
    ];

    if (canSwitchMode) {
      if (soulfulTriggers.includes(messageText) && activeMode !== 'soulful') {
        setActiveMode('soulful');
        setMessages([]);
        setChatStarted(false);
        
        // Notification for mode switch
        const newNotif = { id: Date.now().toString(), text: "Переключено на Душевный режим" };
        setNotifications(prev => [...prev, newNotif]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newNotif.id)), 4000);
        return; 
      } else if (medicalTriggers.includes(messageText) && activeMode !== 'medical') {
        setActiveMode('medical');
        setMessages([]);
        setChatStarted(false);
        
        // Notification for mode switch
        const newNotif = { id: Date.now().toString(), text: "Переключено на Медицинский режим" };
        setNotifications(prev => [...prev, newNotif]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newNotif.id)), 4000);
        return;
      }
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setChatStarted(true);
    setIsAIThinking(true);

    try {
      let systemPrompt = "";
      
      if (user.role === UserRole.DOCTOR) {
        systemPrompt = `Вы — Takhet AI, персональный ассистент врача ${user.name}. 
        У вас есть доступ к его динамической базе данных:
        - Финансы: Баланс 1,240,000₸, доход за месяц +15%, 42 успешные транзакции.
        - Пациенты: 128 активных пациентов, 12 записей на сегодня.
        - Эффективность: Среднее время приема 22 мин, рейтинг 4.9/5.
        Ваша цель: помогать в постановке диагнозов, анализировать историю болезни, предлагать рекомендации на основе последних протоколов и помогать с финансовой отчетностью.`;
      } else if (user.role === UserRole.PARTNER) {
        systemPrompt = `Вы — Takhet AI, бизнес-советник для клиники ${user.name}. 
        У вас есть доступ к динамической базе данных клиники:
        - Финансы: Оборот за месяц 12.5M₸, чистая прибыль 3.2M₸.
        - Персонал: 24 врача, средняя загрузка 78%.
        - Пациенты: 1,450 посещений за месяц, 85% возвращаемость.
        - История: Клиника работает 3 года, филиал в центре города.
        Ваша цель: помогать в управлении клиникой, анализировать отчеты, оптимизировать расписание врачей и предлагать стратегии роста.`;
      } else {
        systemPrompt = activeMode === 'medical' 
          ? "Вы — Takhet AI, продвинутый медицинский помощник. Ваша цель — помогать пациентам описывать симптомы, разбирать анализы и подбирать врачей. Будьте профессиональны, точны и эмпатичны. Всегда напоминайте, что вы не заменяете врача. Если ситуация критическая, советуйте вызвать скорую помощь."
          : "Вы — Душевный помощник Takhet. Ваша цель — психологическая поддержка, спокойный разговор и помощь с тревогой. Будьте мягкими, поддерживающими и теплыми. Не давайте медицинских советов в этом режиме, фокусируйтесь на эмоциях.";
      }

      // Contextual prompt adjustments
      if (messageText.toLowerCase().includes('симптом')) {
        systemPrompt += " Сейчас пользователь описывает симптомы. Задайте уточняющие вопросы о длительности, характере боли и сопутствующих признаках.";
      } else if (messageText.toLowerCase().includes('анализ') || messageText.toLowerCase().includes('расшифровка')) {
        systemPrompt += " Сейчас пользователь хочет разобрать анализы. Попросите его предоставить данные или описать результаты.";
      } else if (messageText.toLowerCase().includes('плохо') || messageText.toLowerCase().includes('устал') || messageText.toLowerCase().includes('переживаю')) {
        systemPrompt += " Пользователь выражает негативные эмоции. Проявите максимум эмпатии, выслушайте и предложите поддержку.";
      } else if (messageText.toLowerCase().includes('риск')) {
        systemPrompt += " Пользователь спрашивает о рисках здоровья. Обсудите факторы риска на основе предоставленных данных, но будьте осторожны с диагнозами.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: messageText,
        config: {
          systemInstruction: systemPrompt,
        }
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || 'Извините, я не смог обработать ваш запрос.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'system',
        text: 'Произошла ошибка при подключении к AI. Пожалуйста, попробуйте позже.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAIThinking(false);
    }
  };

  const initialActions = [
    // Patient Actions
    { id: 'symptoms', label: 'Описать симптомы', icon: Thermometer, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', mode: 'medical', role: 'patient' },
    { id: 'forecast', label: 'Прогноз и расшифровка анализов', icon: TrendingUp, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', mode: 'medical', role: 'patient' },
    { id: 'ai_call', label: 'ИИ видео-консультация', icon: PhoneCall, color: 'bg-primary/10 text-primary border-primary/20', mode: 'medical', role: 'patient' },
    { id: 'doctor', label: 'Подобрать врача', icon: Stethoscope, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', mode: 'medical', role: 'patient' },
    
    // Doctor Actions
    { id: 'diagnosis_help', label: 'Помощь в диагнозе', icon: BrainCircuit, color: 'bg-primary/10 text-primary border-primary/20', mode: 'medical', role: 'doctor' },
    { id: 'financial_report', label: 'Финансовый отчет', icon: Wallet, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', mode: 'medical', role: 'doctor' },
    { id: 'patient_analytics', label: 'Аналитика пациентов', icon: LineChart, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', mode: 'medical', role: 'doctor' },
    { id: 'medical_protocols', label: 'Медицинские протоколы', icon: FileText, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', mode: 'medical', role: 'doctor' },
    
    // Partner Actions
    { id: 'clinic_stats', label: 'Статистика клиники', icon: BarChart3, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', mode: 'any', role: 'partner' },
    { id: 'doctor_load', label: 'Загрузка врачей', icon: Users, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', mode: 'any', role: 'partner' },
    { id: 'profit_analysis', label: 'Анализ прибыли', icon: Wallet, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', mode: 'any', role: 'partner' },
    { id: 'staff_management', label: 'Управление персоналом', icon: Settings, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', mode: 'any', role: 'partner' },
    { id: 'marketing_stats', label: 'Маркетинговые отчеты', icon: TrendingUp, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20', mode: 'any', role: 'partner' },
  ];

  const habitActions = [
    { id: 'feel', label: 'Как я себя чувствую', icon: Smile, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', mode: 'any' },
    { id: 'quick', label: 'Быстрая проверка', icon: Zap, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', mode: 'medical' },
    { id: 'improvement', label: 'Есть ли улучшение', icon: RefreshCw, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', mode: 'medical' },
    { id: 'meds', label: 'Я принимаю лекарства', icon: Pill, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', mode: 'medical' },
  ];

  const contextualActions = [
    { id: 'book', label: 'Записаться на приём', icon: Calendar, mode: 'medical' },
    { id: 'save', label: 'Сохранить в архив', icon: Save, mode: 'any' },
    { id: 'clarify', label: 'Уточнить', icon: HelpCircle, mode: 'any' },
    { id: 'ai_call', label: 'ИИ видеозвонок', icon: PhoneCall, mode: 'medical' },
    { id: 'forecast', label: 'Получить прогноз', icon: TrendingUp, mode: 'medical' },
    { id: 'save_analysis', label: 'Сохранить разбор', icon: FileText, mode: 'medical' },
  ];

  const postConsultationActions = [
    { id: 'explain', label: 'Объясни рекомендации', icon: FileText, mode: 'medical' },
    { id: 'next', label: 'Что делать дальше', icon: MapPin, mode: 'medical' },
    { id: 'repeat', label: 'Повторный визит', icon: RefreshCw, mode: 'medical' },
    { id: 'buy', label: 'Купить лекарства', icon: ShoppingCart, mode: 'medical' },
    { id: 'home_visit', label: 'Вызвать врача на дом', icon: Home, mode: 'medical' },
    { id: 'ambulance', label: 'Вызвать скорую', icon: Ambulance, mode: 'medical' },
  ];

  const emotionalActions = [
    { id: 'talk', label: 'Поговорить', icon: MessageSquare, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', mode: 'soulful' },
    { id: 'bad', label: 'Мне плохо', icon: Frown, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', mode: 'soulful' },
    { id: 'tired', label: 'Я устал', icon: Moon, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', mode: 'soulful' },
    { id: 'worried', label: 'Я переживаю', icon: AlertCircle, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', mode: 'soulful' },
  ];

  const ltvActions = [
    { id: 'repeat_cons', label: 'Повторить консультацию', icon: RefreshCw, mode: 'medical' },
    { id: 'check_again', label: 'Проверить ещё раз', icon: BrainCircuit, mode: 'medical' },
    { id: 'add_data', label: 'Добавить новые данные', icon: Plus, mode: 'medical' },
  ];

  const menuActions = [
    { id: 'symptoms', label: 'Опиши симптомы', icon: Thermometer, mode: 'medical' },
    { id: 'analysis', label: 'Разобрать анализы', icon: FileSearch, mode: 'medical' },
    { id: 'doctor', label: 'Найти врача', icon: Stethoscope, mode: 'medical' },
    { id: 'archive_nav', label: 'Открыть архив', icon: Archive, mode: 'any' },
    { id: 'ai_call', label: 'ИИ видеозвонок', icon: PhoneCall, mode: 'medical' },
    { id: 'home_visit', label: 'Вызвать врача на дом', icon: Home, mode: 'medical' },
    { id: 'buy', label: 'Купить лекарства', icon: ShoppingCart, mode: 'medical' },
    { id: 'profile', label: 'Мой профиль', icon: UserCircle, mode: 'any' },
    { id: 'settings', label: 'Настройки', icon: Settings, mode: 'any' },
  ];

  const archiveItems = [
    { id: '1', title: 'Температура и боль в горле', date: '14 марта' },
    { id: '2', title: 'Расшифровка анализов крови', date: '12 марта' },
    { id: '3', title: 'Консультация с терапевтом', date: '10 марта' },
    { id: '4', title: 'Душевный разговор', date: '8 марта' },
  ];

  return (
    <div className={`flex h-screen ${theme.bg} ${theme.text} overflow-hidden font-sans transition-colors duration-1000`}>
      {/* Background Atmosphere for Soulful Mode */}
      <AnimatePresence>
        {activeMode === 'soulful' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none overflow-hidden z-0"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                x: [0, 50, 0],
                y: [0, 30, 0]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-indigo-600/10 blur-[120px] rounded-full" 
            />
            <motion.div 
              animate={{ 
                scale: [1.2, 1, 1.2],
                x: [0, -40, 0],
                y: [0, -20, 0]
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-[-20%] right-[-10%] w-[90%] h-[90%] bg-violet-600/10 blur-[150px] rounded-full" 
            />
            
            {/* Animated Particles/Stars for Soulful Mode */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0,
                  x: Math.random() * 100 + '%',
                  y: Math.random() * 100 + '%'
                }}
                animate={{ 
                  opacity: [0, 0.3, 0],
                  scale: [0, 1, 0],
                }}
                transition={{ 
                  duration: 5 + Math.random() * 10,
                  repeat: Infinity,
                  delay: Math.random() * 10
                }}
                className="absolute w-1 h-1 bg-indigo-300 rounded-full blur-[1px]"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications */}
      <div className="fixed top-24 right-6 z-[100] space-y-4">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div 
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              className="bg-primary/20 backdrop-blur-xl border border-primary/30 p-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]"
            >
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm font-bold text-white">{n.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Left Sidebar (Archive) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-80 bg-slate-900/80 backdrop-blur-2xl border-r border-white/5 z-50 flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-primary" />
                <span className="font-black text-xs uppercase tracking-widest">Архив здоровья</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div className="space-y-2">
                <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Недавние чаты</p>
                {archiveItems.map(item => (
                  <button key={item.id} className="w-full text-left p-4 hover:bg-white/5 rounded-2xl transition-all group">
                    <p className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">{item.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{item.date}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Разделы</p>
                <button className="w-full flex items-center gap-3 p-4 hover:bg-white/5 rounded-2xl text-sm font-bold text-slate-400 hover:text-white transition-all">
                  <Archive className="w-4 h-4" /> Медицинский архив
                </button>
                <button className="w-full flex items-center gap-3 p-4 hover:bg-white/5 rounded-2xl text-sm font-bold text-slate-400 hover:text-white transition-all">
                  <FileText className="w-4 h-4" /> PDF рекомендации
                </button>
                <button className="w-full flex items-center gap-3 p-4 hover:bg-white/5 rounded-2xl text-sm font-bold text-slate-400 hover:text-white transition-all">
                  <TrendingUp className="w-4 h-4" /> Прогнозы и ответы
                </button>
                {activeMode === 'soulful' && (
                  <button className="w-full flex items-center gap-3 p-4 hover:bg-white/5 rounded-2xl text-sm font-bold text-slate-400 hover:text-white transition-all">
                    <Heart className="w-4 h-4" /> Душевный помощник
                  </button>
                )}
                <button className="w-full flex items-center gap-3 p-4 hover:bg-white/5 rounded-2xl text-sm font-bold text-slate-400 hover:text-white transition-all">
                  <Star className="w-4 h-4" /> Избранное
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-white/5">
              <button 
                onClick={() => { setMessages([]); setChatStarted(false); setIsSidebarOpen(false); }}
                className="w-full flex items-center gap-3 p-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-2xl text-sm font-black uppercase tracking-widest transition-all"
              >
                <Plus className="w-4 h-4" /> Новый чат
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className={`h-16 md:h-20 border-b ${theme.border} flex items-center justify-between px-4 md:px-6 ${theme.headerBg} backdrop-blur-xl z-40 transition-colors duration-1000`}>
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 md:p-3 hover:bg-white/5 rounded-xl md:rounded-2xl transition-colors ${theme.muted} hover:text-white`}
            >
              <History className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button 
              onClick={() => navigate(-1)}
              className={`p-2 md:p-3 hover:bg-white/5 rounded-xl md:rounded-2xl transition-colors ${theme.muted} hover:text-white group`}
              title="Назад"
            >
              <Home className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform" />
            </button>
            <div className="flex flex-col">
              <span className="text-base md:text-lg font-black tracking-tighter text-white">Takhet <span className={activeMode === 'medical' ? 'text-primary' : 'text-pink-500'}>AI</span></span>
              <div className="flex items-center gap-1.5 md:gap-2">
                <div className={`w-1 md:w-1.5 h-1 md:h-1.5 ${activeMode === 'medical' ? 'bg-emerald-500' : 'bg-pink-400'} rounded-full animate-pulse`} />
                <span className={`text-[8px] md:text-[10px] font-bold ${theme.muted} uppercase tracking-widest`}>Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className={`p-2 md:p-3 hover:bg-white/5 rounded-xl md:rounded-2xl transition-colors ${theme.muted} hover:text-white`}
            >
              <Menu className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto relative custom-scrollbar">
          <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
            <AnimatePresence mode="wait">
              {!chatStarted ? (
                <motion.div 
                  key="empty-state"
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, y: -40, filter: 'blur(20px)', transition: { duration: 0.4 } }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-12 py-12"
                >
                  <div className="text-center space-y-4 md:space-y-6">
                      <motion.div 
                        initial={{ rotate: -10, scale: 0.8, opacity: 0 }}
                        animate={{ rotate: 0, scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 15, duration: 0.8 }}
                        className={`w-16 h-16 md:w-24 md:h-24 ${activeMode === 'medical' ? 'bg-primary/10 border-primary/20' : activeMode === 'business' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-indigo-500/10 border-indigo-500/20'} rounded-2xl md:rounded-[2.5rem] flex items-center justify-center mx-auto border relative`}
                      >
                        {activeMode === 'medical' ? (
                          <BrainCircuit className="w-8 h-8 md:w-12 md:h-12 text-primary" />
                        ) : activeMode === 'business' ? (
                          <BarChart3 className="w-8 h-8 md:w-12 md:h-12 text-emerald-500" />
                        ) : (
                          <Heart className="w-8 h-8 md:w-12 md:h-12 text-indigo-400" />
                        )}
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className={`absolute inset-0 ${activeMode === 'medical' ? 'bg-primary/20' : activeMode === 'business' ? 'bg-emerald-500/20' : 'bg-indigo-500/20'} rounded-2xl md:rounded-[2.5rem] blur-xl`}
                        />
                      </motion.div>
                    <div className="space-y-2 md:space-y-3">
                      <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className={`text-2xl md:text-4xl font-black tracking-tighter uppercase ${activeMode === 'medical' ? 'text-white' : activeMode === 'business' ? 'text-white' : 'text-indigo-50'}`}
                      >
                        {activeMode === 'medical' ? 'Здравствуйте' : activeMode === 'business' ? 'Бизнес-аналитика' : 'Я рядом'}
                      </motion.h2>
                      <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        className={`${theme.muted} text-xs md:text-sm font-medium max-w-md mx-auto leading-relaxed px-4`}
                      >
                        {activeMode === 'medical' 
                          ? 'Я ваш AI-медицинский помощник Takhet. Я помогу описать симптомы, разобрать анализы, оценить риски и подобрать врача.'
                          : activeMode === 'business'
                          ? 'Я ваш бизнес-советник Takhet AI. Я помогу проанализировать показатели клиники, оптимизировать процессы и найти точки роста.'
                          : 'Я ваш душевный помощник. Если вам тревожно, грустно или просто хочется поговорить — я здесь, чтобы выслушать и поддержать.'}
                      </motion.p>
                    </div>
                  </div>

                  <FadeInStagger staggerDelay={0.05}>
                    <div className="space-y-12">
                      {/* Primary Entry Actions - Uniform Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8 max-w-5xl mx-auto px-4">
                        <AnimatePresence mode="popLayout" initial={false}>
                          {initialActions.filter(a => 
                            (a.role === user.role.toLowerCase() || a.role === 'any') && 
                            (a.mode === activeMode || a.mode === 'any')
                          ).map((action, i) => (
                            <motion.div
                              key={`${activeMode}-${action.id}`}
                              layout="position"
                              initial={{ opacity: 0, y: 20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                              transition={{ 
                                type: 'spring', 
                                damping: 25,
                                stiffness: 150,
                                delay: i * 0.02
                              }}
                              className="relative z-10"
                            >
                              <motion.button
                                whileHover={{ 
                                  scale: 1.03, 
                                  y: -5, 
                                  zIndex: 50,
                                  backgroundColor: activeMode === 'medical' ? 'rgba(255,255,255,0.1)' : 'rgba(99, 102, 241, 0.15)',
                                  borderColor: activeMode === 'medical' ? 'rgba(255,255,255,0.4)' : 'rgba(99, 102, 241, 0.5)',
                                  boxShadow: activeMode === 'medical' 
                                    ? '0 20px 40px -12px rgba(59, 130, 246, 0.2)' 
                                    : '0 20px 40px -12px rgba(99, 102, 241, 0.3)'
                                }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleSendMessage(action.label)}
                                className={`w-full p-6 md:p-8 rounded-3xl md:rounded-[3rem] border text-left transition-all flex flex-col gap-4 md:gap-6 group shadow-xl aspect-auto md:aspect-video min-h-[120px] md:min-h-[180px] justify-between backdrop-blur-md relative ${'color' in action ? action.color : 'bg-white/5 border-white/10 text-slate-300'}`}
                              >
                                <div className="flex justify-between items-start pointer-events-none">
                                  <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${activeMode === 'medical' ? 'bg-white/5' : 'bg-indigo-500/10'} group-hover:scale-110 transition-transform duration-500`}>
                                    <action.icon className={`w-6 h-6 md:w-10 md:h-10 transition-transform group-hover:rotate-6 ${activeMode === 'soulful' ? 'text-indigo-400' : ''}`} />
                                  </div>
                                  <ChevronRight className="w-6 h-6 md:w-8 md:h-8 opacity-0 group-hover:opacity-100 transition-all text-white/40 group-hover:translate-x-2" />
                                </div>
                                <span className="font-black text-xs md:text-base uppercase tracking-[0.15em] leading-tight group-hover:text-white transition-colors pointer-events-none line-clamp-2">{action.label}</span>
                              </motion.button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      {/* Removed Daily Habit Actions */}
                      <AnimatePresence mode="wait">
                      </AnimatePresence>

                      {/* Removed LTV / Retention Actions */}
                    </div>
                  </FadeInStagger>
                </motion.div>
              ) : (
                <div className="space-y-8 pb-20">
                  {messages.map((msg, idx) => (
                    <motion.div 
                      key={msg.id}
                      layout="position"
                      initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                      transition={{ 
                        type: 'spring', 
                        damping: 25, 
                        stiffness: 200,
                        layout: { duration: 0.4, ease: "circOut" }
                      }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`p-6 rounded-[2rem] ${
                          msg.role === 'user' 
                            ? (activeMode === 'medical' ? 'bg-primary' : 'bg-indigo-600') + ' text-white shadow-xl shadow-primary/10 rounded-tr-none' 
                            : msg.role === 'system'
                              ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                              : `${theme.cardBg} border ${theme.border} ${theme.text} rounded-tl-none backdrop-blur-xl`
                        }`}>
                          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          
                          {msg.role === 'model' && (
                            <div className="mt-6 flex flex-wrap gap-2">
                              {contextualActions.filter(a => a.mode === 'any' || a.mode === activeMode).map(action => (
                                <motion.button 
                                  key={action.id}
                                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleSendMessage(action.label)}
                                  className={`flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border ${theme.border} rounded-xl text-[10px] font-black uppercase tracking-widest transition-all`}
                                >
                                  <action.icon className={`w-4 h-4 ${activeMode === 'medical' ? 'text-primary' : 'text-indigo-400'}`} />
                                  {action.label}
                                </motion.button>
                              ))}
                              {idx === messages.length - 1 && activeMode === 'medical' && (
                                <div className="w-full mt-2 pt-2 border-t border-white/5 flex flex-wrap gap-2">
                                  {postConsultationActions.map(action => (
                                    <motion.button 
                                      key={action.id}
                                      whileHover={{ scale: 1.05, backgroundColor: 'rgba(var(--primary), 0.2)' }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => handleSendMessage(action.label)}
                                      className="flex items-center gap-2 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary transition-all"
                                    >
                                      <action.icon className="w-4 h-4" />
                                      {action.label}
                                    </motion.button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {msg.type === 'plan' && (
                            <div className="mt-4 p-4 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Путь лечения активен</span>
                              </div>
                              <button className="px-4 py-2 bg-primary text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-primary/80 transition-all">
                                Просмотреть
                              </button>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">{msg.timestamp}</span>
                      </div>
                    </motion.div>
                  ))}
                  {isAIThinking && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="flex justify-start"
                    >
                      <div className={`${theme.cardBg} border ${theme.border} p-6 rounded-[2rem] rounded-tl-none flex items-center gap-4 backdrop-blur-xl`}>
                        <div className="flex gap-1.5">
                          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }} className={`w-2 h-2 ${activeMode === 'medical' ? 'bg-primary' : 'bg-indigo-400'} rounded-full`} />
                          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className={`w-2 h-2 ${activeMode === 'medical' ? 'bg-primary' : 'bg-indigo-400'} rounded-full`} />
                          <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className={`w-2 h-2 ${activeMode === 'medical' ? 'bg-primary' : 'bg-indigo-400'} rounded-full`} />
                        </div>
                        <span className={`text-[10px] font-black ${theme.muted} uppercase tracking-[0.2em] animate-pulse`}>
                          Takhet AI {activeMode === 'medical' ? 'анализирует' : 'прислушивается'}...
                        </span>
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Area */}
        <div className={`p-4 md:p-6 ${theme.bg}/80 backdrop-blur-2xl border-t ${theme.border} z-40 transition-colors duration-1000`}>
          <div className="max-w-4xl mx-auto relative group">
            <div className={`absolute inset-0 ${activeMode === 'medical' ? 'bg-primary/5' : 'bg-pink-500/5'} rounded-2xl md:rounded-[2.5rem] blur-xl group-focus-within:opacity-100 opacity-0 transition-all`} />
            <div className={`relative ${activeMode === 'medical' ? 'bg-slate-900/50' : 'bg-indigo-950/30'} border ${theme.border} rounded-2xl md:rounded-[2.5rem] p-2 md:p-4 flex items-end gap-2 md:gap-3 focus-within:border-${activeMode === 'medical' ? 'primary' : 'indigo-500'}/50 transition-all`}>
              <button className={`p-2 md:p-3 hover:bg-white/5 rounded-xl md:rounded-2xl transition-colors ${theme.muted} hover:text-primary shrink-0`}>
                <Paperclip className="w-5 h-5" />
              </button>
              <textarea 
                ref={inputRef}
                rows={1}
                placeholder={activeMode === 'medical' ? "Опишите симптомы..." : "Поделитесь..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 bg-transparent border-none outline-none py-2 md:py-3 text-sm font-medium text-white placeholder:text-slate-600 resize-none max-h-40"
              />
              <div className="flex items-center gap-1 md:gap-2 shrink-0">
                <button className={`hidden sm:block p-2 md:p-3 hover:bg-white/5 rounded-xl md:rounded-2xl transition-colors ${theme.muted} hover:text-primary`}>
                  <Mic className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || isAIThinking}
                  className={`p-2 md:p-3 ${activeMode === 'medical' ? 'bg-primary' : 'bg-indigo-600'} hover:opacity-90 disabled:opacity-50 text-white rounded-xl md:rounded-2xl transition-all shadow-lg shadow-primary/20`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Burger Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-80 bg-slate-900/80 backdrop-blur-2xl border-l border-white/5 z-50 flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-widest">Меню функций</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <button 
                onClick={() => { setMessages([]); setChatStarted(false); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-4 hover:bg-white/5 rounded-2xl text-sm font-bold text-slate-300 transition-all"
              >
                <Plus className={`w-4 h-4 ${activeMode === 'medical' ? 'text-primary' : 'text-indigo-400'}`} /> Новый чат
              </button>
              <div className="h-px bg-white/5 my-2" />
              {menuActions.filter(a => a.mode === 'any' || a.mode === activeMode).map(action => (
                <button 
                  key={action.id} 
                  onClick={() => { handleSendMessage(action.label); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-3 p-4 hover:bg-white/5 rounded-2xl text-sm font-bold text-slate-400 hover:text-white transition-all"
                >
                  <action.icon className="w-4 h-4" /> {action.label}
                </button>
              ))}
              <div className="h-px bg-white/5 my-2" />
              <button onClick={() => navigate('/settings')} className="w-full flex items-center gap-3 p-4 hover:bg-white/5 rounded-2xl text-sm font-bold text-slate-400 hover:text-white transition-all">
                <Settings className="w-4 h-4" /> Настройки
              </button>
              <button onClick={() => navigate('/')} className="w-full flex items-center gap-3 p-4 hover:bg-white/5 rounded-2xl text-sm font-bold text-slate-400 hover:text-white transition-all">
                <Home className="w-4 h-4" /> Вернуться на главную
              </button>
            </div>

            <div className="p-6 border-t border-white/5">
              <div className={`flex items-center gap-4 p-4 ${theme.cardBg} rounded-2xl border ${theme.border}`}>
                <div className={`w-10 h-10 rounded-xl ${activeMode === 'medical' ? 'bg-primary' : 'bg-indigo-600'} flex items-center justify-center font-black text-white`}>A</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white break-words">Алан Баймухан</p>
                  <p className={`text-[10px] ${theme.muted} font-bold uppercase tracking-widest`}>Пациент</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TakhetAIChat;
