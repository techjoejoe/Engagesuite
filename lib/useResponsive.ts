'use client';

import { useState, useEffect } from 'react';

interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmartboard: boolean;
  width: number;
  height: number;
}

/**
 * Hook to detect current breakpoint and screen dimensions
 * Updates in real-time as window resizes
 * 
 * Breakpoint ranges:
 * - Mobile: < 768px
 * - Tablet: 768px - 1023px
 * - Desktop: 1024px - 1919px  
 * - Smartboard: >= 1920px
 */
export function useResponsive(): BreakpointState {
  const [breakpoint, setBreakpoint] = useState<BreakpointState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isSmartboard: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setBreakpoint({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024 && width < 1920,
        isSmartboard: width >= 1920,
        width,
        height,
      });
    };

    // Initial check
    updateBreakpoint();

    // Debounced resize handler for performance
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateBreakpoint, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return breakpoint;
}

/**
 * Get responsive class names based on current breakpoint
 * Usage: const classes = getResponsiveClasses({ mobile: 'text-sm', desktop: 'text-lg' });
 */
export function getResponsiveClasses(config: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  smartboard?: string;
  default?: string;
}): string {
  const { isMobile, isTablet, isDesktop, isSmartboard } = useResponsive();

  if (isSmartboard && config.smartboard) return config.smartboard;
  if (isDesktop && config.desktop) return config.desktop;
  if (isTablet && config.tablet) return config.tablet;
  if (isMobile && config.mobile) return config.mobile;
  return config.default || '';
}
