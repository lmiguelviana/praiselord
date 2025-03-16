/**
 * Sidebar.tsx
 * 
 * Componente de navegação lateral da aplicação
 * Responsável por:
 * - Menu de navegação principal
 * - Responsividade (mobile/desktop)
 * - Indicador visual da rota atual
 * - Botão de logout
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Home, Music, Users, User, Settings, StickyNote, LogOut, UserCircle, Calendar, Search, Database, LineChart, Library, Palette } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppConfigSection } from '@/components/ui/hooks/use-app-config';
import { isDeveloper } from '@/lib/dev-auth';

// Tipo para os itens do menu
type SidebarItem = {
  title: string;
  path: string;
  icon: React.ElementType;
  devOnly?: boolean; // Adicionar flag para itens de desenvolvimento
};

// Tipo para o usuário
type UserData = {
  id: string;
  nome: string;
  email: string;
  role?: string;
  ministerioId?: string;
  foto?: string;
};

// Configuração dos itens do menu
const sidebarItems: SidebarItem[] = [
  {
    title: 'Início',
    path: '/dashboard',
    icon: Home,
  },
  {
    title: 'Músicas',
    path: '/musicas',
    icon: Music,
  },
  {
    title: 'Escalas',
    path: '/escalas',
    icon: Calendar,
  },
  {
    title: 'Membros',
    path: '/membros',
    icon: Users,
  },
  {
    title: 'Perfil',
    path: '/perfil',
    icon: User,
  },
  {
    title: 'Notas',
    path: '/notas',
    icon: StickyNote,
  },
  {
    title: 'Dashboard Dev',
    path: '/dev',
    icon: Settings,
    devOnly: true, // Marcar como item de desenvolvimento
  },
  {
    title: 'Configurações',
    path: '/configuracoes',
    icon: Settings,
  },
];

// Componente principal da barra lateral
const Sidebar = () => {
  // Estado para controlar a visibilidade da sidebar em dispositivos móveis
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isDevMode, setIsDevMode] = useState(false); // Estado para modo de desenvolvimento
  const location = useLocation();
  const { handleLogout } = useAuth();

  // Obter configurações personalizadas
  const logoConfig = useAppConfigSection('logos');
  const textsConfig = useAppConfigSection('texts');

  // Carregar dados do usuário do localStorage
  useEffect(() => {
    const userDataStr = localStorage.getItem('user');
    if (userDataStr) {
      try {
        const parsedUserData = JSON.parse(userDataStr);
        
        // Se o usuário tem foto, garantimos que ela seja carregada
        if (parsedUserData) {
          console.log("Foto do usuário na sidebar:", parsedUserData.foto ? "Disponível" : "Não disponível");
          
          // Atualize o estado com os dados do usuário
          setUserData(parsedUserData);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    }
  }, []);

  // Adicionar um listener para atualizar o usuário quando o localStorage mudar
  useEffect(() => {
    // Função para lidar com mudanças no localStorage
    const handleStorageChange = () => {
      const userDataStr = localStorage.getItem('user');
      if (userDataStr) {
        try {
          const parsedUserData = JSON.parse(userDataStr);
          if (parsedUserData) {
            console.log("Atualizando dados do usuário na sidebar após alteração no localStorage");
            setUserData(parsedUserData);
          }
        } catch (error) {
          console.error('Erro ao processar mudanças nos dados do usuário:', error);
        }
      }
    };

    // Adicionar listener para eventos de storage
    window.addEventListener('storage', handleStorageChange);
    
    // Criar um evento personalizado para atualizar a sidebar quando a foto for alterada
    const handleUserUpdate = () => {
      handleStorageChange();
    };
    
    // Registrar para o evento personalizado
    window.addEventListener('userUpdated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  // Determinar se estamos em modo de desenvolvimento (para mostrar itens avançados)
  useEffect(() => {
    const isAuthorizedDev = isDeveloper();
    // Só permitir modo de desenvolvimento se for o usuário autorizado
    if (isAuthorizedDev) {
      setIsDevMode(process.env.NODE_ENV === 'development' || localStorage.getItem('devMode') === 'true');
    } else {
      // Para outros usuários, sempre desativar o modo de desenvolvimento
      setIsDevMode(false);
      localStorage.removeItem('devMode');
    }
  }, [userData]);

  // Função para alternar a visibilidade da sidebar
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fechar a sidebar em telas pequenas ao navegar para uma nova rota
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  // Ajustar estado da sidebar ao redimensionar a janela
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Definir estado inicial com base no tamanho da tela
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Função para obter as iniciais do nome do usuário
  const getUserInitials = () => {
    if (!userData || !userData.nome) return '?';
    
    const nameParts = userData.nome.split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
  };

  // Filtrar itens do menu para mostrar apenas os apropriados 
  // (ocultar itens de desenvolvimento em produção)
  const filteredSidebarItems = sidebarItems.filter(item => 
    !item.devOnly || (isDevMode && isDeveloper())
  );

  // Verificar se o usuário atual é o desenvolvedor autorizado
  const isAuthorizedDeveloper = isDeveloper();

  // Para debugging, vamos adicionar um log para o componente Sidebar
  useEffect(() => {
    console.log("Sidebar renderizada");
  }, []);

  return (
    <>
      {/* Botão do menu mobile */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>

      {/* Overlay para fechar a sidebar em dispositivos móveis */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Barra lateral principal */}
      <aside
        className={`fixed left-0 top-0 z-40 h-full w-64 transform transition-transform duration-300 ease-in-out glass-morphism 
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 border-r`}
      >
        <div className="flex flex-col h-full">
          {/* Cabeçalho do Sidebar */}
          <div className="flex items-center justify-between p-4 border-b">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <img 
                src={logoConfig.mainLogo} 
                alt={textsConfig.appName} 
                className="h-8 w-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
              <span className="text-xl font-semibold">{textsConfig.appName}</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={toggleSidebar}
            >
              <X size={20} />
            </Button>
          </div>

          {/* Menu de navegação */}
          <nav className="flex-1 py-4 px-3 overflow-y-auto">
            <ul className="space-y-1">
              {filteredSidebarItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent hover:text-accent-foreground'
                      } ${item.devOnly ? 'text-blue-500' : ''}`}
                    >
                      <item.icon size={20} />
                      <span>{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          {/* Rodapé com perfil do usuário */}
          <div className="mt-auto p-4 border-t">
            {/* Botão para ativar/desativar modo de desenvolvimento - apenas para desenvolvedor autorizado */}
            {isAuthorizedDeveloper && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground mb-2"
                onClick={() => {
                  const newDevMode = !isDevMode;
                  setIsDevMode(newDevMode);
                  localStorage.setItem('devMode', newDevMode ? 'true' : 'false');
                }}
              >
                <div className={`w-4 h-4 rounded-full ${isDevMode ? 'bg-blue-500' : 'bg-gray-400'} flex items-center justify-center`} />
                <span className="text-xs">
                  {isDevMode ? 'Desativar Modo Desenvolvedor' : 'Ativar Modo Desenvolvedor'}
                </span>
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              onClick={handleLogout}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold overflow-hidden">
                {userData?.foto ? (
                  <img 
                    src={userData.foto} 
                    alt={`Foto de ${userData?.nome}`} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Erro ao carregar imagem do usuário");
                      (e.target as HTMLImageElement).style.display = 'none';
                      // Mostrar iniciais se a imagem falhar
                      const initials = document.createElement('span');
                      initials.textContent = getUserInitials();
                      (e.target as HTMLImageElement).parentNode?.appendChild(initials);
                    }}
                  />
                ) : (
                  getUserInitials()
                )}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">{userData?.nome}</span>
                <span className="text-xs">Sair</span>
              </div>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
