'use client';
import React, { useRef, useEffect, useState } from 'react';

interface SplitTextProps {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  delay?: number;
  splitBy?: 'words' | 'lines';
}

export default function SplitText({ children, className = '', as: Tag = 'h1', delay = 0, splitBy = 'words' }: SplitTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(el); }
    }, { threshold: 0.2 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const parts = splitBy === 'lines' ? children.split('\n') : children.split(' ');

  return (
    <div ref={ref} className="overflow-hidden">
      <Tag className={className}>
        {parts.map((part, i) => (
          <span key={i} className="inline-block overflow-hidden">
            <span
              className="inline-block"
              style={{
                transform: isVisible ? 'translateY(0)' : 'translateY(110%)',
                transition: `transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay + i * 0.06}s`,
              }}
            >
              {part}{splitBy === 'words' && i < parts.length - 1 ? '\u00A0' : ''}
            </span>
          </span>
        ))}
      </Tag>
    </div>
  );
}
