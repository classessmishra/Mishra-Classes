import React from 'react';

export default function ResponsiveWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 py-4 md:px-8 md:py-6">
      {children}
    </div>
  );
}
