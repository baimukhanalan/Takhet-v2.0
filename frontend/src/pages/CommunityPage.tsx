import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Award,
  CheckCircle,
  CheckCircle2,
  MessageSquare,
  Send,
  ThumbsUp,
  TrendingUp,
  UserCircle2
} from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import { FadeIn, FadeInStagger } from '../components/FadeIn';
import type { Complaint } from '../services/db';
import { useLanguage } from '../services/useLanguage';
import { User, UserRole } from '../types';
import { roleApi } from '../../services/roleApi';

const looksCorrupted = (value?: string) =>
  typeof value === 'string' &&
  (value.includes('\u0420') || value.includes('\u0421\u0403') || value.includes('\u0432\u0402') || value.includes('\u043F\u0457\u0405') || value.includes('???'));

const sanitizeCommunityText = (value: string, fallback: string) => {
  const normalized = value?.trim() || '';
  if (!normalized || looksCorrupted(normalized)) return fallback;
  return normalized;
};

const CommunityPage: React.FC<{ user?: User; isPortal: boolean }> = ({ user, isPortal }) => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Unanswered'>('All');
  const [replyText, setReplyText] = useState<{ [id: string]: string }>({});
  const [topDoctors, setTopDoctors] = useState<any[]>([]);

  const isDoctor = user?.role === UserRole.DOCTOR;
  const localizedFallbacks = useMemo(
    () => ({
      anonymous: lang === 'kk' ? 'Анонимді' : lang === 'en' ? 'Anonymous' : 'Анонимно',
      patientQuestion: lang === 'kk' ? 'Пациент сұрағы' : lang === 'en' ? 'Patient question' : 'Вопрос пациента',
      requestUnavailable:
        lang === 'kk'
          ? 'Өтініш сипаттамасы уақытша қолжетімсіз.'
          : lang === 'en'
            ? 'The request description is temporarily unavailable.'
            : 'Описание обращения временно недоступно.',
      general: lang === 'kk' ? 'Жалпы' : lang === 'en' ? 'General' : 'Общее',
      doctor: lang === 'kk' ? 'Takhet+ дәрігері' : lang === 'en' ? 'Takhet+ doctor' : 'Врач Takhet+',
      doctorReplyUnavailable:
        lang === 'kk'
          ? 'Дәрігер жауабы уақытша қолжетімсіз.'
          : lang === 'en'
            ? 'The doctor reply is temporarily unavailable.'
            : 'Ответ врача временно недоступен.',
      specialist: lang === 'kk' ? 'Takhet+ маманы' : lang === 'en' ? 'Takhet+ specialist' : 'Специалист Takhet+',
      generalPractice: lang === 'kk' ? 'Жалпы практика' : lang === 'en' ? 'General practice' : 'Общая практика',
      empty: lang === 'kk' ? 'Бұл санатта сұрақ жоқ' : lang === 'en' ? 'No questions in this category' : 'Нет вопросов в этой категории',
      fullRating: lang === 'kk' ? 'Сарапшылардың толық рейтингі' : lang === 'en' ? 'Full expert rating' : 'Полный рейтинг экспертов'
    }),
    [lang]
  );

  const normalizeCommunityPost = useCallback(
    (item: Complaint): Complaint => ({
      ...item,
      author: sanitizeCommunityText(item.author, localizedFallbacks.anonymous),
      title: sanitizeCommunityText(item.title, localizedFallbacks.patientQuestion),
      body: sanitizeCommunityText(item.body, localizedFallbacks.requestUnavailable),
      category: sanitizeCommunityText(item.category, localizedFallbacks.general),
      replies: (item.replies || []).map((reply) => ({
        ...reply,
        author: sanitizeCommunityText(reply.author, localizedFallbacks.doctor),
        text: sanitizeCommunityText(reply.text, localizedFallbacks.doctorReplyUnavailable)
      }))
    }),
    [localizedFallbacks]
  );

  const normalizeCommunityDoctor = useCallback(
    (doctor: any) => ({
      ...doctor,
      name: sanitizeCommunityText(doctor.name, localizedFallbacks.specialist),
      specialty: sanitizeCommunityText(doctor.specialty, localizedFallbacks.generalPractice)
    }),
    [localizedFallbacks]
  );

  const refreshPosts = useCallback(async () => {
    const posts = await roleApi.communityPosts();
    setComplaints(posts.map(normalizeCommunityPost));
  }, [normalizeCommunityPost]);

  useEffect(() => {
    const load = async () => {
      const [posts, doctors] = await Promise.all([roleApi.communityPosts(), roleApi.communityTopDoctors()]);
      setComplaints(posts.map(normalizeCommunityPost));
      setTopDoctors(doctors.map(normalizeCommunityDoctor));
    };
    void load();
  }, [normalizeCommunityDoctor, normalizeCommunityPost]);

  useEffect(() => {
    if (isDoctor && isPortal) setActiveFilter('Unanswered');
  }, [isDoctor, isPortal]);

  const handlePost = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    await roleApi.communityCreatePost({
      author: localizedFallbacks.anonymous,
      title: newTitle,
      body: newBody,
      category: localizedFallbacks.general
    });
    setNewTitle('');
    setNewBody('');
    await refreshPosts();
  };

  const handleReply = async (complaintId: string) => {
    if (!isDoctor) {
      navigate('/auth');
      return;
    }
    const text = replyText[complaintId];
    if (!text?.trim() || !user) return;

    await roleApi.communityReply(complaintId, text);
    setReplyText({ ...replyText, [complaintId]: '' });
    await refreshPosts();
  };

  const filtered = complaints.filter((complaint) => {
    if (activeFilter === 'Unanswered') return complaint.replies.length === 0;
    return true;
  });

  const containerClass = isPortal
    ? 'max-w-6xl mx-auto space-y-10 px-4 md:px-0'
    : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 pt-24 sm:pt-28 md:pt-36 lg:pt-44 pb-20 md:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12';

  return (
    <div className={!isPortal ? 'min-h-screen bg-white' : ''}>
      {!isPortal && <PublicHeader activePath="/community" />}

      <main className={containerClass}>
        <div className={isPortal ? 'space-y-8 md:space-y-12' : 'lg:col-span-8 space-y-8 md:space-y-12'}>
          <FadeIn direction="up">
            <div className="space-y-3 md:space-y-4">
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-tight">
                {t.community.title}
              </h1>
              <p className="text-slate-400 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.3em] md:tracking-[0.4em]">
                {t.community.desc}
              </p>
            </div>
          </FadeIn>

          {!isDoctor && (
            <FadeIn direction="up" delay={0.1}>
              <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-sm space-y-6 md:space-y-8">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/5 rounded-xl md:rounded-2xl flex items-center justify-center text-primary">
                    <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <h3 className="font-black text-lg md:text-xl uppercase tracking-tight">{t.community.postTitle}</h3>
                </div>
                <div className="space-y-4">
                  <input
                    value={newTitle}
                    onChange={(event) => setNewTitle(event.target.value)}
                    placeholder={t.community.postTopic}
                    className="w-full bg-slate-50 border-none rounded-xl md:rounded-2xl px-5 md:px-6 py-4 md:py-5 font-bold outline-none focus:ring-2 ring-primary/10 transition-all text-sm md:text-base"
                  />
                  <textarea
                    value={newBody}
                    onChange={(event) => setNewBody(event.target.value)}
                    placeholder={t.community.postBody}
                    className="w-full bg-slate-50 border-none rounded-2xl md:rounded-3xl px-5 md:px-6 py-4 md:py-5 min-h-[120px] md:min-h-[140px] text-xs md:text-sm font-medium outline-none focus:ring-2 ring-primary/10 transition-all"
                  />
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
                  <span className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" /> {t.community.anonymous}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePost}
                    className="w-full sm:w-auto px-10 md:px-12 py-4 md:py-5 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:bg-primary transition-all shadow-lg"
                  >
                    {t.community.postBtn}
                  </motion.button>
                </div>
              </div>
            </FadeIn>
          )}

          <FadeIn direction="up" delay={0.2}>
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 w-full sm:w-fit overflow-x-auto no-scrollbar">
              {(['All', 'Unanswered'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`flex-1 sm:flex-none px-6 md:px-8 py-2.5 md:py-3 rounded-[1.2rem] md:rounded-[1.5rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeFilter === filter ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {activeFilter === filter && (
                    <motion.div
                      layoutId="activeFilter"
                      className="absolute inset-0 bg-white shadow-sm rounded-[1.2rem] md:rounded-[1.5rem]"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{filter === 'All' ? t.community.filterAll : t.community.filterUnanswered}</span>
                </button>
              ))}
            </div>
          </FadeIn>

          <FadeInStagger className="space-y-6 md:space-y-8">
            {filtered.length > 0 ? (
              filtered.map((complaint) => (
                <FadeIn key={complaint.id}>
                  <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-sm hover:border-primary/20 transition-all space-y-6 md:space-y-8 group">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-wrap items-center gap-3 md:gap-4">
                        <span className="px-3 md:px-4 py-1.5 md:py-2 bg-slate-50 text-slate-500 text-[8px] md:text-[9px] font-black rounded-lg md:rounded-xl uppercase tracking-widest border border-slate-100">
                          {complaint.category}
                        </span>
                        <span className="text-[8px] md:text-[9px] text-slate-300 font-black uppercase tracking-[0.1em] md:tracking-[0.2em] flex items-center gap-1.5 md:gap-2">
                          <UserCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" /> {complaint.author}
                        </span>
                      </div>
                      {complaint.replies.length > 0 && <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-blue-500 shrink-0" />}
                    </div>

                    <div>
                      <h4 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">{complaint.title}</h4>
                      <p className="text-slate-500 text-sm md:text-base leading-relaxed mt-3 md:mt-4 font-medium">{complaint.body}</p>
                    </div>

                    <AnimatePresence>
                      {complaint.replies.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-4 pt-2 md:pt-4 overflow-hidden"
                        >
                          {complaint.replies.map((reply, index) => (
                            <div
                              key={`${reply.author}-${index}`}
                              className="bg-blue-50/30 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-blue-100/50 space-y-2 md:space-y-3 relative"
                            >
                              <div className="flex items-center gap-2 md:gap-3 text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest">
                                <Award className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" /> {reply.author}
                                <span className="text-slate-400 font-bold lowercase"> • {t.community.doctorReply}</span>
                              </div>
                              <p className="text-sm md:text-base text-slate-800 font-bold italic leading-relaxed">"{reply.text}"</p>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {isPortal && isDoctor && (
                      <div className="pt-4 md:pt-6 space-y-4 md:space-y-6 border-t border-slate-50">
                        <div className="relative">
                          <textarea
                            value={replyText[complaint.id] || ''}
                            onChange={(event) => setReplyText({ ...replyText, [complaint.id]: event.target.value })}
                            placeholder={t.community.doctorPrompt}
                            className="w-full bg-slate-50 rounded-2xl md:rounded-3xl p-6 md:p-8 text-xs md:text-sm font-bold border-none outline-none focus:ring-4 focus:ring-primary/5 min-h-[100px] md:min-h-[120px] transition-all"
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleReply(complaint.id)}
                            className="absolute bottom-4 right-4 md:bottom-6 md:right-6 p-4 md:p-5 bg-primary text-white rounded-xl md:rounded-2xl shadow-xl transition-transform"
                          >
                            <Send className="w-4 h-4 md:w-5 md:h-5" />
                          </motion.button>
                        </div>
                        <div className="flex items-center justify-center gap-2 md:gap-3">
                          <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" />
                          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {t.community.reputationPoints} [+50 pts]
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-6 md:gap-8 pt-2 md:pt-4 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-300">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center gap-2 hover:text-primary transition-colors group/btn"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover/btn:scale-125 transition-transform" /> {complaint.likes}
                      </motion.button>
                      <span className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" /> {complaint.replies.length}
                      </span>
                    </div>
                  </div>
                </FadeIn>
              ))
            ) : (
              <div className="py-20 md:py-32 text-center opacity-20 font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-lg md:text-xl">
                {localizedFallbacks.empty}
              </div>
            )}
          </FadeInStagger>
        </div>

        {!isPortal && (
          <div className="lg:col-span-4 space-y-8 md:space-y-10">
            <FadeIn direction="left" delay={0.4}>
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8 md:space-y-10 lg:sticky lg:top-32">
                <div className="flex items-center gap-3 md:gap-4">
                  <Award className="w-6 h-6 md:w-8 md:h-8 text-amber-400" />
                  <h4 className="text-xl md:text-2xl font-black uppercase tracking-tight">{t.community.topDoctors}</h4>
                </div>
                <FadeInStagger className="space-y-6 md:space-y-8">
                  {topDoctors.map((doctor, index) => (
                    <FadeIn key={doctor.id}>
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-4 md:gap-5">
                          <div className="relative">
                            <img
                              src={doctor.avatar}
                              className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl object-cover border-2 border-white shadow-sm"
                              alt=""
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute -top-1.5 -left-1.5 w-6 h-6 md:w-7 md:h-7 bg-slate-900 text-white rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-black border-2 border-white">
                              {index + 1}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-sm md:text-base text-slate-800 leading-tight group-hover:text-primary transition-colors break-words">
                              {doctor.name}
                            </p>
                            <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">{doctor.specialty}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs md:text-sm font-black text-indigo-600">{doctor.reputationPoints}</p>
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">pts</p>
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </FadeInStagger>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 md:py-5 bg-slate-50 text-slate-400 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                >
                  {localizedFallbacks.fullRating}
                </motion.button>
              </div>
            </FadeIn>
          </div>
        )}
      </main>
    </div>
  );
};

export default CommunityPage;
