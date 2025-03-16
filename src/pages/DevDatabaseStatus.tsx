import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, RefreshCw, AlertCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import LocalDatabaseService from '@/lib/local-database';
import { checkDevAccess } from '@/lib/dev-auth';

interface DatabaseStats {
  usuarios: number;
  ministerios: number;
  musicas: number;
  escalas: number;
  notas: number;
  lastUpdate: string;
  size: string;
}

// Página de status do banco de dados para o modo desenvolvedor
const DevDatabaseStatus = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Carregar estatísticas do banco de dados
  useEffect(() => {
    loadDatabaseStats();
  }, [lastRefresh]);

  // Verificar acesso - apenas para o usuário autorizado
  useEffect(() => {
    checkDevAccess();
  }, []);

  // Função para obter os dados do banco
  const loadDatabaseStats = async () => {
    setLoading(true);
    try {
      // Obter banco de dados completo do localStorage
      const dbStr = localStorage.getItem('praiseapp_database') || '{}';
      const db = JSON.parse(dbStr);
      
      // Calcular tamanho dos dados em KB
      const sizeInBytes = new Blob([dbStr]).size;
      const sizeInKB = Math.round(sizeInBytes / 1024);
      
      // Preparar estatísticas
      setStats({
        usuarios: (db.usuarios || []).length,
        ministerios: (db.ministerios || []).length,
        musicas: (db.musicas || []).length,
        escalas: (db.escalas || []).length,
        notas: (db.notas || []).length,
        lastUpdate: new Date().toLocaleString(),
        size: `${sizeInKB} KB`
      });
      
      toast.success("Estatísticas do banco atualizadas");
    } catch (error) {
      console.error("Erro ao carregar estatísticas do banco:", error);
      toast.error("Erro ao carregar estatísticas do banco");
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar o banco de dados
  const clearDatabase = () => {
    if (confirm("Tem certeza que deseja limpar o banco de dados? Esta ação não pode ser desfeita.")) {
      try {
        localStorage.removeItem('praiseapp_database');
        toast.success("Banco de dados limpo com sucesso");
        setLastRefresh(new Date()); // Forçar atualização
      } catch (error) {
        console.error("Erro ao limpar banco de dados:", error);
        toast.error("Erro ao limpar banco de dados");
      }
    }
  };

  return (
    <div className="container mx-auto p-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Database className="mr-2 h-6 w-6 text-primary" />
            Status do Banco de Dados
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitoramento do banco de dados local em tempo real
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setLastRefresh(new Date())}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button 
            variant="destructive" 
            onClick={clearDatabase}
            disabled={loading}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Limpar Banco
          </Button>
        </div>
      </div>

      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Usuários</CardTitle>
              <CardDescription>Contas de usuário no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.usuarios}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Ministérios</CardTitle>
              <CardDescription>Ministérios cadastrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.ministerios}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Músicas</CardTitle>
              <CardDescription>Total de músicas no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.musicas}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Escalas</CardTitle>
              <CardDescription>Escalas de ministério</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.escalas}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Notas</CardTitle>
              <CardDescription>Notas e anotações de usuários</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.notas}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Tamanho do Banco</CardTitle>
              <CardDescription>Espaço utilizado no localStorage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.size}</div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Detalhes Técnicos</CardTitle>
              <CardDescription>Informações sobre o banco de dados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tipo de Armazenamento</span>
                    <span className="text-sm">localStorage</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Atualizado em</span>
                    <span className="text-sm">{stats.lastUpdate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Status</span>
                    <span className="text-sm flex items-center text-green-500">
                      <Check className="h-4 w-4 mr-1" /> Disponível
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Limite de Armazenamento</span>
                    <span className="text-sm">~5MB (Navegador)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Utilização</span>
                    <span className="text-sm">{Math.round((parseInt(stats.size) / 5120) * 100)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Persistência</span>
                    <span className="text-sm flex items-center text-green-500">
                      <Check className="h-4 w-4 mr-1" /> Ativa
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex justify-center items-center h-40">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando estatísticas...</span>
        </div>
      )}
    </div>
  );
};

export default DevDatabaseStatus; 