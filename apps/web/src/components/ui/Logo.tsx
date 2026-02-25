import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto',
  };

  return (
    <div className={`flex items-center ${className}`}>
      <svg
        className={`${sizeClasses[size]} text-primary`}
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
        <path
          fill="white"
          d="M9 12l2 2 4-4"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`ml-2 font-bold text-gray-900 ${size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl'}`}>
        Marketplace
      </span>
    </div>
  );
}