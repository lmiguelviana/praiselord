import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Register = () => {
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();
  
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [previewURL, setPreviewURL] = useState('');
  const [formError, setFormError] = useState('');
  
  // Função para lidar com o upload de foto
  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      setFormError('Por favor, selecione um arquivo de imagem válido.');
      return;
    }
    
    // Verificar tamanho (limitar a 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFormError('A imagem deve ter no máximo 5MB.');
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
  
  // Função para cadastro com Google (desativada)
  const handleGoogleSignup = (e: React.MouseEvent) => {
    e.preventDefault();
    alert("SERVIÇO DESATIVADO: Cadastro com Google não está disponível no momento.");
  };
  
  // Função de submissão do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFormError('');
    
    // Validar campos
    if (!nome || !email || !password || !confirmPassword) {
      setFormError('Todos os campos são obrigatórios.');
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError('As senhas não conferem.');
      return;
    }
    
    if (password.length < 6) {
      setFormError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    // Tentativa de registro
    const sucesso = await register(nome, email, password, photoURL);
    
    if (sucesso) {
      navigate('/dashboard');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crie sua conta
          </h2>
        </div>
        
        {(error || formError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error || formError}
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="nome" className="sr-only">Nome</label>
              <input
                id="nome"
                name="nome"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="email-address" className="sr-only">Email</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="confirm-password" className="sr-only">Confirmar Senha</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirmar senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          
          {/* Seção de foto de perfil */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Foto de Perfil (opcional)
            </label>
            
            <div className="mt-2 flex items-center space-x-4">
              {/* Preview da foto */}
              <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-300">
                {previewURL ? (
                  <img 
                    src={previewURL} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-600">
                    {nome ? nome.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              
              {/* Input para upload */}
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
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                >
                  Selecionar Foto
                </label>
              </div>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cadastrar
            </button>
          </div>
          
          <div className="text-center">
            <p>Ou</p>
          </div>
          
          {/* Botão de cadastro com Google (desativado) */}
          <button 
            onClick={handleGoogleSignup} 
            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-200 focus:outline-none opacity-70 cursor-not-allowed"
            disabled={true}
            type="button"
          >
            <div className="flex items-center justify-center">
              <img src="/google-icon.svg" alt="Google" className="h-5 w-5 mr-2 opacity-50" />
              <span>Cadastrar com Google (SERVIÇO DESATIVADO)</span>
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register; 