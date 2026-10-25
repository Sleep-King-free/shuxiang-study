'use client';

import type { ReactNode } from 'react';

export default function CineOpenButton({
  className = 'btn light',
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      className={className}
      type="button"
      onClick={() => window.dispatchEvent(new Event('cine:open'))}
    >
      {children}
    </button>
  );
}
