/**
 * MinisterioContext.tsx
 * 
 * Contexto para gerenciamento de ministérios
 * Responsável por:
 * - Armazenar o ministério atual
 * - Gerenciar a lista de ministérios do usuário
 * - Fornecer funções para manipulação dos ministérios
 * - Persistir as preferências do usuário
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Ministerio {
  id: string;
  nome: string;
  descricao: string;
  membros: number;
  escalas: number;
  músicas: number;
  isAdmin: boolean;
  dataCriacao: Date;
}

interface MinisterioContextType {
  ministerios: Ministerio[];
  ministerioAtual: string | undefined;
  setMinisterioAtual: (id: string) => void;
  adicionarMinisterio: (ministerio: Ministerio) => void;
  atualizarMinisterio: (ministerio: Ministerio) => void;
  removerMinisterio: (id: string) => void;
  getMinisterioAtual: () => Ministerio | undefined;
}

const MinisterioContext = createContext<MinisterioContextType | undefined>(undefined);

export function MinisterioProvider({ children }: { children: React.ReactNode }) {
  const [ministerios, setMinisterios] = useState<Ministerio[]>(() => {
    const saved = localStorage.getItem('ministerios');
    return saved ? JSON.parse(saved) : [];
  });

  const [ministerioAtual, setMinisterioAtual] = useState<string>(() => {
    const saved = localStorage.getItem('ministerioAtual');
    return saved || (ministerios[0]?.id || '');
  });

  // Persistir alterações
  useEffect(() => {
    localStorage.setItem('ministerios', JSON.stringify(ministerios));
  }, [ministerios]);

  useEffect(() => {
    localStorage.setItem('ministerioAtual', ministerioAtual);
  }, [ministerioAtual]);

  const adicionarMinisterio = (ministerio: Ministerio) => {
    setMinisterios(prev => [...prev, ministerio]);
    if (!ministerioAtual) {
      setMinisterioAtual(ministerio.id);
    }
    toast.success('Ministério criado com sucesso!');
  };

  const atualizarMinisterio = (ministerio: Ministerio) => {
    setMinisterios(prev =>
      prev.map(m => (m.id === ministerio.id ? ministerio : m))
    );
    toast.success('Ministério atualizado com sucesso!');
  };

  const removerMinisterio = (id: string) => {
    setMinisterios(prev => prev.filter(m => m.id !== id));
    if (ministerioAtual === id) {
      setMinisterioAtual(ministerios[0]?.id || '');
    }
    toast.success('Ministério removido com sucesso!');
  };

  const getMinisterioAtual = () => {
    return ministerios.find(m => m.id === ministerioAtual);
  };

  return (
    <MinisterioContext.Provider
      value={{
        ministerios,
        ministerioAtual,
        setMinisterioAtual,
        adicionarMinisterio,
        atualizarMinisterio,
        removerMinisterio,
        getMinisterioAtual,
      }}
    >
      {children}
    </MinisterioContext.Provider>
  );
}

export function useMinisterio() {
  const context = useContext(MinisterioContext);
  if (context === undefined) {
    throw new Error('useMinisterio deve ser usado dentro de um MinisterioProvider');
  }
  return context;
} 