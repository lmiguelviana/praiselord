import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Star, Music2, Heart, Link, Lock, Globe, GanttChart, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface MusicaCardProps {
  id: number;
  titulo: string;
  artista: string;
  tom?: string;
  tags?: string[];
  dataCriacao?: string;
  favoritada?: boolean;
  onFavoritar?: (id: number) => void;
  onClick?: () => void;
  onVerMais?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  deezerId?: number;
  deezerCover?: string;
  noRepositorioComum?: boolean;
  ministerioId?: string;
  dataElegibilidadeRepositorio?: string;
  usuarioMinisterioId?: string;
  isAdmin?: boolean;
}

const MusicaCard: React.FC<MusicaCardProps> = ({
  id,
  titulo,
  artista,
  tom,
  tags,
  dataCriacao,
  favoritada,
  onFavoritar,
  onClick,
  onVerMais,
  onEdit,
  onDelete,
  deezerCover,
  noRepositorioComum,
  ministerioId,
  dataElegibilidadeRepositorio,
  usuarioMinisterioId,
  isAdmin
}) => {
  // Formatar data relativa (ex: "há 2 dias")
  const formatarDataRelativa = (data: string) => {
    try {
      return formatDistanceToNowStrict(new Date(data), { 
        addSuffix: true,
        locale: ptBR
      });
    } catch {
      return 'Data desconhecida';
    }
  };

  // Calcular dias restantes para compartilhamento no repositório comum
  const calcularDiasParaCompartilhamento = (): number | null => {
    if (!dataElegibilidadeRepositorio || noRepositorioComum) return null;
    
    const hoje = new Date();
    const dataCompartilhamento = new Date(dataElegibilidadeRepositorio);
    const diasRestantes = Math.ceil((dataCompartilhamento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    return diasRestantes > 0 ? diasRestantes : null;
  };

  // Determinar se a música é exclusiva do ministério atual
  const isExclusiva = ministerioId === usuarioMinisterioId && !noRepositorioComum;
  
  // Dias restantes para compartilhamento
  const diasRestantes = calcularDiasParaCompartilhamento();

  return (
    <Card 
      className={`transition-shadow hover:shadow-md group ${onClick ? 'cursor-pointer' : ''}`} 
      onClick={onClick}
    >
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-start">
          {/* Artista em destaque (em negrito) */}
          <CardTitle className="text-lg font-bold">{artista}</CardTitle>

          <div className="flex items-center gap-1">
            {/* Ícone de favorito (apenas para administradores) */}
            {onFavoritar && isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded-full ${favoritada ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onFavoritar(id);
                }}
              >
                <Star className={`h-[1.2rem] w-[1.2rem] ${favoritada ? 'fill-current' : ''}`} />
              </Button>
            )}

            {/* Menu de ações para administradores */}
            {isAdmin && (onEdit || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* Título da música abaixo do artista */}
        <CardDescription className="text-base mt-0.5">{titulo}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-3">
        {/* Área de tags */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {/* Tom */}
          {tom && (
            <Badge variant="outline" className="text-xs">
              <Music2 className="mr-1 h-3 w-3" />
              {tom}
            </Badge>
          )}
          
          {/* Status de exclusividade ou compartilhamento */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {isExclusiva ? (
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200">
                    <Lock className="mr-1 h-3 w-3" />
                    Exclusiva
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 hover:bg-green-200">
                    <Globe className="mr-1 h-3 w-3" />
                    Compartilhada
                  </Badge>
                )}
              </TooltipTrigger>
              <TooltipContent side="top">
                {isExclusiva && diasRestantes ? (
                  <>Será compartilhada em {diasRestantes} dias</>
                ) : (
                  isExclusiva ? 'Exclusiva deste ministério' : 'Disponível para todos os ministérios'
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Tags adicionais */}
          {tags && tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="pt-1 pb-3 flex justify-between">
        {/* Data de criação */}
        {dataCriacao && (
          <div className="text-xs text-muted-foreground flex items-center">
            <Clock className="mr-1 h-3 w-3" />
            {formatarDataRelativa(dataCriacao)}
          </div>
        )}
        
        {/* Botão Ver Mais */}
        {onVerMais && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onVerMais();
            }}
          >
            Detalhes
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default MusicaCard; 