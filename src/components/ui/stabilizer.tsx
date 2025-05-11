import React, { useRef, useEffect } from 'react';

interface StabilizerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Stabilizer component that prevents content flickering
 * by applying GPU acceleration and debouncing DOM updates
 */
export function Stabilizer({ children, className = '' }: StabilizerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Apply hardware acceleration to prevent blinking
    if (contentRef.current) {
      contentRef.current.style.transform = 'translateZ(0)';
      contentRef.current.style.backfaceVisibility = 'hidden';
      contentRef.current.style.willChange = 'contents';
    }

    // Clean up timeout if component unmounts
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={contentRef}
      className={`stabilizer ${className}`}
      style={{
        // Apply anti-flicker styles
        willChange: 'contents',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        // Add smooth transitions
        transition: 'background-color 0.2s ease, color 0.2s ease, opacity 0.2s ease',
        // Stop blinking caused by layout reflows
        isolation: 'isolate',
        contain: 'content'
      }}
    >
      {children}
    </div>
  );
} 