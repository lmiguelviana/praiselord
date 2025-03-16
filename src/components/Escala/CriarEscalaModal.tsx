import React, { useState, useEffect } from 'react';
import { useUsuario } from '../../hooks/useUsuario';
import { EscalaService } from '../../services/EscalaService';

interface CriarEscalaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CriarEscalaModal: React.FC<CriarEscalaModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { usuario } = useUsuario();
  const [error, setError] = useState('');
  
  // Verificar permissão assim que o componente é montado
  useEffect(() => {
    if (isOpen && (!usuario || usuario.perfil !== 'admin_ministerio')) {
      setError('Apenas administradores de ministério podem criar escalas.');
      // Opcional: Fechar o modal automaticamente após alguns segundos
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, usuario, onClose]);
  
  // ... resto do código do componente ...
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar permissão novamente antes de submeter
    if (!usuario || usuario.perfil !== 'admin_ministerio') {
      setError('Permissão negada. Apenas administradores de ministério podem criar escalas.');
      return;
    }
    
    // ... código existente para criar a escala ...
    
    const sucesso = EscalaService.criarEscala({
      // dados da escala
    });
    
    if (sucesso) {
      onSuccess();
      onClose();
    } else {
      setError('Erro ao criar escala. Tente novamente.');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Criar Nova Escala</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}
        
        {/* Se não for administrador, mostrar mensagem e botão para fechar */}
        {(!usuario || usuario.perfil !== 'admin_ministerio') ? (
          <div>
            <p className="mb-4 text-red-600">
              Apenas administradores de ministério podem criar escalas.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Campos do formulário existente */}
            
            <div className="flex justify-end mt-6 space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                Criar Escala
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CriarEscalaModal; 