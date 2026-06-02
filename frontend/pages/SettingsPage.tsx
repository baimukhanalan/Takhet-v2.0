
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, Doctor, PartnerAdmin } from '../types';
import { 
  User as UserIcon, Bell, Lock, LogOut, Trash2, Star, Globe, 
  ChevronRight, CheckCircle2, CreditCard, Users, Fingerprint, 
  Mail, Smartphone, Building2, Puzzle, FileText, ShieldCheck, 
  Plus, X, Laptop, Wallet, Stethoscope, Instagram, Linkedin, Eye,
  MessageSquare, Award, Download, ShieldAlert, Calendar, UserCheck, Key, FilePlus, ToggleLeft, ToggleRight
} from 'lucide-react';
import { MockDB } from '../services/db';
import { translations, Language } from '../services/i18n';
import { roleApi } from '../services/roleApi';

const SettingsPage: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<Language>(MockDB.getLang());
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  
  const [formData, setFormData] = useState<any>({});
  const [docData, setDocData] = useState<Partial<Doctor>>({});
  const [admins, setAdmins] = useState<PartnerAdmin[]>([]);
  const [apiInfo, setApiInfo] = useState<string>('');

  useEffect(() => {
    const p = MockDB.getProfile();
    setLang(p.lang || 'ru');
    setFormData({
      name: p.name || user.name,
      dob: p.dob || '',
      gender: p.gender || 'Мужской',
      phone: p.phone || '',
      address: p.address || '',
      bin: p.bin || '',
      lang: p.lang || 'ru',
      notificationsEnabled: p.notificationsEnabled ?? true,
      emailNotifications: p.emailNotifications ?? true,
      pushNotifications: p.pushNotifications ?? true,
      twoFactorEnabled: p.twoFactorEnabled ?? false,
      integrations: p.integrations || { emis: false, emr: true, whiteLabel: false }
    });
    
    if (user.role === UserRole.DOCTOR) {
      const doc = MockDB.getDoctors().find(d => d.id === user.id) || MockDB.getDoctors()[0];
      if (doc) setDocData(doc);
      roleApi.doctorProfile().then((remoteDoc) => {
        setDocData((prev) => ({ ...prev, biography: remoteDoc?.bio || prev.biography }));
      }).catch(() => undefined);
    }
    if (user.role === UserRole.PARTNER) {
      setAdmins(MockDB.getAdmins());
      roleApi.partnerDoctors().then((list) => {
        setApiInfo(`Backend doctors synced: ${list.length}`);
      }).catch(() => setApiInfo('Backend sync unavailable'));
    }
  }, [user]);

  const t = translations[lang];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      MockDB.updateProfile(formData);
      if (user.role === UserRole.DOCTOR) {
        MockDB.updateDoctor(docData.id!, docData);
        await roleApi.doctorUpdateProfile({
          bio: String(docData.biography || ''),
          headline: String(docData.specialty || 'Digital care specialist'),
          languages: ['Русский', 'Қазақша'],
          consultationModes: ['Chat', 'Video'],
          focusAreas: [String(docData.specialty || 'General Practice')],
          education: Array.isArray(docData.education) ? docData.education : [],
          city: 'Almaty',
          clinicName: 'Takhet+ Network',
          responseTargetHours: 2,
          pricePrimary: Number(docData.pricePrimary || 15000),
          accepts: String(docData.accepts || 'Взрослых'),
          availability: []
        });
      }
      setApiInfo('Сохранено (backend sync ok)');
    } catch {
      setApiInfo('Сохранено локально (backend недоступен)');
    } finally {
      setIsSaving(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    }
  };

  const handleLangChange = (l: Language) => {
    setLang(l);
    setFormData({ ...formData, lang: l });
    MockDB.setLang(l);
  };

  const handleEdsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocData({
        ...docData,
        edsVerified: true,
        edsKeyThumbprint: 'SHA256:' + Math.random().toString(16).slice(2, 10).toUpperCase()
      });
      setApiInfo('ЭЦП локально добавлена. Для production нужен backend модуль подписей.');
    }
  };

  const patientTabs = [
    { id: 'profile', icon: UserIcon, label: t.settings.tabs.profile },
    { id: 'medical', icon: FileText, label: t.settings.tabs.medical },
    { id: 'security', icon: Lock, label: t.settings.tabs.security },
    { id: 'notifications', icon: Bell, label: t.settings.tabs.notifications },
  ];

  const doctorTabs = [
    { id: 'profile', icon: Stethoscope, label: t.settings.tabs.profile },
    { id: 'eds', icon: Key, label: 'ЭЦП подпись' },
    { id: 'finance', icon: Wallet, label: t.settings.tabs.finance },
    { id: 'community', icon: MessageSquare, label: t.settings.tabs.community },
    { id: 'security', icon: Lock, label: t.settings.tabs.security },
  ];

  const partnerTabs = [
    { id: 'organization', icon: Building2, label: t.settings.tabs.organization },
    { id: 'integrations', icon: Puzzle, label: t.settings.tabs.integrations },
    { id: 'admins', icon: Users, label: t.settings.tabs.team },
    { id: 'legal', icon: FileText, label: t.settings.tabs.legal },
  ];

  const tabs = user.role === UserRole.PATIENT ? patientTabs : 
               user.role === UserRole.DOCTOR ? doctorTabs : partnerTabs;

  const renderContent = () => {
    switch (activeTab) {
      case 'integrations':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
             <div className="bg-white p-10 rounded-[4rem] border border-border shadow-sm space-y-10">
                <h3 className="text-3xl font-black uppercase tracking-tight">Внешние системы</h3>
                <div className="grid gap-6">
                   {[
                     { id: 'emis', label: 'Интеграция с ЭМИС', desc: 'Автоматическая синхронизация с Damumed/InfoMed', icon: Laptop },
                     { id: 'emr', label: 'Электронные мед. карты', desc: 'Доступ к общему реестру здоровья', icon: FileText },
                     { id: 'whiteLabel', label: 'White Label Mode', desc: 'Использовать ваш логотип и цвета в приложении', icon: Globe }
                   ].map(item => (
                     <div key={item.id} className="p-8 bg-slate-50 rounded-[2.5rem] flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-primary/10">
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm"><item.icon className="w-7 h-7" /></div>
                           <div>
                              <p className="font-black text-lg">{item.label}</p>
                              <p className="text-sm text-slate-400 font-medium">{item.desc}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => setFormData({...formData, integrations: {...formData.integrations, [item.id]: !formData.integrations[item.id]}})}
                          className="transition-all"
                        >
                          {formData.integrations?.[item.id] ? <ToggleRight className="w-10 h-10 text-primary" /> : <ToggleLeft className="w-10 h-10 text-slate-300" />}
                        </button>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        );

      case 'admins':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
             <div className="bg-white p-10 rounded-[4rem] border border-border shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="text-3xl font-black uppercase tracking-tight">Администраторы</h3>
                   <button className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Добавить
                   </button>
                </div>
                <div className="divide-y divide-slate-50">
                   {admins.length > 0 ? admins.map(admin => (
                     <div key={admin.id} className="py-6 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                           <img src={admin.avatar} className="w-12 h-12 rounded-xl object-cover" />
                           <div>
                              <p className="font-black text-slate-800">{admin.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{admin.role}</p>
                           </div>
                        </div>
                        <button className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-5 h-5" /></button>
                     </div>
                   )) : (
                     <div className="py-20 text-center opacity-30 font-black uppercase tracking-widest text-xs">Список пуст</div>
                   )}
                </div>
             </div>
          </div>
        );

      case 'legal':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
             <div className="bg-white p-10 rounded-[4rem] border border-border shadow-sm space-y-10">
                <h3 className="text-3xl font-black uppercase tracking-tight">Юридические данные</h3>
                <div className="grid gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">БИН организации</label>
                      <input value={formData.bin} onChange={e => setFormData({...formData, bin: e.target.value})} className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold outline-none" placeholder="12-ти значный номер" />
                   </div>
                   <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-center justify-between">
                      <div className="flex items-center gap-5">
                         <ShieldCheck className="w-8 h-8 text-primary" />
                         <div>
                            <p className="font-black text-primary uppercase text-xs tracking-widest">Договор сотрудничества</p>
                            <p className="text-xs text-slate-400 font-bold mt-1">Подписан: 12.01.2024</p>
                         </div>
                      </div>
                      <button className="px-6 py-3 bg-white border border-blue-200 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Просмотр</button>
                   </div>
                </div>
             </div>
          </div>
        );

      case 'eds':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
             <div className="bg-white p-10 rounded-[4rem] border border-border shadow-sm space-y-10 relative">
                <div className="flex items-center gap-8 border-b border-slate-100 pb-10">
                   <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-inner ${docData.edsVerified ? 'bg-success/10 text-success' : 'bg-red-50 text-red-500'}`}>
                      <ShieldCheck className="w-10 h-10" />
                   </div>
                   <div>
                      <h3 className="text-3xl font-black">Статус ЭЦП: {docData.edsVerified ? 'Верифицирован' : 'Отсутствует'}</h3>
                      <p className="text-sm text-slate-400 font-medium">Без загруженного ключа ЭЦП проведение консультаций невозможно.</p>
                   </div>
                </div>

                {!docData.edsVerified ? (
                   <label className="flex flex-col items-center justify-center p-16 border-4 border-dashed border-slate-100 rounded-[3.5rem] bg-slate-50 hover:bg-white hover:border-primary/20 transition-all cursor-pointer group">
                      <input type="file" className="hidden" onChange={handleEdsUpload} />
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                        <FilePlus className="w-10 h-10" />
                      </div>
                      <p className="text-xl font-black text-slate-800">Загрузить ключ AUTH/RSA</p>
                      <p className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-widest">Файлы .p12 или .jks</p>
                   </label>
                ) : (
                  <div className="p-8 bg-success/5 rounded-[2.5rem] border border-success/10 space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-success tracking-widest">Ключ активен</span>
                        <button onClick={() => setDocData({...docData, edsVerified: false})} className="text-red-400 hover:text-red-600 text-xs font-bold underline">Удалить ключ</button>
                     </div>
                     <p className="text-sm font-bold text-slate-700">Thumbprint: <span className="font-mono text-xs">{docData.edsKeyThumbprint}</span></p>
                     <p className="text-xs text-slate-400">Данный ключ будет автоматически использоваться для подписи всех медицинских отчетов после приема.</p>
                  </div>
                )}
             </div>
          </div>
        );

      case 'profile':
      case 'organization':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
             <section className="bg-white p-10 rounded-[4rem] border border-border shadow-sm space-y-10 relative">
                <div className="flex items-center gap-8 border-b border-slate-100 pb-10">
                   <div className="w-24 h-24 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                      {user.role === UserRole.PARTNER ? <Building2 className="w-10 h-10" /> : <UserIcon className="w-10 h-10" />}
                   </div>
                   <div>
                      <h3 className="text-3xl font-black">{formData.name}</h3>
                      <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em] mt-1">{user.role}</p>
                   </div>
                   {showSaved && (
                     <div className="absolute top-8 right-10 bg-success/10 text-success px-5 py-2 rounded-2xl flex items-center gap-2 animate-bounce">
                        <CheckCircle2 className="w-4 h-4" /> <span className="text-[10px] font-black uppercase tracking-widest">OK</span>
                     </div>
                   )}
                   {apiInfo && <p className="absolute bottom-2 right-10 text-[9px] font-black uppercase tracking-widest text-slate-400">{apiInfo}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
                        {user.role === UserRole.PARTNER ? t.settings.partner.name : t.settings.patient.fullname}
                      </label>
                      <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold outline-none" />
                   </div>
                   
                   {user.role === UserRole.PATIENT && (
                     <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{t.settings.patient.dob}</label>
                          <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold outline-none" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{t.settings.patient.gender}</label>
                          <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold outline-none">
                            <option value="Мужской">Мужской / Male</option>
                            <option value="Женский">Женский / Female</option>
                          </select>
                        </div>
                     </>
                   )}

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{t.settings.patient.phone}</label>
                      <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold outline-none" />
                   </div>

                   {user.role === UserRole.PARTNER && (
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{t.settings.partner.bin}</label>
                        <input value={formData.bin} onChange={e => setFormData({...formData, bin: e.target.value})} className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold outline-none" />
                     </div>
                   )}

                   <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{t.settings.patient.address}</label>
                      <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold outline-none" />
                   </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{t.settings.patient.lang}</label>
                   <div className="grid grid-cols-3 gap-4">
                      {(['ru', 'kz', 'en'] as Language[]).map(l => (
                        <button key={l} onClick={() => handleLangChange(l)} className={`py-4 rounded-2xl font-black text-[10px] uppercase border-2 transition-all ${lang === l ? 'border-primary bg-primary/5 text-primary' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>{l}</button>
                      ))}
                   </div>
                </div>

                {user.role === UserRole.DOCTOR && (
                   <div className="space-y-6 pt-6 border-t border-slate-100">
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-800">{t.settings.doctor.pro}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{t.settings.doctor.specialty}</label>
                            <input value={docData.specialty} onChange={e => setDocData({...docData, specialty: e.target.value})} className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold outline-none" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{t.settings.doctor.exp}</label>
                            <input type="number" value={docData.experience} onChange={e => setDocData({...docData, experience: +e.target.value})} className="w-full p-6 bg-slate-50 border-none rounded-3xl font-bold outline-none" />
                         </div>
                      </div>
                   </div>
                )}

                <button onClick={handleSave} className="w-full py-6 bg-primary text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3">
                  {isSaving ? <Laptop className="w-4 h-4 animate-spin" /> : t.common.save}
                </button>
             </section>
          </div>
        );

      case 'medical':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
             <div className="bg-white p-10 rounded-[4rem] border border-border shadow-sm space-y-8">
                <div className="flex items-center gap-6">
                   <div className="w-16 h-16 bg-blue-50 text-primary rounded-3xl flex items-center justify-center"><FileText className="w-8 h-8" /></div>
                   <div>
                      <h4 className="text-xl font-black">{t.settings.patient.archive}</h4>
                      <p className="text-xs text-slate-400 font-medium">Управление всеми записями и экспорт истории.</p>
                   </div>
                </div>
                <button className="w-full flex items-center justify-between p-8 bg-slate-50 border border-border rounded-[2.5rem] hover:bg-white hover:shadow-xl transition-all">
                  <div className="flex items-center gap-5">
                      <Download className="w-6 h-6 text-primary" />
                      <div className="text-left">
                         <span className="font-black block">{t.settings.patient.export}</span>
                         <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">PDF, JSON, CSV</span>
                      </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>
             </div>
          </div>
        );

      case 'finance':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
             <div className="bg-white p-10 rounded-[4rem] border border-border shadow-sm space-y-10">
                <h4 className="text-2xl font-black uppercase tracking-tight">{t.settings.doctor.finance}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{t.settings.doctor.pricePrimary}</label>
                      <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl">
                         <input type="number" value={docData.pricePrimary} onChange={e => setDocData({...docData, pricePrimary: +e.target.value})} className="bg-transparent border-none outline-none font-black text-2xl flex-1" />
                         <span className="font-black text-slate-400">₸</span>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{t.settings.doctor.priceSecondary}</label>
                      <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl">
                         <input type="number" value={docData.priceSecondary} onChange={e => setDocData({...docData, priceSecondary: +e.target.value})} className="bg-transparent border-none outline-none font-black text-2xl flex-1" />
                         <span className="font-black text-slate-400">₸</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );

      default: return <div className="p-20 text-center opacity-30 font-black uppercase tracking-widest">Скоро будет доступно</div>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-40">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="w-full lg:w-80 space-y-4 shrink-0">
          <div className="bg-white p-6 rounded-[3.5rem] border border-border shadow-sm space-y-2 sticky top-24">
             {tabs.map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-5 px-6 py-5 rounded-[2rem] transition-all font-black text-xs uppercase tracking-widest
                  ${activeTab === tab.id ? 'bg-primary text-white shadow-2xl shadow-primary/30' : 'text-slate-400 hover:bg-slate-50 hover:text-primary'}`}
              >
                <tab.icon className="w-6 h-6" />
                <span>{tab.label}</span>
              </button>
            ))}
            <div className="h-px bg-slate-100 mx-4 my-4"></div>
            <button onClick={() => navigate('/')} className="w-full flex items-center justify-center gap-4 px-6 py-6 rounded-[2rem] text-red-600 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-red-50 transition-all">
              <LogOut className="w-5 h-5" /> {t.common.logout}
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0">{renderContent()}</div>
      </div>
    </div>
  );
};

export default SettingsPage;
