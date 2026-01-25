
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Search, Send, Image as ImageIcon, Paperclip, MoreVertical, Phone, Video } from 'lucide-react';

const MOCK_CHATS = [
  { id: 'c1', name: 'Dr. Mikhailov', avatar: 'https://i.pravatar.cc/150?u=mikhail', lastMsg: 'Your results look stable.', time: '10:45 AM', unread: 2 },
  { id: 'c2', name: 'Dr. Julia Kim', avatar: 'https://i.pravatar.cc/150?u=julia', lastMsg: 'Don\'t forget to take Vitamin D.', time: 'Yesterday', unread: 0 },
];

const ChatPage: React.FC<{ user: User }> = ({ user }) => {
  const [activeChat, setActiveChat] = useState(MOCK_CHATS[0]);
  const [message, setMessage] = useState('');

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      {/* Chat List */}
      <div className="w-full md:w-80 lg:w-96 bg-white rounded-3xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-extrabold mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input type="text" placeholder="Search chats..." className="w-full pl-10 pr-4 py-2.5 bg-background border-none rounded-xl text-sm outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {MOCK_CHATS.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setActiveChat(chat)}
              className={`p-6 flex items-center gap-4 cursor-pointer transition-all ${activeChat.id === chat.id ? 'bg-secondary/50' : 'hover:bg-slate-50'}`}
            >
              <div className="relative">
                <img src={chat.avatar} className="w-12 h-12 rounded-2xl object-cover" />
                {chat.unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{chat.unread}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold truncate text-foreground">{chat.name}</h4>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">{chat.time}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate font-medium">{chat.lastMsg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-white rounded-3xl border border-border shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <img src={activeChat.avatar} className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <h3 className="font-bold text-lg">{activeChat.name}</h3>
              <p className="text-[10px] text-success font-bold uppercase tracking-widest">Online Now</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 bg-white border border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary/20 transition-all"><Phone className="w-5 h-5" /></button>
            <button className="p-2.5 bg-white border border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary/20 transition-all"><Video className="w-5 h-5" /></button>
            <button className="p-2.5 bg-white border border-border rounded-xl text-muted-foreground hover:bg-slate-100 transition-all"><MoreVertical className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-background/30 scrollbar-hide">
          <div className="flex justify-start">
            <div className="max-w-[70%] bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
              <p className="text-sm leading-relaxed text-foreground">Hello! How are you feeling today after taking the new prescription?</p>
              <span className="text-[10px] text-muted-foreground mt-2 block font-medium">10:45 AM</span>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[70%] bg-primary p-4 rounded-2xl rounded-tr-none shadow-xl shadow-primary/10 text-white">
              <p className="text-sm leading-relaxed">I'm feeling much better, thank you doctor. The energy levels are coming back.</p>
              <span className="text-[10px] text-blue-100 mt-2 block font-medium">10:50 AM</span>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[70%] bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
              <p className="text-sm leading-relaxed text-foreground">That's great to hear. We will review your blood panel tomorrow during our session.</p>
              <span className="text-[10px] text-muted-foreground mt-2 block font-medium">10:55 AM</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-border">
          <div className="flex items-center gap-4 bg-background border border-border rounded-[2rem] p-2 pl-6">
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message..." 
              className="flex-1 bg-transparent border-none outline-none text-sm font-medium" 
            />
            <div className="flex items-center gap-2">
              <button className="p-2 text-muted-foreground hover:text-primary transition-all"><Paperclip className="w-5 h-5" /></button>
              <button className="p-2 text-muted-foreground hover:text-primary transition-all"><ImageIcon className="w-5 h-5" /></button>
              <button className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center hover:bg-blue-800 transition-all shadow-lg shadow-primary/20">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
