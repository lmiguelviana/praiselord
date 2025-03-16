/**
 * CriarMinisterioModal.tsx
 * 
 * Modal para criação de novos ministérios
 * Responsável por:
 * - Formulário de criação de ministério
 * - Geração de PIN de convite
 * - Compartilhamento via WhatsApp
 * - Cópia do PIN para área de transferência
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Copy, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Props para o modal de criação de ministério
interface CriarMinisterioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  novoMinisterio: {
    nome: string;
    descricao: string;
  };
  setNovoMinisterio: React.Dispatch<React.SetStateAction<{
    nome: string;
    descricao: string;
  }>>;
  onCriar: () => Promise<void>;
  loading?: boolean;
}

// Componente do modal de criação de ministério
export function CriarMinisterioModal({
  open,
  onOpenChange,
  novoMinisterio,
  setNovoMinisterio,
  onCriar,
  loading = false
}: CriarMinisterioModalProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Ministério</DialogTitle>
          <DialogDescription>
            Crie um novo ministério. Você será automaticamente definido como administrador.
          </DialogDescription>
        </DialogHeader>
        
        {/* Formulário de criação */}
        <div className="grid gap-4 py-4">
          {/* Campo para nome do ministério */}
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome do Ministério</Label>
            <Input 
              id="nome" 
              placeholder="Ex: Ministério de Louvor" 
              value={novoMinisterio.nome}
              onChange={(e) => setNovoMinisterio({
                ...novoMinisterio,
                nome: e.target.value
              })}
            />
          </div>

          {/* Campo para descrição (opcional) */}
          <div className="grid gap-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Input 
              id="descricao" 
              placeholder="Ex: Ministério de Louvor da Igreja..." 
              value={novoMinisterio.descricao}
              onChange={(e) => setNovoMinisterio({
                ...novoMinisterio,
                descricao: e.target.value
              })}
            />
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={onCriar}
              disabled={!novoMinisterio.nome || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Ministério
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
} 