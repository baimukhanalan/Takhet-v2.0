import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

type RevenuePoint = { name: string; amount: number };
type PartnerPoint = { month: string; revenue: number };
type HealthPoint = { time: string; cpu: number };
type AnalyticsPoint = { name: string; amount: number; users: number };

export const DoctorRevenueChart: React.FC<{ data: RevenuePoint[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
      <XAxis dataKey="name" hide />
      <YAxis hide />
      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
      <Bar dataKey="amount" fill="#0D47A1" radius={[8, 8, 8, 8]} barSize={20}>
        {data.map((entry, i) => <Cell key={entry.name} fill={i === data.length - 1 ? '#0D47A1' : '#cbd5e1'} />)}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export const PartnerPerformanceChart: React.FC<{ data: PartnerPoint[] }> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEFF1" />
      <XAxis dataKey="month" axisLine={false} tickLine={false} />
      <YAxis hide />
      <Tooltip cursor={{ fill: '#F5F9FF' }} contentStyle={{ borderRadius: '1.5rem', border: 'none' }} />
      <Bar dataKey="revenue" radius={[10, 10, 0, 0]} fill="#0D47A1" />
    </BarChart>
  </ResponsiveContainer>
);

export const AdminSystemLoadChart: React.FC<{ data: HealthPoint[]; isDark: boolean }> = ({ data, isDark }) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data}>
      <defs>
        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#0D47A1" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#0D47A1" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
      <XAxis dataKey="time" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
      <YAxis hide />
      <Tooltip contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', borderRadius: '1.5rem', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)' }} />
      <Area type="monotone" dataKey="cpu" stroke="#0D47A1" fillOpacity={1} fill="url(#colorCpu)" strokeWidth={4} />
    </AreaChart>
  </ResponsiveContainer>
);

export const AdminRevenueChart: React.FC<{ data: AnalyticsPoint[]; isDark: boolean }> = ({ data, isDark }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
      <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
      <YAxis hide />
      <Tooltip contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', borderRadius: '1rem', border: 'none' }} />
      <Bar dataKey="amount" fill="#0D47A1" radius={[10, 10, 10, 10]} barSize={25} />
    </BarChart>
  </ResponsiveContainer>
);

export const AdminAudienceChart: React.FC<{ data: AnalyticsPoint[]; isDark: boolean }> = ({ data, isDark }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
      <XAxis dataKey="name" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
      <YAxis hide />
      <Tooltip contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#fff', borderRadius: '1rem', border: 'none' }} />
      <Line type="monotone" dataKey="users" stroke="#64B5F6" strokeWidth={4} dot={{ fill: '#64B5F6', r: 6 }} />
    </LineChart>
  </ResponsiveContainer>
);
