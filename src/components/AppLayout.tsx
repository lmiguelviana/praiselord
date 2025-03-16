/**
 * AppLayout.tsx
 * 
 * Componente de layout principal da aplicação
 * Responsável por:
 * - Estrutura base da aplicação com sidebar e área de conteúdo
 * - Integração com o sistema de rotas do React Router
 * - Layout responsivo com adaptações para mobile e desktop
 */

import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAppConfigSection } from '@/components/ui/hooks/use-app-config';

// Componente de layout que envolve todas as páginas protegidas
const AppLayout = () => {
  // Obter configurações personalizadas
  const textsConfig = useAppConfigSection('texts');
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 p-6 pt-16 md:pt-6 transition-all duration-300 overflow-x-hidden">
        <Outlet />
      </main>
      
      <footer className="border-t py-4 text-center text-sm text-muted-foreground mt-auto md:ml-64">
        {textsConfig.footerText}
      </footer>
    </div>
  );
};

export default AppLayout;
