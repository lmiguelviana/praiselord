// Função modificada para bloquear o login com Google
const handleGoogleLogin = (e: React.MouseEvent) => {
  e.preventDefault();
  alert("SERVIÇO DESATIVADO: Login com Google não está disponível no momento.");
};

{/* Botão de login com Google */}
<button 
  onClick={handleGoogleLogin} 
  className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-200 focus:outline-none opacity-70 cursor-not-allowed"
  disabled={true}
>
  <div className="flex items-center justify-center">
    <img src="/google-icon.svg" alt="Google" className="h-5 w-5 mr-2 opacity-50" />
    <span>Entrar com Google (SERVIÇO DESATIVADO)</span>
  </div>
</button> 