import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Edit, 
  Trash2,
  UserPlus,
  Users,
  Music,
  Calendar,
  Users2,
  Mail,
  Phone,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import GerarPinModal from '@/components/GerarPinModal';
import { useMinisterio } from '@/hooks/useMinisterio';
import { useUsuario } from '@/hooks/useUsuario';
import { Usuario } from '@/types/usuario';

const Membros = () => {
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [membroSelecionado, setMembroSelecionado] = useState<Usuario | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [membros, setMembros] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { ministerioAtual, obterMembrosMinisterio, removerMembroMinisterio, promoverMembroAdmin } = useMinisterio();
  const { usuario } = useUsuario();

  // Carregar membros do ministério atual
  useEffect(() => {
    if (ministerioAtual) {
      carregarMembros();
    }
  }, [ministerioAtual]);

  const carregarMembros = async () => {
    if (!ministerioAtual) return;
    
    setLoading(true);
    try {
      const membrosMinisterio = await obterMembrosMinisterio(ministerioAtual.id);
      setMembros(membrosMinisterio);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      toast.error('Erro ao carregar membros do ministério');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se o usuário atual é administrador do ministério
  const isAdmin = usuario?.ministerios.find(
    m => m.ministerioId === ministerioAtual?.id
  )?.role === 'admin';

  // Filtrar membros com base na pesquisa
  const membrosFiltrados = membros.filter(membro => 
    membro.nome.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    membro.email.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    (membro.funcao && membro.funcao.toLowerCase().includes(termoPesquisa.toLowerCase()))
  );

  const handleEditarMembro = (membro: Usuario) => {
    setMembroSelecionado(membro);
    setIsModalOpen(true);
  };

  const handleExcluirMembro = async (id: string) => {
    if (!ministerioAtual) return;
    
    if (window.confirm('Tem certeza que deseja remover este membro do ministério?')) {
      try {
        const sucesso = await removerMembroMinisterio(ministerioAtual.id, id);
        if (sucesso) {
          toast.success('Membro removido com sucesso!');
          // Atualizar a lista de membros
          carregarMembros();
        } else {
          toast.error('Erro ao remover membro. Tente novamente.');
        }
      } catch (error) {
        console.error('Erro ao remover membro:', error);
        toast.error('Erro ao remover membro. Tente novamente.');
      }
    }
  };

  const handlePromoverAdmin = async (id: string) => {
    if (!ministerioAtual) return;
    
    if (window.confirm('Tem certeza que deseja promover este membro a administrador do ministério?')) {
      try {
        const sucesso = await promoverMembroAdmin(ministerioAtual.id, id);
        if (sucesso) {
          toast.success('Membro promovido a administrador com sucesso!');
          // Atualizar a lista de membros
          carregarMembros();
          setIsModalOpen(false);
        } else {
          toast.error('Erro ao promover membro. Tente novamente.');
        }
      } catch (error) {
        console.error('Erro ao promover membro:', error);
        toast.error('Erro ao promover membro. Tente novamente.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membros</h1>
          <p className="text-muted-foreground">
            {ministerioAtual 
              ? `Gerencie os membros do ministério ${ministerioAtual.nome}` 
              : 'Selecione um ministério para gerenciar seus membros'}
          </p>
        </div>
        <div className="flex gap-2">
          {ministerioAtual && isAdmin && (
            <Button 
              className="gap-2" 
              onClick={() => setIsPinModalOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Adicionar Membro
            </Button>
          )}
        </div>
      </div>

      {/* Mensagem para usuários não administradores */}
      {ministerioAtual && !isAdmin && (
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>Apenas o administrador do ministério pode adicionar membros</span>
        </div>
      )}

      {/* Seção de Pesquisa */}
      <Card>
        <CardHeader>
          <CardTitle>Pesquisar Membros</CardTitle>
          <CardDescription>
            Encontre membros por nome, email ou função
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar membro..."
                className="pl-10"
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Membros */}
      <Card>
        <CardHeader>
          <CardTitle>Membros do Ministério</CardTitle>
          <CardDescription>
            {loading 
              ? 'Carregando membros...' 
              : `${membrosFiltrados.length} membros encontrados`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!ministerioAtual ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhum ministério selecionado</h3>
              <p className="text-muted-foreground mt-2">
                Selecione um ministério na página de perfil para gerenciar seus membros.
              </p>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando membros...</p>
            </div>
          ) : membrosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhum membro encontrado</h3>
              <p className="text-muted-foreground mt-2">
                {termoPesquisa 
                  ? 'Tente uma pesquisa diferente' 
                  : 'Adicione membros ao seu ministério usando o botão "Adicionar Membro"'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {membrosFiltrados.map((membro) => {
                // Verificar se o membro é administrador deste ministério
                const membroIsAdmin = membro.ministerios.find(
                  m => m.ministerioId === ministerioAtual.id
                )?.role === 'admin';
                
                return (
                  <div key={membro.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{membro.nome}</h4>
                        {membroIsAdmin && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
                            Administrador
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{membro.email}</span>
                        </div>
                        {membro.telefone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{membro.telefone}</span>
                          </div>
                        )}
                      </div>
                      {membro.funcao && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Função:</span> {membro.funcao}
                        </p>
                      )}
                    </div>
                    {isAdmin && membro.id !== usuario?.id && (
                      <div className="flex gap-2 mt-3 md:mt-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditarMembro(membro)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleExcluirMembro(membro.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição de Membro */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {membroSelecionado && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold overflow-hidden">
                    {membroSelecionado.foto ? (
                      <img 
                        src={membroSelecionado.foto} 
                        alt={`Foto de ${membroSelecionado.nome}`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      membroSelecionado.nome.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">{membroSelecionado.nome}</h3>
                    <p className="text-sm text-muted-foreground">{membroSelecionado.email}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Permissões</h4>
                  
                  {/* Verificar se o membro já é administrador */}
                  {membroSelecionado.ministerios.find(
                    m => m.ministerioId === ministerioAtual?.id
                  )?.role === 'admin' ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                        Administrador
                      </span>
                      <span>Este membro já é administrador do ministério.</span>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handlePromoverAdmin(membroSelecionado.id)}
                      className="w-full"
                    >
                      Promover a Administrador
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Geração de PIN */}
      <GerarPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        ministerio={ministerioAtual?.nome || ''}
        ministerioId={ministerioAtual?.id || ''}
      />
    </div>
  );
};

export default Membros; 