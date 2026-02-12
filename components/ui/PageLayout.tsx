'use client';
import BackButton from './BackButton';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  backLabel?: string;
  backHref?: string;
  showBack?: boolean;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function PageLayout({
  title,
  subtitle,
  backLabel = "Back to Dashboard",
  backHref,
  showBack = true,
  children,
  actions
}: PageLayoutProps) {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {showBack && (
              <BackButton label={backLabel} href={backHref} />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{title}</h1>
              {subtitle && (
                <p className="text-white/60 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
        <div className="animate-fade-in">
          {children}
        </div>
      </div>
    </div>
  );
}
