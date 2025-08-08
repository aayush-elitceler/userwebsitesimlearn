'use client';

import { usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { useState, useEffect } from 'react';

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add error boundary for any failed requests
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Layout error:', event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const hideSidebar =
    pathname === '/login' ||
    pathname === '/login/otp' ||
    pathname === '/register' ||
    pathname === '/forgot-password' 

  if (!isClient) {
    return null; // Prevent hydration mismatch
  }

  // If there's an error, still render the content without the sidebar
  if (hasError) {
    return (
      <div className='flex w-full min-h-screen'>
        <main className='flex-1'>{children}</main>
      </div>
    );
  }

  return (
    <div className='flex w-full min-h-screen'>
      {!hideSidebar && (
        <AppSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      )}
      <main
        className={`flex-1 transition-all duration-300 ${
          !hideSidebar ? (collapsed ? 'lg:ml-16' : 'lg:ml-64') : ''
        }`}
      >
        {children}
      </main>
    </div>
  );
}