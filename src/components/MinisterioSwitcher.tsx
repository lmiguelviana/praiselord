/**
 * MinisterioSwitcher.tsx
 * 
 * Componente para alternar entre ministérios
 * Responsável por:
 * - Exibir o ministério atual
 * - Permitir troca rápida entre ministérios
 * - Mostrar status de administrador
 * - Fornecer acesso rápido às ações do ministério
 */

import * as React from "react";
import { Check, ChevronsUpDown, Building2, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";

interface Ministerio {
  id: string;
  nome: string;
  descricao: string;
  isAdmin: boolean;
}

interface MinisterioSwitcherProps {
  ministerios: Ministerio[];
  ministerioAtual: string;
  onMinisterioChange: (id: string) => void;
}

export function MinisterioSwitcher({
  ministerios,
  ministerioAtual,
  onMinisterioChange
}: MinisterioSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const ministerioSelecionado = ministerios.find(
    (ministerio) => ministerio.id === ministerioAtual
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Selecione um ministério"
          className="w-full justify-between hover:bg-muted/50"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {ministerioSelecionado?.nome || "Selecione um ministério"}
            </span>
            {ministerioSelecionado?.isAdmin && (
              <span className="ml-2 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                Admin
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Buscar ministério..." />
          <CommandList>
            <CommandEmpty>Nenhum ministério encontrado.</CommandEmpty>
            <CommandGroup heading="Seus Ministérios">
              {ministerios.map((ministerio) => (
                <CommandItem
                  key={ministerio.id}
                  onSelect={() => {
                    onMinisterioChange(ministerio.id);
                    
                    try {
                      const userDataStr = localStorage.getItem('user');
                      if (userDataStr) {
                        const userData = JSON.parse(userDataStr);
                        userData.ministerioId = ministerio.id;
                        localStorage.setItem('user', JSON.stringify(userData));
                        console.log(`Ministério alterado para: ${ministerio.nome} (${ministerio.id})`);
                        
                        window.dispatchEvent(new Event('storage'));
                      }
                    } catch (error) {
                      console.error('Erro ao atualizar ministério no localStorage:', error);
                    }
                    
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="flex-1 truncate">{ministerio.nome}</span>
                  {ministerio.isAdmin && (
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                      Admin
                    </span>
                  )}
                  {ministerio.id === ministerioAtual && (
                    <Check className="h-4 w-4 ml-2" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  navigate("/perfil");
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Novo Ministério
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  navigate("/configuracoes");
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Gerenciar Ministérios
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 