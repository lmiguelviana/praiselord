
import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <main className="pt-16"> {/* Added padding to account for fixed navbar */}
        <Hero />
        <Features />
      </main>
    </div>
  );
};

export default Index;
