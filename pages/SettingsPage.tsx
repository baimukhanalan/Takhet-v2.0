
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { User as UserIcon, Shield, Bell, Languages, Lock, FileOutput, MapPin, LogOut, Trash2, CheckCircle } from 'lucide-react';

const SettingsPage: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', icon: UserIcon, label: 'Profile Info' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'security', icon: Lock, label: 'Security & Privacy' },
    { id: 'language', icon: Languages, label: 'Language & Region' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <section className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-8">
              <div className="flex items-center gap-6 border-b border-border pb-8">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-[2rem] border-4 border-secondary p-1 overflow-hidden">
                    <img src={user.avatar} alt="Profile" className="w-full h-full rounded-[1.8rem] object-cover" />
                  </div>
                  <button className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-xl shadow-lg hover:scale-110 transition-transform">
                    <FileOutput className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{user.name}</h3>
                  <p className="text-muted-foreground font-medium capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Full Name</label>
                  <input type="text" defaultValue={user.name} className="w-full bg-background border border-border rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Phone Number</label>
                  <input type="text" defaultValue="+7 (707) 123-45-67" className="w-full bg-background border border-border rounded-2xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
                </div>
              </div>
              <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-blue-800 shadow-xl shadow-primary/20 transition-all">
                Save Profile Changes
              </button>
            </section>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <section className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-6">
              <h3 className="text-xl font-bold mb-4">Notification Preferences</h3>
              {[
                { title: 'Appointment Reminders', desc: 'Get notified 1 hour before your session.', checked: true },
                { title: 'AI Analysis Ready', desc: 'Alert when AI finishes checking your scans.', checked: true },
              ].map((notif, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-background rounded-2xl">
                  <div>
                    <p className="font-bold text-sm">{notif.title}</p>
                    <p className="text-xs text-muted-foreground">{notif.desc}</p>
                  </div>
                  <div className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${notif.checked ? 'bg-success' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${notif.checked ? 'right-1' : 'left-1'}`}></div>
                  </div>
                </div>
              ))}
            </section>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <section className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-accent" /> Privacy & Security
              </h3>
              <div className="pt-8 border-t border-border">
                <button className="flex items-center gap-2 text-destructive hover:bg-red-50 px-4 py-2 rounded-xl transition-colors font-bold text-sm">
                  <Trash2 className="w-4 h-4" /> Delete Account Permanently
                </button>
              </div>
            </section>
          </div>
        );
      case 'language':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <section className="bg-white p-8 rounded-3xl border border-border shadow-sm space-y-6">
              <h3 className="text-xl font-bold mb-4">App Language</h3>
              <div className="grid grid-cols-1 gap-3">
                {['Русский', 'Қазақша', 'English'].map((lang) => (
                  <button key={lang} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${lang === 'English' ? 'border-primary bg-secondary/30' : 'border-border bg-background'}`}>
                    <span className="font-bold text-sm">{lang}</span>
                    {lang === 'English' && <CheckCircle className="w-5 h-5 text-primary" />}
                  </button>
                ))}
              </div>
            </section>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row gap-10">
        <div className="w-full md:w-64 space-y-2">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all font-bold text-sm
                ${activeTab === tab.id 
                  ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' 
                  : 'text-muted-foreground hover:bg-white border border-transparent'}`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-primary'}`} />
              {tab.label}
            </button>
          ))}
          <div className="pt-10">
             <button className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-muted-foreground hover:text-red-600 transition-all font-bold text-sm">
                <LogOut className="w-5 h-5" /> Sign Out
             </button>
          </div>
        </div>
        <div className="flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
