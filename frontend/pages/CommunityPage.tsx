
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { 
  MessageSquare, ThumbsUp, Send, CheckCircle, ArrowUpRight, 
  UserCircle2, Loader2, Award, TrendingUp, Filter, Search, X, CheckCircle2
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import { MockDB, Complaint } from '../services/db';
import { translations, Language } from '../services/i18n';
import { useNavigate } from 'react-router-dom';

const CommunityPage: React.FC<{ user?: User; isPortal: boolean }> = ({ user, isPortal }) => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Unanswered'>('All');
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});
  const [lang, setLang] = useState<Language>(MockDB.getLang());
  
  const isDoctor = user?.role === UserRole.DOCTOR;

  useEffect(() => {
    const load = () => {
      setComplaints(MockDB.getComplaints());
      setLang(MockDB.getLang());
    };
    load();
    window.addEventListener('storage_update', load);
    return () => window.removeEventListener('storage_update', load);
  }, []);

  useEffect(() => {
    // Doctors in portal default to Unanswered
    if (isDoctor && isPortal) setActiveFilter('Unanswered');
  }, [isDoctor, isPortal]);

  const t = translations[lang];

  const handlePost = () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    MockDB.addComplaint({
      author: lang === 'ru' ? 'Анонимно' : lang === 'kz' ? 'Анонимді' : 'Anonymous',
      title: newTitle,
      body: newBody,
      category: lang === 'ru' ? 'Общее' : lang === 'kz' ? 'Жалпы' : 'General'
    });
    setNewTitle('');
    setNewBody('');
    alert(lang === 'ru' ? 'Вопрос опубликован!' : 'Сұрақ жарияланды!');
  };

  const handleReply = (complaintId: string) => {
    if (!isDoctor) {
      navigate('/auth');
      return;
    }
    const text = replyText[complaintId];
    if (!text?.trim() || !user) return;
    
    MockDB.addReply(complaintId, {
      author: user.name,
      doctorId: user.id,
      text: text
    });
    setReplyText({ ...replyText, [complaintId]: '' });
  };

  const filtered = complaints.filter(c => {
    if (activeFilter === 'Unanswered') return c.replies.length === 0;
    return true;
  });

  const topDoctors = MockDB.getDoctors()
    .sort((a, b) => b.reputationPoints - a.reputationPoints)
    .slice(0, 5);

  const containerClass = isPortal 
    ? "max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700" 
    : "max-w-7xl mx-auto px-4 pt-44 pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-1000";

  return (
    <div className={!isPortal ? "min-h-screen bg-white" : ""}>
      {!isPortal && <PublicHeader activePath="/community" />}
      
      <main className={containerClass}>
        {/* PUBLIC & PATIENT PORTAL VIEW: Main Feed Column */}
        <div className={isPortal ? "space-y-12" : "lg:col-span-8 space-y-12"}>
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">{t.community.title}</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">{t.community.desc}</p>
          </div>

          {/* Form for Patients/Guests */}
          {!isDoctor && (
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center gap-5">
                 <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary"><MessageSquare className="w-6 h-6" /></div>
                 <h3 className="font-black text-xl uppercase tracking-tight">{t.community.postTitle}</h3>
              </div>
              <div className="space-y-4">
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={t.community.postTopic} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 font-bold outline-none focus:ring-2 ring-primary/10 transition-all" />
                <textarea value={newBody} onChange={e => setNewBody(e.target.value)} placeholder={t.community.postBody} className="w-full bg-slate-50 border-none rounded-3xl px-6 py-5 min-h-[140px] text-sm font-medium outline-none focus:ring-2 ring-primary/10 transition-all" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" /> {t.community.anonymous}
                </span>
                <button onClick={handlePost} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary transition-all shadow-lg">{t.community.postBtn}</button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-[2rem] border border-slate-100 w-fit">
            {(['All', 'Unanswered'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === f ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {f === 'All' ? t.community.filterAll : t.community.filterUnanswered}
              </button>
            ))}
          </div>

          {/* Feed */}
          <div className="space-y-8">
            {filtered.length > 0 ? filtered.map(c => (
              <div key={c.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:border-primary/20 transition-all space-y-8 group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <span className="px-4 py-2 bg-slate-50 text-slate-500 text-[9px] font-black rounded-xl uppercase tracking-widest border border-slate-100">{c.category}</span>
                    <span className="text-[9px] text-slate-300 font-black uppercase tracking-[0.2em] flex items-center gap-2"><UserCircle2 className="w-4 h-4" /> {c.author}</span>
                  </div>
                  {c.replies.length > 0 && <CheckCircle className="w-6 h-6 text-blue-500" />}
                </div>
                
                <div>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{c.title}</h4>
                  <p className="text-slate-500 text-base leading-relaxed mt-4 font-medium">{c.body}</p>
                </div>

                {c.replies.length > 0 && (
                  <div className="space-y-4 pt-4">
                    {c.replies.map((r, i) => (
                      <div key={i} className="bg-blue-50/30 p-8 rounded-[2.5rem] border border-blue-100/50 space-y-3 relative">
                        <div className="flex items-center gap-3 text-[10px] font-black text-primary uppercase tracking-widest">
                          <Award className="w-5 h-5 text-indigo-500" /> {r.author} <span className="text-slate-400 font-bold lowercase"> • {t.community.doctorReply}</span>
                        </div>
                        <p className="text-base text-slate-800 font-bold italic leading-relaxed">"{r.text}"</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Doctor's Reply Tool in Portal */}
                {isPortal && isDoctor && (
                  <div className="pt-6 space-y-6 border-t border-slate-50">
                    <div className="relative">
                      <textarea 
                        value={replyText[c.id] || ''}
                        onChange={(e) => setReplyText({ ...replyText, [c.id]: e.target.value })}
                        placeholder={t.community.doctorPrompt} 
                        className="w-full bg-slate-50 rounded-3xl p-8 text-sm font-bold border-none outline-none focus:ring-4 focus:ring-primary/5 min-h-[120px] transition-all"
                      />
                      <button 
                        onClick={() => handleReply(c.id)}
                        className="absolute bottom-6 right-6 p-5 bg-primary text-white rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-transform"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                       <TrendingUp className="w-4 h-4 text-blue-500" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.community.reputationPoints} [+50 pts]</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-8 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-300">
                  <button className="flex items-center gap-2 hover:text-primary transition-colors group/btn"><ThumbsUp className="w-4 h-4 group-hover/btn:scale-125 transition-transform" /> {c.likes}</button>
                  <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4" /> {c.replies.length}</span>
                </div>
              </div>
            )) : (
              <div className="py-32 text-center opacity-20 font-black uppercase tracking-[0.4em] text-xl">Нет вопросов в этой категории</div>
            )}
          </div>
        </div>

        {/* PUBLIC SIDEBAR: Stats & Top Doctors */}
        {!isPortal && (
          <div className="lg:col-span-4 space-y-10">
            <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-10 sticky top-32">
               <div className="flex items-center gap-4">
                  <Award className="w-8 h-8 text-amber-400" />
                  <h4 className="text-2xl font-black uppercase tracking-tight">{t.community.topDoctors}</h4>
               </div>
               <div className="space-y-8">
                  {topDoctors.map((doc, i) => (
                    <div key={doc.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-5">
                         <div className="relative">
                            <img src={doc.avatar} className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm" alt="" />
                            <span className="absolute -top-2 -left-2 w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white">{i+1}</span>
                         </div>
                         <div className="min-w-0">
                            <p className="font-black text-base text-slate-800 leading-tight group-hover:text-primary transition-colors truncate">{doc.name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">{doc.specialty}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-indigo-600">{doc.reputationPoints}</p>
                         <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">pts</p>
                      </div>
                    </div>
                  ))}
               </div>
               <button className="w-full py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">Полный рейтинг экспертов</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CommunityPage;
