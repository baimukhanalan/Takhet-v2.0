import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserRole, Doctor, PartnerAdmin } from '../types';
import { 
  User as UserIcon, Bell, Lock, LogOut, Trash2, Globe, 
  ChevronRight, CheckCircle2, Users, 
  Building2, Puzzle, FileText, 
  Plus, Laptop, Wallet, Stethoscope, TrendingUp,
  Download, Key, FilePlus, ToggleLeft, ToggleRight,
  Mail, Smartphone, ShieldAlert, History, CreditCard
} from 'lucide-react';
import { MockDB } from '../services/db';
import { useLanguage } from '../services/useLanguage';
import { Language } from '../services/i18n';

const SettingsPage: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const { t, lang, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    dob: '',
    gender: 'Мужской',
    phone: '',
    address: '',
    bin: '',
    lang: 'ru',
    notificationsEnabled: true,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    twoFactorEnabled: false,
    integrations: { emis: false, emr: true, whiteLabel: false }
  });
  const [docData, setDocData] = useState<Partial<Doctor>>({
    specialty: '',
    experience: 0,
    pricePrimary: 0,
    priceSecondary: 0
  });
  const [admins, setAdmins] = useState<PartnerAdmin[]>([]);

  useEffect(() => {
    const p = MockDB.getProfile();
    setFormData({
      name: p.name || user.name,
      dob: p.dob || '1990-01-01',
      gender: p.gender || 'Мужской',
      phone: p.phone || '+7 (777) 123-45-67',
      address: p.address || 'г. Алматы, пр. Абая 10',
      bin: p.bin || '',
      lang: p.lang || 'ru',
      notificationsEnabled: p.notificationsEnabled ?? true,
      emailNotifications: p.emailNotifications ?? true,
      pushNotifications: p.pushNotifications ?? true,
      smsNotifications: p.smsNotifications ?? false,
      twoFactorEnabled: p.twoFactorEnabled ?? false,
      integrations: p.integrations || { emis: false, emr: true, whiteLabel: false }
    });
    
    if (user.role === UserRole.DOCTOR) {
      const doc = MockDB.getDoctors().find(d => d.id === user.id) || MockDB.getDoctors()[0];
      if (doc) setDocData(doc);
    }
    if (user.role === UserRole.PARTNER) {
      setAdmins(MockDB.getAdmins());
    }
  }, [user]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      MockDB.updateProfile(formData);
      if (user.role === UserRole.DOCTOR) {
        MockDB.updateDoctor(docData.id!, docData);
      }
      setIsSaving(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    }, 800);
  };

  const handleLangChange = (l: Language) => {
    setLanguage(l);
    setFormData({ ...formData, lang: l });
    MockDB.setLang(l);
  };

  const patientTabs = [
    { id: 'profile', icon: UserIcon, label: t.settings.tabs.profile },
    { id: 'security', icon: Lock, label: t.settings.tabs.security },
    { id: 'notifications', icon: Bell, label: t.settings.tabs.notifications },
    { id: 'billing', icon: CreditCard, label: 'Оплата' },
  ];

  const doctorTabs = [
    { id: 'profile', icon: Stethoscope, label: t.settings.tabs.profile },
    { id: 'finance', icon: Wallet, label: t.settings.tabs.finance },
    { id: 'security', icon: Lock, label: t.settings.tabs.security },
  ];

  const partnerTabs = [
    { id: 'organization', icon: Building2, label: t.settings.tabs.organization },
    { id: 'admins', icon: Users, label: t.settings.tabs.team },
    { id: 'legal', icon: FileText, label: t.settings.tabs.legal },
  ];

  const tabs = user.role === UserRole.PATIENT ? patientTabs : 
               user.role === UserRole.DOCTOR ? doctorTabs : partnerTabs;

  const renderContent = () => {
    switch (activeTab) {
      case 'finance':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-2xl space-y-8 md:space-y-12">
              <div className="space-y-2">
                <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-slate-900">Финансы и выплаты</h3>
                <p className="text-sm md:text-base text-slate-400 font-medium">Управление вашим доходом и банковскими реквизитами.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="p-8 md:p-10 bg-slate-950 rounded-[2.5rem] md:rounded-[4rem] text-white space-y-6 md:space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32"></div>
                  <div className="flex justify-between items-start relative z-10">
                    <Wallet className="w-8 h-8 md:w-10 md:h-10 text-emerald-400" />
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest opacity-50">Текущий баланс</span>
                  </div>
                  <div className="space-y-1 relative z-10">
                    <p className="text-3xl md:text-4xl font-black tracking-tighter">1,240,000 ₸</p>
                    <p className="text-[9px] md:text-[10px] font-black text-emerald-400 uppercase tracking-widest">+15% за этот месяц</p>
                  </div>
                  <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all relative z-10">
                    Вывести средства
                  </button>
                </div>

                <div className="p-8 md:p-10 bg-slate-50 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 space-y-6">
                  <h4 className="text-base md:text-lg font-black uppercase tracking-tight">Реквизиты для выплат</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4">IBAN (KZ...)</label>
                      <input 
                        placeholder="KZ000000000000000000"
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4">Банк получателя</label>
                      <select className="w-full p-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm outline-none appearance-none">
                        <option>Kaspi Bank</option>
                        <option>Halyk Bank</option>
                        <option>Forte Bank</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'legal':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-2xl space-y-8 md:space-y-12">
              <div className="space-y-2">
                <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-slate-900">Юридическая информация</h3>
                <p className="text-sm md:text-base text-slate-400 font-medium">Документы, лицензии и договоры с платформой.</p>
              </div>

              <div className="grid gap-4 md:gap-6">
                {[
                  { id: 'license', name: 'Медицинская лицензия', desc: 'Действительна до 12.05.2028', icon: FileText, status: 'Активна' },
                  { id: 'contract', name: 'Договор с Takhet', desc: 'Договор оказания услуг №45-A', icon: FileText, status: 'Подписан' },
                  { id: 'privacy', name: 'Политика конфиденциальности', desc: 'Согласие на обработку данных', icon: Shield, status: 'Принято' },
                ].map(item => (
                  <div key={item.id} className="p-6 md:p-10 bg-slate-50 rounded-[2rem] md:rounded-[4rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-2xl transition-all gap-4">
                    <div className="flex items-center gap-4 md:gap-8 min-w-0">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-slate-900 shadow-sm group-hover:scale-110 transition-transform shrink-0">
                        <item.icon className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base md:text-xl font-black text-slate-900 uppercase tracking-tight break-words">{item.name}</h4>
                        <p className="text-[10px] md:text-xs text-slate-400 font-medium break-words">{item.desc}</p>
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0">
                      {item.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'admins':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-2xl space-y-8 md:space-y-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-slate-900">Команда и доступ</h3>
                  <p className="text-sm md:text-base text-slate-400 font-medium">Управление администраторами и персоналом клиники.</p>
                </div>
                <button className="w-full sm:w-auto px-6 md:px-8 py-4 bg-slate-950 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all">
                  <Plus className="w-4 h-4" /> Добавить
                </button>
              </div>

              <div className="grid gap-4 md:gap-6">
                {admins.map((admin, i) => (
                  <div key={i} className="p-6 md:p-8 bg-slate-50 rounded-[2rem] md:rounded-[3rem] border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-2xl transition-all flex items-center justify-between group gap-4 min-w-0">
                    <div className="flex items-center gap-4 md:gap-8 min-w-0">
                      <div className="w-12 md:w-16 h-12 md:h-16 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-slate-900 shadow-sm shrink-0">
                        <UserIcon className="w-6 md:w-8 h-6 md:h-8" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base md:text-xl font-black text-slate-900 uppercase tracking-tight break-words">{admin.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-1 min-w-0">
                          <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest break-all">{admin.email}</span>
                          <span className="px-2 md:px-3 py-0.5 md:py-1 bg-slate-200 text-slate-600 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest shrink-0">{admin.role}</span>
                        </div>
                      </div>
                    </div>
                    <button className="p-2 md:p-4 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                      <Trash2 className="w-5 md:w-6 h-5 md:h-6" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'profile':
      case 'organization':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 shadow-2xl space-y-8 md:space-y-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-[100px] -mr-48 -mt-48 opacity-50"></div>
              
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 border-b border-slate-50 pb-8 md:pb-12 relative z-10">
                <div className="relative group">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] md:rounded-[4rem] bg-slate-100 flex items-center justify-center text-slate-400 shadow-inner overflow-hidden border-4 border-white">
                    {user.role === UserRole.PARTNER ? <Building2 className="w-12 md:w-16 h-12 md:h-16" /> : <UserIcon className="w-12 md:w-16 h-12 md:h-16" />}
                  </div>
                  <button className="absolute bottom-1 md:bottom-2 right-1 md:right-2 w-10 md:w-12 h-10 md:h-12 bg-slate-950 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl hover:bg-emerald-600 transition-all border-4 border-white">
                    <Plus className="w-5 md:w-6 h-5 md:h-6" />
                  </button>
                </div>
                <div className="text-center md:text-left space-y-3 min-w-0">
                  <h3 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-slate-900 leading-tight break-words">{formData.name}</h3>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
                    <span className="px-4 md:px-6 py-1.5 md:py-2 bg-slate-950 text-white rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shrink-0">{user.role}</span>
                    <span className="px-4 md:px-6 py-1.5 md:py-2 bg-emerald-50 text-emerald-600 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-emerald-100 shrink-0">Активен</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 relative z-10">
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-400 ml-4 md:ml-8">Полное имя / Название</label>
                  <input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full p-5 md:p-8 bg-slate-50 border-2 border-transparent focus:border-emerald-200 focus:bg-white rounded-2xl md:rounded-[3rem] font-black text-base md:text-xl outline-none transition-all shadow-sm" 
                  />
                </div>
                
                {user.role === UserRole.PATIENT && (
                  <>
                    <div className="space-y-3 md:space-y-4">
                      <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-400 ml-4 md:ml-8">Дата рождения</label>
                      <input 
                        type="date" 
                        value={formData.dob} 
                        onChange={e => setFormData({...formData, dob: e.target.value})} 
                        className="w-full p-5 md:p-8 bg-slate-50 border-2 border-transparent focus:border-emerald-200 focus:bg-white rounded-2xl md:rounded-[3rem] font-black text-base md:text-xl outline-none transition-all shadow-sm" 
                      />
                    </div>
                    <div className="space-y-3 md:space-y-4">
                      <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-400 ml-4 md:ml-8">Пол</label>
                      <select 
                        value={formData.gender} 
                        onChange={e => setFormData({...formData, gender: e.target.value})} 
                        className="w-full p-5 md:p-8 bg-slate-50 border-2 border-transparent focus:border-emerald-200 focus:bg-white rounded-2xl md:rounded-[3rem] font-black text-base md:text-xl outline-none transition-all shadow-sm appearance-none"
                      >
                        <option value="Мужской">Мужской</option>
                        <option value="Женский">Женский</option>
                      </select>
                    </div>
                  </>
                )}
                
                <div className="space-y-3 md:space-y-4">
                  <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-400 ml-4 md:ml-8">Телефон</label>
                  <input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full p-5 md:p-8 bg-slate-50 border-2 border-transparent focus:border-emerald-200 focus:bg-white rounded-2xl md:rounded-[3rem] font-black text-base md:text-xl outline-none transition-all shadow-sm" 
                  />
                </div>

                {user.role === UserRole.PARTNER && (
                  <div className="space-y-3 md:space-y-4">
                    <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-400 ml-4 md:ml-8">БИН организации</label>
                    <input 
                      value={formData.bin} 
                      onChange={e => setFormData({...formData, bin: e.target.value})} 
                      className="w-full p-5 md:p-8 bg-slate-50 border-2 border-transparent focus:border-emerald-200 focus:bg-white rounded-2xl md:rounded-[3rem] font-black text-base md:text-xl outline-none transition-all shadow-sm" 
                    />
                  </div>
                )}

                <div className="space-y-3 md:space-y-4 md:col-span-2">
                  <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-400 ml-4 md:ml-8">Адрес проживания / Регистрации</label>
                  <input 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    className="w-full p-5 md:p-8 bg-slate-50 border-2 border-transparent focus:border-emerald-200 focus:bg-white rounded-2xl md:rounded-[3rem] font-black text-base md:text-xl outline-none transition-all shadow-sm" 
                  />
                </div>
              </div>

              <div className="pt-8 md:pt-12 border-t border-slate-50 space-y-6 md:space-y-8 relative z-10">
                <label className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-slate-400 ml-4 md:ml-8">Язык интерфейса</label>
                <div className="grid grid-cols-3 gap-3 md:gap-6">
                  {(['ru', 'kz', 'en'] as Language[]).map(l => (
                    <button 
                      key={l} 
                      onClick={() => handleLangChange(l)} 
                      className={`py-4 md:py-6 rounded-xl md:rounded-[2rem] font-black text-[10px] md:text-xs uppercase tracking-widest border-2 transition-all ${lang === l ? 'bg-slate-950 text-white border-slate-950 shadow-2xl' : 'bg-slate-50 text-slate-400 border-transparent hover:border-emerald-200 hover:text-emerald-600'}`}
                    >
                      {l === 'ru' ? 'Русский' : l === 'kz' ? 'Қазақша' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave} 
                className="w-full py-6 md:py-10 bg-slate-950 text-white rounded-[2rem] md:rounded-[3.5rem] font-black uppercase text-[10px] md:text-[12px] tracking-[0.3em] md:tracking-[0.4em] shadow-[0_20px_40px_rgba(0,0,0,0.15)] md:shadow-[0_30px_60px_rgba(0,0,0,0.2)] hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 md:gap-6 relative z-10"
              >
                {isSaving ? <Laptop className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : 'Сохранить изменения'}
              </motion.button>
            </div>
          </motion.div>
        );

      case 'security':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl space-y-12">
              <div className="space-y-2">
                <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Безопасность</h3>
                <p className="text-slate-400 font-medium">Управляйте доступом и защитой вашего аккаунта.</p>
              </div>

              <div className="space-y-10">
                <div className="p-10 bg-slate-50 rounded-[4rem] border border-slate-100 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-sm">
                        <Lock className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Двухфакторная аутентификация</h4>
                        <p className="text-xs text-slate-400 font-medium">Дополнительный уровень защиты через SMS или приложение.</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setFormData({...formData, twoFactorEnabled: !formData.twoFactorEnabled})}
                      className="transition-all"
                    >
                      {formData.twoFactorEnabled ? <ToggleRight className="w-14 h-14 text-emerald-500" /> : <ToggleLeft className="w-14 h-14 text-slate-300" />}
                    </button>
                  </div>
                </div>

                <div className="grid gap-6">
                  <button className="w-full p-10 bg-white border-2 border-slate-50 rounded-[4rem] hover:border-emerald-200 hover:shadow-2xl transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-8">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <Key className="w-8 h-8" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Сменить пароль</h4>
                        <p className="text-xs text-slate-400 font-medium">Последнее изменение: 3 месяца назад</p>
                      </div>
                    </div>
                    <ChevronRight className="w-8 h-8 text-slate-200 group-hover:text-emerald-500 transition-colors" />
                  </button>

                  <button className="w-full p-10 bg-white border-2 border-slate-50 rounded-[4rem] hover:border-indigo-200 hover:shadow-2xl transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-8">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <Smartphone className="w-8 h-8" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Активные сессии</h4>
                        <p className="text-xs text-slate-400 font-medium">3 устройства подключено</p>
                      </div>
                    </div>
                    <ChevronRight className="w-8 h-8 text-slate-200 group-hover:text-indigo-500 transition-colors" />
                  </button>
                </div>

                <div className="pt-10 border-t border-slate-50">
                  <button className="flex items-center gap-4 text-red-500 font-black uppercase tracking-widest text-[10px] hover:text-red-700 transition-colors">
                    <Trash2 className="w-5 h-5" /> Удалить аккаунт навсегда
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 'notifications':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl space-y-12">
              <div className="space-y-2">
                <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Уведомления</h3>
                <p className="text-slate-400 font-medium">Настройте как и когда вы хотите получать обновления.</p>
              </div>

              <div className="grid gap-8">
                {[
                  { id: 'emailNotifications', title: 'Email уведомления', desc: 'Отчеты, чеки и важные обновления', icon: Mail },
                  { id: 'pushNotifications', title: 'Push уведомления', desc: 'Напоминания о приемах и сообщения от врачей', icon: Bell },
                  { id: 'smsNotifications', title: 'SMS уведомления', desc: 'Критические оповещения и коды доступа', icon: Smartphone },
                ].map(item => (
                  <div key={item.id} className="p-6 md:p-10 bg-slate-50 rounded-[2rem] md:rounded-[4rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-2xl transition-all gap-4">
                    <div className="flex items-center gap-4 md:gap-8 min-w-0">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-slate-900 shadow-sm group-hover:scale-110 transition-transform shrink-0">
                        <item.icon className="w-6 h-6 md:w-8 md:h-8" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-base md:text-xl font-black text-slate-900 uppercase tracking-tight break-words">{item.title}</h4>
                        <p className="text-[10px] md:text-xs text-slate-400 font-medium break-words">{item.desc}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setFormData({...formData, [item.id]: !formData[item.id]})}
                      className="transition-all shrink-0"
                    >
                      {formData[item.id] ? <ToggleRight className="w-10 h-10 md:w-14 md:h-14 text-emerald-500" /> : <ToggleLeft className="w-10 h-10 md:w-14 md:h-14 text-slate-300" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'billing':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-2xl space-y-12">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Оплата и счета</h3>
                  <p className="text-slate-400 font-medium">Управляйте способами оплаты и историей транзакций.</p>
                </div>
                <button className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-emerald-600 transition-all">
                  <Plus className="w-4 h-4" /> Добавить карту
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[4rem] text-white space-y-12 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                  <div className="flex justify-between items-start relative z-10">
                    <CreditCard className="w-12 h-12 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Основная карта</span>
                  </div>
                  <div className="space-y-4 relative z-10">
                    <p className="text-3xl font-mono tracking-[0.2em]">•••• •••• •••• 4589</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Владелец</p>
                        <p className="text-sm font-black uppercase tracking-tight">{formData.name}</p>
                      </div>
                      <p className="text-lg font-black italic">VISA</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-10 bg-slate-50 rounded-[4rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-6 group hover:bg-white hover:border-emerald-200 transition-all cursor-pointer">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-emerald-500 transition-colors shadow-sm">
                    <Plus className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Добавить новый <br/>способ оплаты</p>
                </div>
              </div>

              <div className="space-y-8">
                <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Последние транзакции</h4>
                <div className="space-y-4">
                  {[
                    { title: 'Консультация (Психолог)', amount: '-15,000 ₸', date: 'Сегодня, 14:20', status: 'Успешно' },
                    { title: 'Пополнение баланса', amount: '+50,000 ₸', date: '18 Марта, 10:00', status: 'Успешно' },
                  ].map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-8 bg-slate-50 rounded-[3rem] border border-transparent hover:border-slate-100 hover:bg-white transition-all">
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${t.amount.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                          {t.amount.startsWith('+') ? <TrendingUp className="w-7 h-7" /> : <CreditCard className="w-7 h-7" />}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{t.title}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-black ${t.amount.startsWith('+') ? 'text-emerald-600' : 'text-slate-900'}`}>{t.amount}</p>
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{t.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return (
          <div className="py-40 text-center bg-white rounded-[5rem] border border-slate-100 shadow-2xl">
            <Puzzle className="w-20 h-20 text-slate-100 mx-auto mb-8" />
            <p className="font-black uppercase tracking-[0.5em] text-sm text-slate-300">В разработке</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-12 py-6 md:py-12 space-y-10 md:space-y-16">
      <div className="flex flex-col lg:flex-row gap-8 md:gap-16">
        {/* Sidebar */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[5rem] border border-slate-100 shadow-2xl space-y-4 lg:sticky lg:top-32">
            <div className="px-4 md:px-8 py-4 md:py-6 mb-2 md:mb-6">
              <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase text-slate-950">Настройки</h2>
              <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1 md:mt-2">Управление аккаунтом</p>
            </div>
            
            <div className="flex lg:flex-col gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
              {tabs.map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-none lg:w-full flex items-center gap-3 md:gap-6 px-5 md:px-8 py-4 md:py-6 rounded-2xl md:rounded-[3rem] transition-all font-black text-[9px] md:text-[10px] uppercase tracking-[0.15em] md:tracking-[0.2em] relative group whitespace-nowrap overflow-hidden
                    ${activeTab === tab.id ? 'text-white' : 'text-slate-400 hover:bg-slate-50 hover:text-emerald-600'}`}
                >
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="activeTabBg"
                      className="absolute inset-0 bg-slate-950 rounded-2xl md:rounded-[3rem] shadow-[0_10px_20px_rgba(0,0,0,0.15)] md:shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <tab.icon className={`w-4 h-4 md:w-6 md:h-6 relative z-10 shrink-0 ${activeTab === tab.id ? 'text-emerald-400' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="relative z-10 text-center break-words whitespace-normal">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="hidden lg:block h-px bg-slate-50 mx-8 my-8"></div>

            <button 
              onClick={() => navigate('/')} 
              className="w-full flex items-center justify-center gap-4 md:gap-6 px-6 md:px-10 py-5 md:py-8 rounded-2xl md:rounded-[3rem] text-red-500 font-black text-[9px] md:text-[11px] uppercase tracking-[0.3em] md:tracking-[0.4em] hover:bg-red-50 transition-all group mt-4 lg:mt-0"
            >
              <LogOut className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-2 transition-transform" /> Выйти из системы
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSaved && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 md:bottom-12 right-4 md:right-12 z-[10005] bg-emerald-500 text-white px-8 md:px-12 py-4 md:py-6 rounded-2xl md:rounded-[3rem] flex items-center gap-4 md:gap-6 shadow-[0_20px_40px_rgba(16,185,129,0.3)] md:shadow-[0_30px_60px_rgba(16,185,129,0.4)] border border-white/20"
          >
            <div className="w-10 h-10 md:w-12 h-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">Успешно сохранено</p>
              <p className="text-[10px] md:text-xs opacity-80 font-medium">Ваши настройки были обновлены</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
