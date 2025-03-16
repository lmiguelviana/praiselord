import React from 'react';
import { useUsuario } from '../../hooks/useUsuario';

const Sidebar = () => {
  const { usuario } = useUsuario();
  
  return (
    <div className="h-full w-64 bg-white border-r border-gray-200">
      {/* Área do usuário com foto de perfil */}
      <div className="flex items-center p-4 border-t border-gray-200">
        {/* Avatar do usuário */}
        <div className="flex-shrink-0 w-10 h-10 mr-3 overflow-hidden rounded-full">
          {usuario && usuario.photoURL ? (
            <img 
              src={usuario.photoURL} 
              alt={`Foto de ${usuario.nome || 'usuário'}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
              {usuario && usuario.nome ? usuario.nome.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </div>
        
        {/* Informações do usuário */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {usuario ? usuario.nome : 'Usuário'}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {usuario ? usuario.email : ''}
          </p>
        </div>
        
        {/* Botão de logout ou configurações */}
        <div>
          {/* Seu botão existente aqui */}
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 