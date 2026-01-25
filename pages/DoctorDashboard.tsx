
import React from 'react';
import { User, Appointment } from '../types';
import { Users, Video, DollarSign, Star, MoreVertical, Calendar as CalendarIcon, ArrowUpRight, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Link } from 'react-router-dom';

const REVENUE_DATA = [
  { name: 'Mon', amount: 120 },
  { name: 'Tue', amount: 300 },
  { name: 'Wed', amount: 200 },
  { name: 'Thu', amount: 450 },
  { name: 'Fri', amount: 320 },
  { name: 'Sat', amount: 150 },
  { name: 'Sun', amount: 90 },
];

// Fix: Added missing 'date' property to satisfy Appointment interface
const MOCK_APPOINTMENTS: Appointment[] = [
  { id: '101', patientName: 'Damir Amangeldy', doctorName: 'Self', time: '14:00', status: 'ongoing', type: 'Video', date: '2025-05-20' },
  { id: '102', patientName: 'Assem Bolatova', doctorName: 'Self', time: '15:30', status: 'upcoming', type: 'Video', date: '2025-05-20' },
  { id: '103', patientName: 'Kirill Kim', doctorName: 'Self', time: '17:00', status: 'upcoming', type: 'Chat', date: '2025-05-20' },
];

const DoctorDashboard: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Dr. {user.name.split(' ')[2] || user.name.split(' ')[0]}'s Practice</h1>
          <p className="text-muted-foreground mt-2 text-lg">You have <span className="text-foreground font-bold">5 appointments</span> scheduled for today.</p>
        </div>
        <div className="flex items-center gap-5 bg-white px-8 py-4 rounded-[1.5rem] border border-border shadow-sm">
          <div className="flex items-center gap-2 text-amber-500">
            <Star className="w-5 h-5 fill-current" />
            <span className="text-xl font-bold">4.9</span>
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Expert Platinum</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[
          { icon: Video, color: 'bg-blue-50 text-primary', label: 'Sessions', val: '128' },
          { icon: Users, color: 'bg-green-50 text-success', label: 'Patients', val: '842' },
          { icon: DollarSign, color: 'bg-orange-50 text-orange-600', label: 'Monthly', val: '$4.2k' },
          { icon: CalendarIcon, color: 'bg-purple-50 text-purple-600', label: 'Load', val: '85%' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-3xl border border-border shadow-sm flex items-center gap-6 group hover:scale-[1.02] transition-transform">
            <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center shadow-inner`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-extrabold text-foreground mt-1">{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-border shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-extrabold">Weekly Earnings</h2>
                <p className="text-sm text-muted-foreground">Detailed revenue breakdown</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-success flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +14.2%</span>
                <select className="bg-background border-none text-xs font-bold rounded-xl px-4 py-2 outline-none">
                  <option>May 2025</option>
                </select>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REVENUE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEFF1" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#90A4AE', fontSize: 13, fontWeight: 500}} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: '#F5F9FF'}}
                    contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                  />
                  <Bar dataKey="amount" radius={[12, 12, 12, 12]} barSize={40}>
                    {REVENUE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 3 ? '#0D47A1' : '#CFD8DC'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-extrabold text-foreground">Upcoming Sessions</h2>
              <Link to="/consultations" className="text-sm font-bold text-primary hover:underline">Full Schedule</Link>
            </div>
            <div className="space-y-4">
              {MOCK_APPOINTMENTS.map((app) => (
                <div key={app.id} className="bg-white p-6 rounded-3xl border border-border flex items-center justify-between hover:shadow-xl transition-all group">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-border shadow-sm">
                      <img src={`https://picsum.photos/seed/${app.id}/200/200`} alt="Patient" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xl text-foreground">{app.patientName}</h4>
                      <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                        <span className="flex items-center gap-1.5 text-primary"><Video className="w-4 h-4" /> {app.type}</span>
                        <span className="w-1 h-1 bg-muted rounded-full"></span>
                        <span className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4" /> Today, {app.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {app.status === 'ongoing' ? (
                      <Link to={`/consultation/${app.id}`} className="px-8 py-3.5 bg-red-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-red-200 animate-pulse flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-white rounded-full"></span> JOIN NOW
                      </Link>
                    ) : (
                      <button className="px-8 py-3.5 bg-background text-foreground border border-border rounded-2xl font-bold text-sm hover:bg-slate-50 transition-colors">
                        PREPARE
                      </button>
                    )}
                    <button className="p-3 text-muted-foreground hover:bg-background rounded-2xl transition-colors">
                      <MoreVertical className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-foreground p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-4">Diagnostic Copilot</h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-10">
                Enhance your practice with AI. Automate ICD-10 coding and get instant analysis on patient-uploaded scans.
              </p>
              <Link to="/ai-analysis" className="w-full py-5 bg-accent text-white rounded-2xl font-bold text-lg hover:bg-accent/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-accent/20">
                Launch Assistant <ArrowUpRight className="w-6 h-6" />
              </Link>
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm">
            <h3 className="font-extrabold text-xl mb-6">Patient Satisfaction</h3>
            <div className="space-y-6">
              {[1, 2].map(i => (
                <div key={i} className="pb-6 border-b border-border last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex text-amber-400">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                    </div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">May 1{i}</span>
                  </div>
                  <p className="text-sm text-foreground italic leading-relaxed">"The platform is incredible. Dr. Petrova's consultation felt very personal and thorough. Five stars!"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
