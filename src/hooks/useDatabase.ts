import { useState } from 'react';
import DatabaseService from '../lib/database';
import { v4 as uuidv4 } from 'uuid';
import { backupDatabase } from '../lib/database-init';

export function useDatabase() {
  const [error, setError] = useState<string | null>(null);

  const createMinisterio = (data: { nome: string; descricao?: string }) => {
    try {
      const ministerioData = {
        id: uuidv4(),
        ...data,
        isAdmin: false,
        dataCriacao: new Date().toISOString()
      };
      return DatabaseService.createRecord('ministerios', ministerioData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar ministério');
      return null;
    }
  };

  const listMinisterios = () => {
    try {
      return DatabaseService.findRecords('ministerios');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao listar ministérios');
      return [];
    }
  };

  const updateMinisterio = (id: string, data: { nome?: string; descricao?: string }) => {
    try {
      return DatabaseService.updateRecord('ministerios', id, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar ministério');
      return null;
    }
  };

  const deleteMinisterio = (id: string) => {
    try {
      return DatabaseService.deleteRecord('ministerios', id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar ministério');
      return null;
    }
  };

  const backupDatabaseAction = () => {
    try {
      return backupDatabase();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar backup do banco de dados');
      return null;
    }
  };

  return {
    createMinisterio,
    listMinisterios,
    updateMinisterio,
    deleteMinisterio,
    backupDatabaseAction,
    error
  };
}

export function useUsuarios() {
  const [error, setError] = useState<string | null>(null);

  const createUsuario = (data: { 
    nome: string; 
    email: string; 
    senha: string; 
    ministerioId?: string 
  }) => {
    try {
      const usuarioData = {
        id: uuidv4(),
        ...data
      };
      return DatabaseService.createRecord('usuarios', usuarioData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário');
      return null;
    }
  };

  const listUsuarios = (ministerioId?: string) => {
    try {
      const conditions = ministerioId ? { ministerioId } : {};
      return DatabaseService.findRecords('usuarios', conditions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao listar usuários');
      return [];
    }
  };

  return {
    createUsuario,
    listUsuarios,
    error
  };
}