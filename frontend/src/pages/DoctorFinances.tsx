import React from 'react';
import { DollarSign, TrendingUp, ArrowDown } from 'lucide-react';

const DoctorFinances: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Financial Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Total Balance</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">$12,450.00</p>
          <div className="mt-4 flex items-center gap-2 text-green-600 font-bold text-sm">
            <TrendingUp className="w-4 h-4" /> +12% this month
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Pending Payouts</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">$840.00</p>
          <button className="mt-4 text-blue-600 font-bold text-sm hover:underline">Withdraw now</button>
        </div>
      </div>
    </div>
  );
};

export default DoctorFinances;
