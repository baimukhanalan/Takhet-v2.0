import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, ChatSession } from '../types';
import { Search, Send, Image as ImageIcon, Paperclip, CheckCircle2, Lock, UserCircle2, Clock, MessageSquare } from 'lucide-react';
import { MockDB } from '../services/db';
import { Link } from 'react-router-dom';
import { roleApi } from '../services/roleApi';

const mapCaseToChat = (c: any, userRole: UserRole): ChatSession => ({
  id: c.id,
  doctorId: c.doctorId || 'doctor',
  patientId: c.patientId || 'patient',
  doctorName: c.doctorId || 'Doctor',
  patientName: c.patientId || 'Patient',
  doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
  patientAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  lastMessage: c.summary || 'Нет сообщений',
  lastTimestamp: new Date(c.createdAt).toLocaleTimeString(),
  unreadCount: 0,
  consultationEndDate: c.status === 'closed' ? new Date(c.updatedAt || c.createdAt).toISOString() : undefined,
  messages: [
    {
      id: `msg-${c.id}`,
      senderId: userRole === UserRole.DOCTOR ? c.patientId || 'patient' : c.doctorId || 'doctor',
      text: c.summary || 'Кейс создан',
      timestamp: new Date(c.createdAt).toLocaleTimeString()
    }
  ]
});

const ChatPage: React.FC<{ user: User }> = ({ user }) => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const data = user.role === UserRole.DOCTOR ? await roleApi.doctorAppointments() : await roleApi.patientCases();
      const backendChats = (data || []).map((c: any) => mapCaseToChat(c, user.role));
      const localChats = MockDB.getChats();
      const merged = backendChats.map((bc: ChatSession) => {
        const local = localChats.find((lc) => lc.id === bc.id);
        return local ? { ...bc, messages: local.messages?.length ? local.messages : bc.messages } : bc;
      });
      setChats(merged.length ? merged : localChats);
    } catch {
      setChats(MockDB.getChats());
    }
  };

  useEffect(() => {
    load();
    window.addEventListener('storage_update', load as any);
    return () => window.removeEventListener('storage_update', load as any);
  }, [user.role]);

  const activeChat = useMemo(() => chats.find(c => c.id === activeChatId) || chats[0], [chats, activeChatId]);

  const isLocked = useMemo(() => {
    if (!activeChat?.consultationEndDate) return false;
    const endDate = new Date(activeChat.consultationEndDate);
    const diff = Date.now() - endDate.getTime();
    return diff > 5 * 24 * 60 * 60 * 1000;
  }, [activeChat]);

  const handleSendMessage = () => {
    if (!message.trim() || isLocked || !activeChat) return;
    MockDB.sendMessage(activeChat.id, user.id, message);
    setChats(prev => prev.map(c => c.id === activeChat.id ? {
      ...c,
      lastMessage: message,
      lastTimestamp: new Date().toLocaleTimeString(),
      messages: [...(c.messages || []), { id: `msg-${Date.now()}`, senderId: user.id, text: message, timestamp: new Date().toLocaleTimeString() }]
    } : c));
    setMessage('');
  };

  const handleFinish = async () => {
    if (!activeChat) return;
    try {
      if (user.role === UserRole.DOCTOR) {
        await roleApi.doctorUpdateCaseStatus(activeChat.id, 'closed');
      }
      MockDB.finishConsultation(activeChat.id);
      await load();
    } catch {
      MockDB.finishConsultation(activeChat.id);
      setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, consultationEndDate: new Date().toISOString() } : c));
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      <div className="hidden md:flex w-80 lg:w-96 bg-white rounded-3xl border border-border shadow-sm flex-col overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-extrabold mb-4">Сообщения</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input type="text" placeholder="Поиск чатов..." className="w-full pl-10 pr-4 py-2.5 bg-background border-none rounded-xl text-sm outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`p-6 flex items-center gap-4 cursor-pointer transition-all ${activeChat?.id === chat.id ? 'bg-secondary/50 border-r-4 border-primary' : 'hover:bg-slate-50'}`}
            >
              <div className="relative">
                <img src={user.role === UserRole.DOCTOR ? chat.patientAvatar : chat.doctorAvatar} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                {chat.unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{chat.unreadCount}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold truncate text-foreground">{user.role === UserRole.DOCTOR ? chat.patientName : chat.doctorName}</h4>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">{chat.lastTimestamp}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate font-medium">{chat.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-border shadow-sm flex flex-col overflow-hidden">
        {activeChat ? (
          <>
            <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <img src={user.role === UserRole.DOCTOR ? activeChat.patientAvatar : activeChat.doctorAvatar} className="w-12 h-12 rounded-xl object-cover shadow-sm" alt="" />
                <div>
                  <h3 className="font-black text-lg text-foreground">{user.role === UserRole.DOCTOR ? activeChat.patientName : activeChat.doctorName}</h3>
                  <p className="text-[10px] text-success font-black uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span> Онлайн
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {user.role === UserRole.PATIENT && (
                  <Link to={`/doctors-search`} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">
                    <UserCircle2 className="w-4 h-4 text-primary" /> Профиль врача
                  </Link>
                )}
                {user.role === UserRole.DOCTOR && !activeChat.consultationEndDate && (
                  <button onClick={handleFinish} className="flex items-center gap-2 px-5 py-2.5 bg-success text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-success/20">
                    <CheckCircle2 className="w-4 h-4" /> Завершить
                  </button>
                )}
                {activeChat.consultationEndDate && (
                   <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-amber-100">
                     <Clock className="w-4 h-4" /> Консультация завершена
                   </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30 scrollbar-hide">
              {(activeChat.messages || []).map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm border ${msg.senderId === user.id ? 'bg-primary text-white border-primary rounded-tr-none' : 'bg-white text-foreground border-slate-100 rounded-tl-none'}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <span className={`text-[10px] mt-2 block font-medium ${msg.senderId === user.id ? 'text-blue-100 text-right' : 'text-slate-400'}`}>{msg.timestamp}</span>
                  </div>
                </div>
              ))}
              {isLocked && (
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                   <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shadow-inner">
                     <Lock className="w-8 h-8" />
                   </div>
                   <h4 className="text-lg font-black text-slate-800">Чат заблокирован</h4>
                   <p className="text-sm text-slate-400 max-w-xs font-medium">Срок активности чата (5 дней после консультации) истек. Чат доступен только для чтения.</p>
                </div>
              )}
            </div>

            {!isLocked && (
              <div className="p-6 bg-white border-t border-border">
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-[2.5rem] p-2 pl-6 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Напишите сообщение..."
                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold"
                  />
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-primary transition-all"><Paperclip className="w-5 h-5" /></button>
                    <button className="p-2 text-slate-400 hover:text-primary transition-all"><ImageIcon className="w-5 h-5" /></button>
                    <button onClick={handleSendMessage} className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center hover:bg-blue-800 transition-all shadow-lg shadow-primary/20">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 opacity-30">
             <MessageSquare className="w-24 h-24" />
             <p className="text-xl font-black uppercase tracking-widest">Выберите чат для начала</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
