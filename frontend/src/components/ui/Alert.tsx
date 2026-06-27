import React from 'react';

type AlertTone = 'error' | 'info' | 'success';

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  icon?: React.ReactNode;
  tone?: AlertTone;
};

const toneClasses: Record<AlertTone, string> = {
  error: 'border-red-200 bg-red-50 text-red-600',
  info: 'border-blue-100 bg-blue-50 text-primary',
  success: 'border-blue-200 bg-blue-50 text-blue-700',
};

export const Alert: React.FC<AlertProps> = ({ children, className = '', icon, tone = 'info', ...props }) => (
  <div
    role={tone === 'error' ? 'alert' : 'status'}
    className={`flex items-start gap-2 rounded-xl border p-4 text-xs font-bold ${toneClasses[tone]} ${className}`}
    {...props}
  >
    {icon ? <span className="mt-0.5 shrink-0" aria-hidden="true">{icon}</span> : null}
    <span>{children}</span>
  </div>
);
