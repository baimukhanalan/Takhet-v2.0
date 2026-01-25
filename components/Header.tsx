
import React from 'react';
import { Bell, Search, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search records, doctors, or results..."
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
        <div className="h-8 w-px bg-slate-200 mx-1"></div>
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">{user.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-blue-100 p-0.5">
            <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
