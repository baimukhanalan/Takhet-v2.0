
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

const TakhetLogo: React.FC<LogoProps> = ({ className = "w-10 h-10", size }) => {
  return (
    <div className={`${className} flex items-center justify-center`} style={size ? { width: size, height: size } : {}}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <text 
          x="15" 
          y="78" 
          fill="#0D47A1" 
          style={{ 
            fontFamily: "'Times New Roman', serif", 
            fontWeight: 'bold', 
            fontSize: '85px' 
          }}
        >
          T
        </text>
        <text 
          x="62" 
          y="58" 
          fill="#64B5F6" 
          style={{ 
            fontFamily: "Inter, sans-serif", 
            fontWeight: '900', 
            fontSize: '55px' 
          }}
        >
          +
        </text>
      </svg>
    </div>
  );
};

export default TakhetLogo;
