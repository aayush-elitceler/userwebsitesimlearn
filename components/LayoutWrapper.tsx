"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { useState, useEffect } from "react";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hideSidebar = pathname === "/login" || pathname === '/login/otp' || pathname === '/register';

  if (!isClient) {
    return null; // Prevent hydration mismatch
  }

  return (
    <div className="flex w-full min-h-screen">
      {!hideSidebar && <AppSidebar collapsed={collapsed} setCollapsed={setCollapsed} />}
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