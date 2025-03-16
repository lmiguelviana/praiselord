import React, { useState, useEffect } from 'react';
import { useUsuario } from '../../hooks/useUsuario';

const Perfil = () => {
  const { usuario, atualizarPerfil } = useUsuario();
  
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [previewURL, setPreviewURL] = useState('');
  const [mensagem, setMensagem] = useState('');
  
  // Carregar dados do usuário quando o componente montar
  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome || '');
      setEmail(usuario.email || '');
      setPhotoURL(usuario.photoURL || '');
      setPreviewURL(usuario.photoURL || '');
    }
  }, [usuario]);
  
  // Função para lidar com o upload de foto
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      setMensagem('Por favor, selecione um arquivo de imagem válido.');
      return;
    }
    
    // Verificar tamanho (limitar a 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMensagem('A imagem deve ter no máximo 5MB.');
      return;
    }
    
    // Criar preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPreviewURL(event.target.result as string);
        setPhotoURL(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Atualizar a função de submissão para incluir a foto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Incluir a foto nos dados a serem atualizados
    const dadosAtualizados = {
      nome,
      email,
      photoURL
    };
    
    const sucesso = await atualizarPerfil(dadosAtualizados);
    
    if (sucesso) {
      setMensagem('Perfil atualizado com sucesso!');
    } else {
      setMensagem('Ocorreu um erro ao atualizar o perfil.');
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Seu Perfil</h1>
      
      {mensagem && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded">
          {mensagem}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Upload de foto */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Foto de Perfil
          </label>
          
          <div className="flex items-center space-x-4">
            {/* Preview da foto */}
            <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-300">
              {previewURL ? (
                <img 
                  src={previewURL} 
                  alt="Foto de perfil" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600">
                  {nome ? nome.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
            
            {/* Input de arquivo */}
            <div>
              <input
                type="file"
                id="foto-perfil"
                accept="image/*"
                onChange={handleFotoChange}
                className="hidden"
              />
              <label 
                htmlFor="foto-perfil"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer"
              >
                Selecionar Nova Foto
              </label>
            </div>
          </div>
        </div>
        
        {/* Campos de nome e email */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nome">
            Nome
          </label>
          <input
            type="text"
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="flex items-center justify-center">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
};

export default Perfil;

 