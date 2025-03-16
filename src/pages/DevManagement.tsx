import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users, Building2, User, Calendar, Clock, Info, Trash2, Mail, Phone, AlertTriangle, UserX, Building } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import LocalDatabaseService from '@/lib/local-database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { checkDevAccess } from '@/lib/dev-auth';

// Interfaces para as entidades
interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  foto?: string;
  funcao?: string;
  dataNascimento?: Date;
  dataCriacao?: string;
  ministerioId?: string;
  ministerios: any[];
}

interface Ministerio {
  id: string;
  nome: string;
  descricao?: string;
  adminId: string;
  dataCriacao: string;
  membros: number;
  pins?: any[];
  membrosDetalhes?: any[];
}

const DevManagement = () => {
  const [activeTab, setActiveTab] = useState('usuarios');
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [ministerios, setMinisterios] = useState<Ministerio[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [filteredMinisterios, setFilteredMinisterios] = useState<Ministerio[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [selectedMinisterio, setSelectedMinisterio] = useState<Ministerio | null>(null);
  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  const [isMinisterioModalOpen, setIsMinisterioModalOpen] = useState(false);
  const [ministerioUsuarios, setMinisterioUsuarios] = useState<Usuario[]>([]);
  
  // Novos estados para modais de confirmação
  const [isConfirmDeleteAllUsersOpen, setIsConfirmDeleteAllUsersOpen] = useState(false);
  const [isConfirmDeleteAllMinisteriosOpen, setIsConfirmDeleteAllMinisteriosOpen] = useState(false);
  const [isConfirmDeleteUsuarioOpen, setIsConfirmDeleteUsuarioOpen] = useState(false);
  const [isConfirmDeleteMinisterioOpen, setIsConfirmDeleteMinisterioOpen] = useState(false);
  const [usuarioParaDeletar, setUsuarioParaDeletar] = useState<Usuario | null>(null);
  const [ministerioParaDeletar, setMinisterioParaDeletar] = useState<Ministerio | null>(null);
  
  const navigate = useNavigate();

  // Verificar acesso - apenas para o usuário autorizado
  useEffect(() => {
    checkDevAccess();
  }, []);

  // Carregar dados
  useEffect(() => {
    carregarDados();
  }, []);

  // Filtrar dados quando o termo de busca mudar
  useEffect(() => {
    filtrarDados();
  }, [searchTerm, usuarios, ministerios]);

  // Carregar dados do banco de dados local
  const carregarDados = () => {
    try {
      const allUsuarios = LocalDatabaseService.findRecords('usuarios', {}) as Usuario[];
      const allMinisterios = LocalDatabaseService.findRecords('ministerios', {}) as Ministerio[];
      
      setUsuarios(allUsuarios);
      setMinisterios(allMinisterios);
      
      setFilteredUsuarios(allUsuarios);
      setFilteredMinisterios(allMinisterios);
      
      console.log('Dados carregados:', { usuarios: allUsuarios.length, ministerios: allMinisterios.length });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do banco local');
    }
  };

  // Filtrar dados com base no termo de busca
  const filtrarDados = () => {
    if (!searchTerm.trim()) {
      setFilteredUsuarios(usuarios);
      setFilteredMinisterios(ministerios);
      return;
    }

    const termLower = searchTerm.toLowerCase();
    
    // Filtrar usuários
    const usuariosFiltrados = usuarios.filter(u => 
      u.nome?.toLowerCase().includes(termLower) || 
      u.email?.toLowerCase().includes(termLower) ||
      u.funcao?.toLowerCase().includes(termLower)
    );
    
    // Filtrar ministérios
    const ministeriosFiltrados = ministerios.filter(m => 
      m.nome?.toLowerCase().includes(termLower) || 
      m.descricao?.toLowerCase().includes(termLower)
    );
    
    setFilteredUsuarios(usuariosFiltrados);
    setFilteredMinisterios(ministeriosFiltrados);
  };

  // Abrir modal de usuário
  const abrirModalUsuario = (usuario: Usuario) => {
    setSelectedUsuario(usuario);
    setIsUsuarioModalOpen(true);
  };

  // Abrir modal de ministério
  const abrirModalMinisterio = (ministerio: Ministerio) => {
    setSelectedMinisterio(ministerio);
    
    // Carregar usuários deste ministério
    const usuariosMinisterio = usuarios.filter(u => 
      u.ministerios?.some(m => m.ministerioId === ministerio.id)
    );
    
    setMinisterioUsuarios(usuariosMinisterio);
    setIsMinisterioModalOpen(true);
  };

  // Formatar data
  const formatarData = (dataStr?: string) => {
    if (!dataStr) return 'N/A';
    
    try {
      const data = new Date(dataStr);
      return format(data, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Obter iniciais do nome
  const obterIniciais = (nome?: string) => {
    if (!nome) return '?';
    
    const partes = nome.split(' ');
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  };

  // Obter nome do administrador do ministério
  const obterNomeAdmin = (adminId: string) => {
    const admin = usuarios.find(u => u.id === adminId);
    return admin?.nome || 'Desconhecido';
  };

  // Funções para excluir usuários e ministérios
  const excluirUsuario = (usuario: Usuario) => {
    if (!usuario) return;
    
    try {
      // Excluir usuário do banco de dados
      const sucesso = LocalDatabaseService.deleteRecord('usuarios', usuario.id);
      
      if (sucesso) {
        toast.success(`Usuário "${usuario.nome}" excluído com sucesso`);
        
        // Atualizar a lista de usuários
        setUsuarios(usuarios.filter(u => u.id !== usuario.id));
        
        // Se o usuário estava selecionado, fechar o modal de detalhes
        if (selectedUsuario?.id === usuario.id) {
          setIsUsuarioModalOpen(false);
        }
        
        // Limpar o usuário para deletar
        setUsuarioParaDeletar(null);
        setIsConfirmDeleteUsuarioOpen(false);
      } else {
        toast.error(`Erro ao excluir usuário "${usuario.nome}"`);
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    }
  };
  
  const excluirMinisterio = (ministerio: Ministerio) => {
    if (!ministerio) return;
    
    try {
      // Excluir ministério do banco de dados
      const sucesso = LocalDatabaseService.deleteRecord('ministerios', ministerio.id);
      
      if (sucesso) {
        toast.success(`Ministério "${ministerio.nome}" excluído com sucesso`);
        
        // Atualizar a lista de ministérios
        setMinisterios(ministerios.filter(m => m.id !== ministerio.id));
        
        // Atualizar os usuários que participavam deste ministério
        const usuariosAtualizados = usuarios.map(usuario => {
          // Remover referência ao ministério excluído
          const ministeriosAtualizados = usuario.ministerios.filter(m => m.ministerioId !== ministerio.id);
          
          // Atualizar ministerioId se necessário
          let ministerioId = usuario.ministerioId;
          if (ministerioId === ministerio.id) {
            ministerioId = ministeriosAtualizados.length > 0 ? ministeriosAtualizados[0].ministerioId : '';
          }
          
          const usuarioAtualizado = {
            ...usuario,
            ministerios: ministeriosAtualizados,
            ministerioId
          };
          
          // Atualizar no banco de dados
          LocalDatabaseService.updateRecord('usuarios', usuario.id, usuarioAtualizado);
          
          return usuarioAtualizado;
        });
        
        setUsuarios(usuariosAtualizados);
        
        // Se o ministério estava selecionado, fechar o modal de detalhes
        if (selectedMinisterio?.id === ministerio.id) {
          setIsMinisterioModalOpen(false);
        }
        
        // Limpar o ministério para deletar
        setMinisterioParaDeletar(null);
        setIsConfirmDeleteMinisterioOpen(false);
      } else {
        toast.error(`Erro ao excluir ministério "${ministerio.nome}"`);
      }
    } catch (error) {
      console.error('Erro ao excluir ministério:', error);
      toast.error('Erro ao excluir ministério');
    }
  };
  
  const excluirTodosUsuarios = () => {
    try {
      // Preservar apenas o usuário lmiguelviana@hotmail.com
      const usuarioAdmin = usuarios.find(u => u.email === 'lmiguelviana@hotmail.com');
      
      if (!usuarioAdmin) {
        toast.error('Usuário administrador não encontrado');
        return;
      }
      
      // Excluir todos os outros usuários
      const idsParaExcluir = usuarios
        .filter(u => u.email !== 'lmiguelviana@hotmail.com')
        .map(u => u.id);
      
      let sucessos = 0;
      let falhas = 0;
      
      idsParaExcluir.forEach(id => {
        const sucesso = LocalDatabaseService.deleteRecord('usuarios', id);
        sucesso ? sucessos++ : falhas++;
      });
      
      toast.success(`${sucessos} usuários excluídos com sucesso`);
      
      if (falhas > 0) {
        toast.error(`Falha ao excluir ${falhas} usuários`);
      }
      
      // Atualizar a lista de usuários - manter apenas o admin
      setUsuarios([usuarioAdmin]);
      
      // Fechar o modal de confirmação
      setIsConfirmDeleteAllUsersOpen(false);
    } catch (error) {
      console.error('Erro ao excluir todos os usuários:', error);
      toast.error('Erro ao excluir todos os usuários');
    }
  };
  
  const excluirTodosMinisterios = () => {
    try {
      // Excluir todos os ministérios
      const idsMinisterios = ministerios.map(m => m.id);
      
      let sucessos = 0;
      let falhas = 0;
      
      idsMinisterios.forEach(id => {
        const sucesso = LocalDatabaseService.deleteRecord('ministerios', id);
        sucesso ? sucessos++ : falhas++;
      });
      
      toast.success(`${sucessos} ministérios excluídos com sucesso`);
      
      if (falhas > 0) {
        toast.error(`Falha ao excluir ${falhas} ministérios`);
      }
      
      // Atualizar a lista de ministérios
      setMinisterios([]);
      
      // Atualizar os usuários - remover referências aos ministérios
      const usuariosAtualizados = usuarios.map(usuario => {
        const usuarioAtualizado = {
          ...usuario,
          ministerios: [],
          ministerioId: ''
        };
        
        // Atualizar no banco de dados
        LocalDatabaseService.updateRecord('usuarios', usuario.id, usuarioAtualizado);
        
        return usuarioAtualizado;
      });
      
      setUsuarios(usuariosAtualizados);
      
      // Fechar o modal de confirmação
      setIsConfirmDeleteAllMinisteriosOpen(false);
    } catch (error) {
      console.error('Erro ao excluir todos os ministérios:', error);
      toast.error('Erro ao excluir todos os ministérios');
    }
  };

  return (
    <div className="container mx-auto p-6 animate-fade-up">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Users className="mr-2 h-6 w-6 text-primary" />
          Gerenciamento de Sistema
        </h1>
        <p className="text-muted-foreground mt-1">
          Visualize e gerencie usuários e ministérios do sistema
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou ministério..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Botões de ações em massa */}
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setIsConfirmDeleteAllUsersOpen(true)}
            className="flex-1 md:flex-none"
          >
            <UserX className="mr-1 h-4 w-4" />
            Excluir Todos os Usuários
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setIsConfirmDeleteAllMinisteriosOpen(true)}
            className="flex-1 md:flex-none"
          >
            <Building className="mr-1 h-4 w-4" />
            Excluir Todos os Ministérios
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="usuarios" className="flex gap-2">
            <User className="h-4 w-4" />
            Usuários ({filteredUsuarios.length})
          </TabsTrigger>
          <TabsTrigger value="ministerios" className="flex gap-2">
            <Building2 className="h-4 w-4" />
            Ministérios ({filteredMinisterios.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          {filteredUsuarios.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border rounded-md">
              Nenhum usuário encontrado com os critérios da busca
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsuarios.map(usuario => (
                <Card key={usuario.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <Avatar className="h-10 w-10">
                        {usuario.foto ? (
                          <AvatarImage src={usuario.foto} alt={usuario.nome} />
                        ) : (
                          <AvatarFallback>{obterIniciais(usuario.nome)}</AvatarFallback>
                        )}
                      </Avatar>
                      {usuario.email === 'lmiguelviana@hotmail.com' && (
                        <Badge variant="default">Admin</Badge>
                      )}
                    </div>
                    <CardTitle className="text-base mt-2">{usuario.nome}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {usuario.email}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 text-sm">
                    <div className="flex flex-col gap-1">
                      <span>Função: {usuario.funcao || 'Não definida'}</span>
                      <span>Ministérios: {usuario.ministerios?.length || 0}</span>
                      <span>Criado em: {formatarData(usuario.dataCriacao).split(' ')[0]}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-accent/50 pt-2 flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => abrirModalUsuario(usuario)}
                    >
                      Ver Detalhes
                    </Button>
                    
                    {usuario.email !== 'lmiguelviana@hotmail.com' && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          setUsuarioParaDeletar(usuario);
                          setIsConfirmDeleteUsuarioOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ministerios">
          {filteredMinisterios.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground border rounded-md">
              Nenhum ministério encontrado com os critérios da busca
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMinisterios.map(ministerio => (
                <Card key={ministerio.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{ministerio.nome}</CardTitle>
                    <CardDescription>
                      {ministerio.descricao || 'Sem descrição'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 text-sm">
                    <div className="flex flex-col gap-1">
                      <span>Admin: {obterNomeAdmin(ministerio.adminId)}</span>
                      <span>Membros: {ministerio.membros || 0}</span>
                      <span>Criado em: {formatarData(ministerio.dataCriacao).split(' ')[0]}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-accent/50 pt-2 flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => abrirModalMinisterio(ministerio)}
                    >
                      Ver Detalhes
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        setMinisterioParaDeletar(ministerio);
                        setIsConfirmDeleteMinisterioOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de confirmação para excluir todos os usuários */}
      <Dialog open={isConfirmDeleteAllUsersOpen} onOpenChange={setIsConfirmDeleteAllUsersOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Todos os Usuários
            </DialogTitle>
            <DialogDescription>
              Esta ação irá excluir todos os usuários do sistema, exceto o administrador principal (lmiguelviana@hotmail.com). Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20 text-sm">
            <p><strong>Atenção:</strong> Todos os dados dos usuários serão perdidos permanentemente.</p>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDeleteAllUsersOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={excluirTodosUsuarios}
            >
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação para excluir todos os ministérios */}
      <Dialog open={isConfirmDeleteAllMinisteriosOpen} onOpenChange={setIsConfirmDeleteAllMinisteriosOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Todos os Ministérios
            </DialogTitle>
            <DialogDescription>
              Esta ação irá excluir todos os ministérios do sistema e remover as associações dos usuários. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20 text-sm">
            <p><strong>Atenção:</strong> Todos os ministérios e suas informações serão perdidos permanentemente.</p>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDeleteAllMinisteriosOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={excluirTodosMinisterios}
            >
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação para excluir um usuário */}
      <Dialog open={isConfirmDeleteUsuarioOpen} onOpenChange={setIsConfirmDeleteUsuarioOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Usuário
            </DialogTitle>
            <DialogDescription>
              Você está prestes a excluir o usuário "{usuarioParaDeletar?.nome}". Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20 text-sm">
            <p><strong>Atenção:</strong> Todos os dados deste usuário serão perdidos permanentemente.</p>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDeleteUsuarioOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => excluirUsuario(usuarioParaDeletar!)}
            >
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação para excluir um ministério */}
      <Dialog open={isConfirmDeleteMinisterioOpen} onOpenChange={setIsConfirmDeleteMinisterioOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Ministério
            </DialogTitle>
            <DialogDescription>
              Você está prestes a excluir o ministério "{ministerioParaDeletar?.nome}". Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20 text-sm">
            <p><strong>Atenção:</strong> Todos os dados deste ministério serão perdidos permanentemente, incluindo associações com usuários.</p>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDeleteMinisterioOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => excluirMinisterio(ministerioParaDeletar!)}
            >
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de detalhes do usuário */}
      {selectedUsuario && (
        <Dialog open={isUsuarioModalOpen} onOpenChange={setIsUsuarioModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Detalhes do Usuário
              </DialogTitle>
              <DialogDescription>
                Informações completas sobre o usuário
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24">
                  {selectedUsuario.foto ? (
                    <AvatarImage src={selectedUsuario.foto} alt={selectedUsuario.nome} />
                  ) : (
                    <AvatarFallback className="text-2xl">{obterIniciais(selectedUsuario.nome)}</AvatarFallback>
                  )}
                </Avatar>
                <h3 className="font-semibold mt-3">{selectedUsuario.nome}</h3>
                <p className="text-sm text-muted-foreground">{selectedUsuario.email}</p>
                {selectedUsuario.telefone && (
                  <p className="text-sm flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" />
                    {selectedUsuario.telefone}
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Informações Gerais</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">ID: </span>
                      <span className="font-mono">{selectedUsuario.id}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Data de Criação: </span>
                      <span>{formatarData(selectedUsuario.dataCriacao)}</span>
                    </div>
                    {selectedUsuario.dataNascimento && (
                      <div>
                        <span className="text-muted-foreground">Data de Nascimento: </span>
                        <span>{format(new Date(selectedUsuario.dataNascimento), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Função: </span>
                      <span>{selectedUsuario.funcao || 'Não definida'}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold mb-2">Ministérios ({selectedUsuario.ministerios?.length || 0})</h4>
                  {selectedUsuario.ministerios?.length > 0 ? (
                    <ScrollArea className="h-40">
                      <div className="space-y-2">
                        {selectedUsuario.ministerios.map((m, i) => {
                          const ministerio = ministerios.find(min => min.id === m.ministerioId);
                          return (
                            <div key={i} className="flex justify-between items-center p-2 border rounded-md">
                              <div>
                                <div className="font-semibold">{ministerio?.nome || 'Ministério desconhecido'}</div>
                                <div className="text-xs text-muted-foreground">
                                  Cargo: {m.role === 'admin' ? 'Administrador' : 'Membro'}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (ministerio) {
                                    setIsUsuarioModalOpen(false);
                                    setTimeout(() => abrirModalMinisterio(ministerio), 100);
                                  }
                                }}
                              >
                                Ver
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      Usuário não participa de nenhum ministério
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de detalhes do ministério */}
      {selectedMinisterio && (
        <Dialog open={isMinisterioModalOpen} onOpenChange={setIsMinisterioModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Detalhes do Ministério
              </DialogTitle>
              <DialogDescription>
                Informações completas sobre o ministério
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{selectedMinisterio.nome}</h3>
                <p className="text-sm text-muted-foreground">{selectedMinisterio.descricao || 'Sem descrição'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">ID do Ministério</div>
                  <div className="font-mono">{selectedMinisterio.id}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Data de Criação</div>
                  <div>{formatarData(selectedMinisterio.dataCriacao)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Administrador</div>
                  <div>{obterNomeAdmin(selectedMinisterio.adminId)}</div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Membros ({ministerioUsuarios.length})
                </h4>

                {ministerioUsuarios.length > 0 ? (
                  <ScrollArea className="h-60">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ministerioUsuarios.map(usuario => {
                        const relacao = usuario.ministerios?.find(m => m.ministerioId === selectedMinisterio.id);
                        return (
                          <Card key={usuario.id} className="overflow-hidden">
                            <CardHeader className="py-3">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  {usuario.foto ? (
                                    <AvatarImage src={usuario.foto} alt={usuario.nome} />
                                  ) : (
                                    <AvatarFallback>{obterIniciais(usuario.nome)}</AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <div className="font-semibold">{usuario.nome}</div>
                                  <div className="text-xs text-muted-foreground">{usuario.email}</div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardFooter className="py-2 bg-accent/50 justify-between">
                              <Badge variant={relacao?.role === 'admin' ? 'default' : 'outline'}>
                                {relacao?.role === 'admin' ? 'Administrador' : 'Membro'}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsMinisterioModalOpen(false);
                                  setTimeout(() => abrirModalUsuario(usuario), 100);
                                }}
                              >
                                Ver Detalhes
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="p-6 text-center text-muted-foreground border rounded-md">
                    Nenhum membro encontrado para este ministério
                  </div>
                )}
              </div>

              {selectedMinisterio.pins && selectedMinisterio.pins.length > 0 && (
                <>
                  <Separator />
                  
                  <div>
                    <h4 className="text-sm font-semibold mb-3">
                      PINs de Convite ({selectedMinisterio.pins.length})
                    </h4>
                    
                    <ScrollArea className="h-40">
                      <div className="space-y-2">
                        {selectedMinisterio.pins.map((pin, i) => (
                          <div key={i} className="flex justify-between items-center p-2 border rounded-md">
                            <div className="font-mono">{pin.codigo}</div>
                            <div className="text-xs">
                              <div>Criado: {formatarData(pin.dataCriacao)}</div>
                              <div>Expira: {formatarData(pin.dataExpiracao)}</div>
                            </div>
                            <Badge variant={pin.usado ? 'outline' : 'default'}>
                              {pin.usado ? 'Usado' : 'Ativo'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DevManagement; 