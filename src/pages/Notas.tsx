/**
 * Notas.tsx
 * 
 * Página de gerenciamento de notas do ministério
 * Responsável por:
 * - Listagem de notas
 * - Criação de novas notas
 * - Edição de notas existentes
 * - Exclusão de notas
 */

import React, { useState } from 'react';
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
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotas, Nota } from '@/hooks/useNotas';
import { useMinisterio } from '@/hooks/useMinisterio';
import { useUsuario } from '@/hooks/useUsuario';

const Notas = () => {
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [notaSelecionada, setNotaSelecionada] = useState<Nota | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [prioridade, setPrioridade] = useState<'baixa' | 'media' | 'alta'>('baixa');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [notaParaVisualizar, setNotaParaVisualizar] = useState<Nota | null>(null);

  // Usar o hook useNotas para gerenciar as notas
  const { notas, adicionarNota, editarNota, excluirNota, isAdmin } = useNotas();
  const { ministerioAtual } = useMinisterio();
  const { usuario } = useUsuario();

  // Verificar se o usuário é administrador do ministério atual
  const isAdminMinisterio = ministerioAtual && usuario && ministerioAtual.adminId === usuario.id;

  // Filtrar notas com base na pesquisa
  const notasFiltradas = notas.filter(nota => 
    nota.titulo.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
    nota.conteudo.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  const handleEditarNota = (nota: Nota) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem editar notas');
      return;
    }
    
    setNotaSelecionada(nota);
    setTitulo(nota.titulo);
    setConteudo(nota.conteudo);
    setPrioridade(nota.prioridade);
    setIsModalOpen(true);
  };

  const handleExcluirNota = (id: number) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem excluir notas');
      return;
    }
    
    if (confirm('Tem certeza que deseja excluir esta nota?')) {
      excluirNota.mutate(id, {
        onSuccess: () => {
          toast.success('Nota excluída com sucesso!');
        },
        onError: (error) => {
          toast.error(`Erro ao excluir nota: ${(error as Error).message}`);
        }
      });
    }
  };

  const handleSubmit = () => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem criar ou editar notas');
      return;
    }
    
    if (!titulo || !conteudo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (notaSelecionada) {
      // Editar nota existente
      editarNota.mutate(
        {
          id: notaSelecionada.id,
          titulo,
          conteudo,
          prioridade
        },
        {
          onSuccess: () => {
            toast.success('Nota atualizada com sucesso!');
            setIsModalOpen(false);
            resetForm();
          },
          onError: (error) => {
            toast.error(`Erro ao atualizar nota: ${(error as Error).message}`);
          }
        }
      );
    } else {
      // Criar nova nota
      adicionarNota.mutate(
        {
          titulo,
          conteudo,
          prioridade
        },
        {
          onSuccess: () => {
            toast.success('Nota criada com sucesso!');
            setIsModalOpen(false);
            resetForm();
          },
          onError: (error) => {
            toast.error(`Erro ao criar nota: ${(error as Error).message}`);
          }
        }
      );
    }
  };

  const resetForm = () => {
    setTitulo('');
    setConteudo('');
    setPrioridade('baixa');
    setNotaSelecionada(null);
  };

  const getPrioridadeIcon = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'media':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'baixa':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const abrirModalVisualizacao = (nota: Nota) => {
    setNotaParaVisualizar(nota);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notas</h1>
          <p className="text-muted-foreground">Gerencie as notas do seu ministério</p>
        </div>
        {isAdminMinisterio ? (
          <Button 
            className="gap-2"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nova Nota
          </Button>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 px-4 py-2 rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>Apenas o administrador do ministério pode adicionar notas</span>
          </div>
        )}
      </div>

      {/* Seção de Pesquisa */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="text-xl">Pesquisar Notas</CardTitle>
          <CardDescription>
            Encontre notas por título ou conteúdo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar nota..."
                className="pl-10"
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Notas */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Notas do Ministério</CardTitle>
          <CardDescription>
            {notasFiltradas.length} notas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!ministerioAtual ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Selecione um ministério para ver as notas.</p>
              </div>
            ) : notasFiltradas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma nota encontrada.</p>
                {isAdminMinisterio && (
                  <p className="text-sm mt-2">Clique em "Nova Nota" para adicionar uma nota.</p>
                )}
              </div>
            ) : (
              notasFiltradas.map((nota) => (
                <div
                  key={nota.id}
                  className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => abrirModalVisualizacao(nota)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{nota.titulo}</h4>
                      {getPrioridadeIcon(nota.prioridade)}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{nota.conteudo}</p>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{nota.data}</span>
                    </div>
                  </div>
                  {isAdminMinisterio && (
                    <div className="flex gap-2 mt-3 md:mt-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditarNota(nota);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExcluirNota(nota.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição/Criação */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{notaSelecionada ? 'Editar Nota' : 'Nova Nota'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input 
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Digite o título da nota"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Conteúdo</label>
              <Textarea 
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                placeholder="Digite o conteúdo da nota"
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridade</label>
              <Select 
                value={prioridade}
                onValueChange={(value: 'baixa' | 'media' | 'alta') => setPrioridade(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={adicionarNota.isPending || editarNota.isPending}>
              {adicionarNota.isPending || editarNota.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {notaParaVisualizar?.titulo}
              {notaParaVisualizar && getPrioridadeIcon(notaParaVisualizar.prioridade)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center text-sm text-muted-foreground gap-2">
              <Calendar className="h-4 w-4" />
              <span>{notaParaVisualizar?.data}</span>
            </div>
            <div className="border-t pt-4">
              <p className="whitespace-pre-wrap">{notaParaVisualizar?.conteudo}</p>
            </div>
          </div>
          <DialogFooter>
            {isAdminMinisterio && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsViewModalOpen(false);
                  if (notaParaVisualizar) {
                    handleEditarNota(notaParaVisualizar);
                  }
                }}
                className="mr-auto"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            <Button onClick={() => setIsViewModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Notas; 