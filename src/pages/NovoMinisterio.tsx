import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

const NovoMinisterio: React.FC = () => {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Função para criar o ministério
  const handleCriarMinisterio = async () => {
    try {
      // Verificar campos obrigatórios
      if (!nome) {
        setErro('O nome do ministério é obrigatório.');
        return;
      }

      setIsLoading(true);
      
      // Criar o ministério
      const novoMinisterio = await criarMinisterio(nome, descricao);
      
      if (novoMinisterio) {
        // Mostrar mensagem de sucesso
        toast.success('Ministério criado com sucesso!');
        
        // Aguardar um momento antes de redirecionar
        setTimeout(() => {
          // Redirecionar para a página do ministério com o ID
          console.log('Redirecionando para detalhes do ministério:', novoMinisterio.id);
          router.push(`/ministerio/${novoMinisterio.id}`);
        }, 500);
      } else {
        setErro('Erro ao criar o ministério. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao criar ministério:', error);
      setErro('Ocorreu um erro ao criar o ministério.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Renderização do formulário de criação do ministério */}
    </div>
  );
};

export default NovoMinisterio; 