import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Library, BarChart2, ChevronRight, Info, Users, Settings, Search, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { checkDevAccess } from '@/lib/dev-auth';

// Página principal do modo desenvolvedor
const DevDashboard = () => {
  const navigate = useNavigate();

  // Verificar acesso - apenas para o usuário autorizado
  useEffect(() => {
    checkDevAccess();
  }, []);

  // Array de ferramentas disponíveis
  const devTools = [
    {
      title: 'Status do Banco de Dados',
      description: 'Visualizar estatísticas e gerenciar o banco de dados local',
      icon: <Database className="h-8 w-8 text-primary" />,
      route: '/dev/status-banco'
    },
    {
      title: 'Repositório Principal',
      description: 'Gerenciar músicas no repositório comum do PraiseLord',
      icon: <Library className="h-8 w-8 text-primary" />,
      route: '/dev/repositorio-principal'
    },
    {
      title: 'Gerenciamento de Usuários',
      description: 'Visualizar e gerenciar usuários e ministérios do sistema',
      icon: <Users className="h-8 w-8 text-primary" />,
      route: '/dev/gerenciamento'
    },
    {
      title: 'Personalização',
      description: 'Personalizar logos, descrições e estilos do aplicativo',
      icon: <Settings className="h-8 w-8 text-primary" />,
      route: '/dev/configuracao'
    },
    {
      title: 'Teste de Busca',
      description: 'Página para testar funcionalidades de busca do sistema',
      icon: <Search className="h-8 w-8 text-primary" />,
      route: '/teste-busca'
    },
    {
      title: 'Estatísticas de Uso',
      description: 'Visualizar estatísticas de uso e performance do sistema',
      icon: <BarChart2 className="h-8 w-8 text-primary" />,
      route: '/dev/estatisticas',
      disabled: true
    }
  ];

  return (
    <div className="container mx-auto p-6 animate-fade-up">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Modo Desenvolvedor
        </h1>
        <p className="text-muted-foreground mt-1">
          Ferramentas administrativas e de desenvolvimento para o PraiseLord
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {devTools.map((tool, index) => (
          <Card key={index} className={tool.disabled ? 'opacity-60' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                {tool.icon}
                {tool.disabled && (
                  <span className="text-xs bg-muted px-2 py-1 rounded-md">Em breve</span>
                )}
              </div>
              <CardTitle className="text-lg mt-2">{tool.title}</CardTitle>
              <CardDescription>{tool.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="ghost" 
                className="w-full justify-between"
                onClick={() => navigate(tool.route)}
                disabled={tool.disabled}
              >
                Acessar
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed border-muted">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Info className="h-4 w-4 mr-2 text-primary" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Versão:</span>
                <span>1.0.0-beta</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Ambiente:</span>
                <span>Desenvolvimento</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Armazenamento:</span>
                <span>localStorage</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Estado:</span>
                <span className="text-green-500">Operacional</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Build:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Modo:</span>
                <span>Admin</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevDashboard; 