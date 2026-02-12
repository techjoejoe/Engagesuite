'use client';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
  label?: string;
  href?: string;
  className?: string;
}

export default function BackButton({ 
  label = "Back to Dashboard", 
  href,
  className = ""
}: BackButtonProps) {
  const router = useRouter();
  
  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 hover:border-white/20 transition-all duration-200 ${className}`}
    >
      <span>←</span>
      {label}
    </button>
  );
}
