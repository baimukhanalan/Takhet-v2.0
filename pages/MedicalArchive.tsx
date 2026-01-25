
import React from 'react';
import { FileText, ArrowUpRight, Search, Filter } from 'lucide-react';
import { MedicalRecord } from '../types';

const MOCK_RECORDS: MedicalRecord[] = [
  { id: '1', title: 'Blood Panel Test', date: '2025-05-10', type: 'Analysis', status: 'Analyzed', summary: 'Normal ranges for most markers.' },
  { id: '2', title: 'Vitamin D Prescription', date: '2025-05-12', type: 'Prescription', status: 'New' },
  { id: '3', title: 'Brain EEG Scan', date: '2025-05-15', type: 'EEG', status: 'Archived' },
  { id: '4', title: 'Cardiology Report', date: '2025-04-20', type: 'Visit', status: 'Archived' },
  { id: '5', title: 'MRI Knee', date: '2025-03-15', type: 'Analysis', status: 'Analyzed' },
];

const MedicalArchive: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Medical Archive</h1>
          <p className="text-slate-500 mt-1">Access all your medical history, reports, and prescriptions.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-sm font-semibold hover:bg-slate-50 transition-all">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center gap-2 text-sm font-semibold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
            Add Record
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search in archive..." 
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
        <div className="divide-y divide-slate-100">
          {MOCK_RECORDS.map((record) => (
            <div key={record.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-all group">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
                  ${record.type === 'Analysis' ? 'bg-orange-50 text-orange-600' : 
                    record.type === 'Prescription' ? 'bg-green-50 text-green-600' : 
                    record.type === 'EEG' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{record.title}</h4>
                  <p className="text-sm text-slate-500">{record.date} • {record.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs font-bold px-2 py-1 rounded-full
                  ${record.status === 'Analyzed' ? 'bg-blue-50 text-blue-600' : 
                    record.status === 'New' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                  {record.status}
                </span>
                <button className="p-2 text-slate-400 group-hover:text-blue-600 transition-colors">
                  <ArrowUpRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MedicalArchive;
