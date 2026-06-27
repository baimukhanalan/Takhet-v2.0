import React, { forwardRef } from 'react';

type TextFieldTone = 'light' | 'dark';

export type TextFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  leading?: React.ReactNode;
  leadingClassName?: string;
  trailing?: React.ReactNode;
  trailingClassName?: string;
  tone?: TextFieldTone;
  inputClassName?: string;
  wrapperClassName?: string;
};

const toneClasses: Record<TextFieldTone, string> = {
  light: 'bg-slate-50 border-2 border-slate-100 text-foreground focus:border-primary focus:bg-white',
  dark: 'bg-slate-900/50 border border-white/10 text-white focus:border-primary focus:ring-4 focus:ring-primary/10',
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    className = '',
    inputClassName = '',
    leading,
    leadingClassName = 'left-4',
    trailing,
    trailingClassName = 'right-4',
    tone = 'light',
    wrapperClassName = '',
    ...props
  },
  ref
) {
  return (
    <div className={`group relative ${wrapperClassName} ${className}`}>
      {leading ? (
        <span className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary ${leadingClassName}`} aria-hidden="true">
          {leading}
        </span>
      ) : null}
      <input
        ref={ref}
        className={`w-full rounded-2xl py-4 font-bold outline-none transition-colors placeholder:text-slate-400 ${leading ? 'pl-12' : 'pl-4'} ${trailing ? 'pr-12' : 'pr-4'} ${toneClasses[tone]} ${inputClassName}`}
        {...props}
      />
      {trailing ? <span className={`absolute top-1/2 z-10 -translate-y-1/2 ${trailingClassName}`}>{trailing}</span> : null}
    </div>
  );
});
