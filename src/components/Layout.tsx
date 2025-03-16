import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto py-4 px-4 md:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout; 