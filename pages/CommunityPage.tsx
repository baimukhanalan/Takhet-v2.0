
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { MessageSquare, ThumbsUp, Send, CheckCircle, Search, Filter, ArrowUpRight, UserCircle2 } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';

const INITIAL_COMPLAINTS = [
  { 
    id: 'c1', 
    author: 'Анонимно', 
    title: 'Боль в пояснице после тренировки', 
    body: 'Вчера делал приседания со штангой, сегодня резкая боль в районе крестца. Не могу разогнуться. Стоит ли вызывать скорую?', 
    replies: [
      { author: 'Др. Петров (Невролог)', text: 'Попробуйте покой и сухое тепло. Если появится онемение в ногах — немедленно к врачу.' }
    ],
    likes: 5,
    category: 'Ортопедия',
    status: 'answered'
  },
  { 
    id: 'c2', 
    author: 'Анонимно', 
    title: 'Высыпания у ребенка', 
    body: 'У ребенка 3 лет появилась красная сыпь на животе. Температуры нет. Что это может быть?', 
    replies: [],
    likes: 2,
    category: 'Педиатрия',
    status: 'pending'
  }
];

const CommunityPage: React.FC<{ user?: User }> = ({ user }) => {
  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  const isPortal = !!user;

  const handlePost = () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    const newEntry = {
      id: Math.random().toString(),
      author: 'Анонимно',
      title: newTitle,
      body: newBody,
      replies: [],
      likes: 0,
      category: 'Общее',
      status: 'pending'
    };
    setComplaints([newEntry, ...complaints]);
    setNewTitle('');
    setNewBody('');
  };

  const filtered = complaints.filter(c => {
    if (activeFilter === 'Unanswered') return c.replies.length === 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {!isPortal && <PublicHeader activePath="/community" />}
      
      <main className={`max-w-5xl mx-auto px-4 ${!isPortal ? 'pt-32' : 'pt-4'} space-y-8`}>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-foreground">Сообщество</h1>
          <div className="flex gap-2">
            {['All', 'Unanswered'].map(f => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeFilter === f ? 'bg-primary text-white shadow-lg' : 'bg-white border border-border text-muted-foreground'}`}
              >
                {f === 'All' ? 'Все' : 'Без ответа'}
              </button>
            ))}
          </div>
        </div>

        {/* Post Complaint Box */}
        <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> Опубликовать жалобу анонимно</h3>
          <input 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Тема жалобы..." 
            className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold"
          />
          <textarea 
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            placeholder="Подробно опишите симптомы..." 
            className="w-full bg-background border border-border rounded-xl px-4 py-3 min-h-[100px] text-sm"
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground font-medium italic">Ваше имя не будет отображено</p>
            <button 
              onClick={handlePost}
              className="px-8 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20"
            >
              Отправить <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-6">
          {filtered.map(c => (
            <div key={c.id} className="bg-white p-6 rounded-[2rem] border border-border shadow-sm hover:border-primary/20 transition-all space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-secondary text-primary text-[10px] font-black rounded uppercase">{c.category}</span>
                  <span className="text-[10px] text-muted-foreground font-black uppercase flex items-center gap-1">
                    <UserCircle2 className="w-3 h-3" /> {c.author}
                  </span>
                </div>
                {c.replies.length > 0 && <CheckCircle className="w-5 h-5 text-success" />}
              </div>
              
              <div>
                <h4 className="text-xl font-black text-foreground">{c.title}</h4>
                <p className="text-muted-foreground text-sm leading-relaxed mt-2">{c.body}</p>
              </div>

              {/* Doctor Replies */}
              {c.replies.length > 0 && (
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-2">
                  {c.replies.map((r, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-xs font-black text-primary flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" /> {r.author}
                      </p>
                      <p className="text-sm text-foreground font-medium italic">"{r.text}"</p>
                    </div>
                  ))}
                </div>
              )}

              {user?.role === UserRole.DOCTOR && c.replies.length === 0 && (
                <button className="w-full py-3 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all">
                  Ответить на жалобу
                </button>
              )}

              <div className="flex items-center gap-4 pt-2 text-[10px] font-black uppercase text-muted-foreground">
                <span className="flex items-center gap-1.5"><ThumbsUp className="w-3 h-3" /> {c.likes}</span>
                <span className="flex items-center gap-1.5"><MessageSquare className="w-3 h-3" /> {c.replies.length}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default CommunityPage;
