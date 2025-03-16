import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useMinisterio } from '@/hooks/useMinisterio';
import { useUsuario } from '@/hooks/useUsuario';
import { Ministerio, Usuario } from '@/types/usuario';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import { Shield, Users, Copy, RefreshCw, Clipboard } from 'lucide-react';

export default function DetalhesMinisterio() {
  const router = useRouter();
  const { id } = router.query;
  const { usuario } = useUsuario();
  const { ministerios, gerarPinConvite, obterMembrosMinisterio } = useMinisterio();
  
  const [ministerio, setMinisterio] = useState<Ministerio | null>(null);
  const [membros, setMembros] = useState<Usuario[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pin, setPin] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  
  useEffect(() => {
    if (id && ministerios.length > 0) {
      const ministerioAtual = ministerios.find(m => m.id === id);
      if (ministerioAtual) {
        setMinisterio(ministerioAtual);
        
        // Verificar se o usuário atual é administrador deste ministério
        if (usuario) {
          const relacao = usuario.ministerios.find(m => m.ministerioId === id);
          setIsAdmin(relacao?.role === 'admin');
        }
        
        // Carregar membros do ministério
        carregarMembros(ministerioAtual.id);
      } else {
        // Ministério não encontrado
        toast.error('Ministério não encontrado');
        router.push('/dashboard');
      }
      
      setIsLoading(false);
    }
  }, [id, ministerios, usuario]);
  
  // Função para carregar os membros do ministério
  const carregarMembros = async (ministerioId: string) => {
    try {
      const membrosMinisterio = await obterMembrosMinisterio(ministerioId);
      setMembros(membrosMinisterio);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      toast.error('Erro ao carregar membros do ministério');
    }
  };
  
  // Função para gerar um PIN de convite
  const handleGerarPin = async () => {
    if (!ministerio) return;
    
    try {
      setGerando(true);
      const novoPIN = await gerarPinConvite(ministerio.id);
      
      if (novoPIN) {
        setPin(novoPIN);
        toast.success('PIN gerado com sucesso!');
      } else {
        toast.error('Erro ao gerar PIN de convite');
      }
    } catch (error) {
      console.error('Erro ao gerar PIN:', error);
      toast.error('Erro ao gerar PIN de convite');
    } finally {
      setGerando(false);
    }
  };
  
  // Função para copiar o PIN para a área de transferência
  const handleCopiarPin = () => {
    if (!pin) return;
    
    navigator.clipboard.writeText(pin)
      .then(() => {
        toast.success('PIN copiado para a área de transferência!');
      })
      .catch(err => {
        console.error('Erro ao copiar PIN:', err);
        toast.error('Erro ao copiar PIN');
      });
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }
  
  if (!ministerio) {
    return (
      <Layout>
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-500">Ministério não encontrado</h1>
          <p className="mt-4">O ministério que você está procurando não existe ou foi removido.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Voltar para o Dashboard
          </button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{ministerio.nome}</h1>
            {isAdmin && (
              <button
                onClick={() => router.push(`/ministerio/editar/${ministerio.id}`)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Editar Ministério
              </button>
            )}
          </div>
          
          {ministerio.descricao && (
            <p className="text-gray-600 mb-4">{ministerio.descricao}</p>
          )}
          
          <div className="flex items-center text-gray-500 mb-2">
            <Shield className="w-5 h-5 mr-2" />
            <span>Administrador: {membros.find(m => m.id === ministerio.adminId)?.nome || 'Desconhecido'}</span>
          </div>
          
          <div className="flex items-center text-gray-500">
            <Users className="w-5 h-5 mr-2" />
            <span>{typeof ministerio.membros === 'number' ? ministerio.membros : (ministerio.membrosDetalhes?.length || 0)} membros</span>
          </div>
        </div>
        
        {/* Seção de Convite - Só aparece para administradores */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Convidar Membros</h2>
            
            {pin ? (
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">PIN de convite (válido por 24 horas):</p>
                    <p className="text-2xl font-mono font-bold tracking-wider">{pin}</p>
                  </div>
                  <button
                    onClick={handleCopiarPin}
                    className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200"
                    title="Copiar PIN"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-100 p-4 rounded-lg mb-4 text-center">
                <p className="text-gray-500 mb-2">Ainda não há PIN de convite gerado.</p>
                <p className="text-sm text-gray-400">Gere um PIN para convidar novos membros para o ministério.</p>
              </div>
            )}
            
            <button
              onClick={handleGerarPin}
              disabled={gerando}
              className={`w-full py-2 rounded-lg flex items-center justify-center ${
                gerando ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {gerando ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Gerando PIN...
                </>
              ) : (
                <>
                  <Clipboard className="w-5 h-5 mr-2" />
                  {pin ? 'Gerar Novo PIN' : 'Gerar PIN de Convite'}
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Lista de Membros */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Membros do Ministério</h2>
          
          {membros.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhum membro encontrado.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {membros.map(membro => {
                const relacao = membro.ministerios.find(m => m.ministerioId === ministerio.id);
                return (
                  <li key={membro.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      {membro.foto ? (
                        <img src={membro.foto} alt={membro.nome} className="w-10 h-10 rounded-full mr-3" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                          <span className="text-gray-600 font-bold">
                            {membro.nome?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{membro.nome}</p>
                        <p className="text-sm text-gray-500">{relacao?.role === 'admin' ? 'Administrador' : 'Membro'}</p>
                      </div>
                    </div>
                    
                    {isAdmin && membro.id !== usuario?.id && membro.id !== ministerio.adminId && (
                      <button className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                        Remover
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
} 