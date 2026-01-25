
import React from 'react';
import { Users, Search, MoreVertical } from 'lucide-react';

const DoctorPatients: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">My Patients</h1>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search patients..." className="bg-transparent border-none outline-none text-sm w-full" />
        </div>
        <div className="divide-y divide-slate-100">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold">Patient Name {i}</h4>
                  <p className="text-sm text-slate-500 text-xs">Last visit: 3 days ago</p>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorPatients;
