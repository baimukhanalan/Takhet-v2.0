
import React from 'react';
import { User } from '../types';
import { Building2, Users, Briefcase, TrendingUp, ArrowUpRight, ShieldCheck, Globe, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CLINIC_PERFORMANCE = [
  { month: 'Jan', revenue: 4200, consults: 120 },
  { month: 'Feb', revenue: 3800, consults: 110 },
  { month: 'Mar', revenue: 5100, consults: 150 },
  { month: 'Apr', revenue: 6200, consults: 180 },
  { month: 'May', revenue: 5800, consults: 165 },
];

const PartnerDashboard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6" />
             </div>
             <h3 className="text-xl font-bold text-primary">City Medical Center</h3>
          </div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Organization Overview</h1>
          <p className="text-muted-foreground mt-2 text-lg">Your clinic is performing at <span className="text-success font-bold">120% efficiency</span> this month.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3.5 bg-white border border-border rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
             Export Reports
          </button>
          <button className="px-6 py-3.5 bg-primary text-white rounded-2xl font-bold hover:bg-blue-800 transition-all flex items-center gap-2 shadow-xl shadow-primary/20">
             Manage Doctors
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { label: 'Active Doctors', val: '24', icon: Users, color: 'text-primary bg-primary/10' },
          { label: 'Total Consults', val: '1,420', icon: Briefcase, color: 'text-accent bg-accent/10' },
          { label: 'Revenue (MTD)', val: '₸5.8M', icon: TrendingUp, color: 'text-success bg-success/10' },
          { label: 'White-Label', val: 'Active', icon: Globe, color: 'text-purple-600 bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-border shadow-sm group hover:scale-[1.02] transition-transform">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-extrabold text-foreground mt-1">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-border shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-extrabold">Revenue Growth</h2>
              <select className="bg-background border-none text-xs font-bold rounded-xl px-4 py-2">
                 <option>Last 6 Months</option>
              </select>
           </div>
           <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CLINIC_PERFORMANCE}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEFF1" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip cursor={{fill: '#F5F9FF'}} contentStyle={{borderRadius: '1.5rem', border: 'none'}} />
                  <Bar dataKey="revenue" radius={[10, 10, 0, 0]} fill="#0D47A1" />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden">
              <h3 className="text-xl font-bold mb-4">Verification Status</h3>
              <div className="flex items-center gap-3 text-success mb-6">
                 <ShieldCheck className="w-8 h-8" />
                 <span className="font-bold uppercase tracking-widest text-sm">Enterprise Verified</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">All your doctors meet the Kazakhstan Ministry of Health requirements for telemedicine.</p>
              <button className="w-full py-4 bg-white/10 border border-white/20 rounded-2xl font-bold hover:bg-white/20 transition-all">
                 View Compliance
              </button>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm">
              <h3 className="font-bold text-lg mb-6">Top Performers</h3>
              <div className="space-y-6">
                 {[
                   { name: 'Dr. Petrova', rating: 4.9, consults: 142 },
                   { name: 'Dr. Bolat', rating: 4.8, consults: 98 },
                 ].map((doc, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-primary">DP</div>
                         <div>
                            <p className="text-sm font-bold">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground">{doc.consults} sessions</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                         <Star className="w-3 h-3 fill-current" /> {doc.rating}
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerDashboard;
