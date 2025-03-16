/**
 * App.tsx
 * 
 * Componente principal da aplicação PraiseLord
 * Responsável por:
 * - Configuração do React Query para gerenciamento de estado
 * - Configuração do roteamento da aplicação
 * - Definição das rotas públicas e protegidas
 * - Integração dos componentes de UI globais
 * - Gerenciamento de tema (claro/escuro)
 * - Gerenciamento de ministérios
 */

// Importações dos componentes de UI e utilitários
import React, { useEffect } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { MinisterioProvider } from "./contexts/MinisterioContext";
import AppLayout from "./components/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Perfil from "./pages/Perfil";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";
import Membros from './pages/Membros';
import Notas from './pages/Notas';
import Escalas from './pages/Escalas';
import Musicas from './pages/Musicas';
import TestBusca from './components/TestBusca';
import LocalDatabaseService from "./lib/local-database";
import AppInitializer from './components/AppInitializer';
import GoogleAuthProvider from './components/GoogleAuthProvider';
import DevDatabaseStatus from './pages/DevDatabaseStatus';
import DevRepositorioPrincipal from './pages/DevRepositorioPrincipal';
import DevDashboard from './pages/DevDashboard';
import DevManagement from './pages/DevManagement';
import DevPersonalizacao from './pages/DevPersonalizacao';

const queryClient = new QueryClient();

// Configuração do Google OAuth
const GOOGLE_CLIENT_ID = "922535634413-njtjajjjo847grj5943u4oftt99337uo.apps.googleusercontent.com";

function App() {
  // Inicializar o banco de dados local quando o aplicativo é carregado
  useEffect(() => {
    LocalDatabaseService.initializeDatabase();
    console.log("Banco de dados local inicializado");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="praiselord-theme">
        <MinisterioProvider>
          <TooltipProvider>
            <BrowserRouter>
              {/* Inicializador que limpa o banco de dados */}
              <AppInitializer />
              
              <div className="min-h-screen bg-background">
                <Toaster />
                <Sonner />
                <GoogleAuthProvider>
                  <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/home" element={<Index />} />
                    
                    {/* Rotas protegidas com layout de app */}
                    <Route element={<AppLayout />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/musicas" element={<Musicas />} />
                      <Route path="/escalas" element={<Escalas />} />
                      <Route path="/perfil" element={<Perfil />} />
                      <Route path="/configuracoes" element={<Configuracoes />} />
                      <Route path="/membros" element={<Membros />} />
                      <Route path="/notas" element={<Notas />} />
                      <Route path="/teste-busca" element={<TestBusca />} />
                      
                      {/* Rotas para o modo desenvolvedor */}
                      <Route path="/dev" element={<DevDashboard />} />
                      <Route path="/dev/status-banco" element={<DevDatabaseStatus />} />
                      <Route path="/dev/repositorio-principal" element={<DevRepositorioPrincipal />} />
                      <Route path="/dev/gerenciamento" element={<DevManagement />} />
                      <Route path="/dev/configuracao" element={<DevPersonalizacao />} />
                    </Route>
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </GoogleAuthProvider>
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </MinisterioProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
