import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

const legalLinks = [
  { label: 'Offer / Terms', to: '/offer' },
  { label: 'Terms', to: '/terms' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Refund Policy', to: '/refund' },
  { label: 'Contacts', to: '/contacts' }
];

const paymentMethods = ['Visa', 'Mastercard', 'Halyk QR'];

const ComplianceFooter: React.FC = () => (
  <footer className="border-t border-slate-100 bg-white px-6 py-16 text-center">
    <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_1fr_1fr] lg:text-left">
      <div className="space-y-5">
        <Link to="/" className="inline-flex text-4xl font-black tracking-tighter text-foreground">
          Takhet<span className="text-primary">+</span>
        </Link>
        <div className="space-y-2 text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
          <p>ИП "Алам"</p>
          <p>БИН: 850707401371</p>
          <p>ADDRESS</p>
        </div>
        <p className="max-w-xl text-sm font-semibold leading-6 text-slate-500">
          Takhet+ предоставляет цифровые медицинские инструменты, онлайн-консультации, запись к специалистам и поддержку работы с медицинской информацией. Сервис не заменяет очный осмотр и решения лицензированных медицинских специалистов.
        </p>
      </div>

      <div className="space-y-5">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Legal</p>
        <nav className="grid gap-3">
          {legalLinks.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm font-black text-slate-700 transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="space-y-5">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400">Payments & support</p>
        <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
          {paymentMethods.map((method) => (
            <span key={method} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
              {method}
            </span>
          ))}
        </div>
        <div className="space-y-2 text-sm font-bold text-slate-500">
          <p>takhetplus@gmail.com</p>
          <p>+7 (778) 532 4978</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/5 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary">
          <ShieldCheck className="h-4 w-4" />
          Secure payment information
        </div>
      </div>
    </div>
    <p className="mt-12 text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">
      © 2026 Takhet+. Все права защищены.
    </p>
  </footer>
);

export default ComplianceFooter;
