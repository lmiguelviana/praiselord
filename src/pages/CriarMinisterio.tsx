import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import LocalDatabaseService from '@/lib/local-database';
import { UsuarioMinisterio } from '@/types/usuario';

export default function CriarMinisterio() {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, informe o nome do ministério"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Obter dados do usuário logado
      const userData = localStorage.getItem('user');
      if (!userData) {
        throw new Error('Usuário não está logado');
      }
      
      const user = JSON.parse(userData);
      
      // Gerar um PIN aleatório de 6 dígitos
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Criar o ministério
      const ministerioId = uuidv4();
      const ministerio = {
        id: ministerioId,
        nome,
        descricao,
        adminId: user.id,
        pin,
        membros: [user.id],
        createdAt: new Date().toISOString(),
        dataCriacao: new Date().toISOString(),
      };
      
      // Salvar o ministério no banco de dados
      LocalDatabaseService.createRecord('ministerios', ministerio);
      
      // Criar relação do usuário com o ministério
      const relacaoMinisterio: UsuarioMinisterio = {
        ministerioId: ministerioId,
        role: 'admin',
        dataIngresso: new Date().toISOString()
      };
      
      // Inicializar o array de ministérios se necessário
      if (!user.ministerios || !Array.isArray(user.ministerios)) {
        user.ministerios = [];
      }
      
      // Adicionar relação ao usuário
      user.ministerios.push(relacaoMinisterio);
      
      // Definir como ministério atual
      user.ministerioId = ministerioId;
      
      // Atualizar o usuário no banco de dados
      LocalDatabaseService.updateRecord('usuarios', user.id, user);
      
      // Atualizar o localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      toast({
        title: "Sucesso",
        description: "Ministério criado com sucesso! Você agora está utilizando este ministério."
      });
      
      // Redirecionar para o dashboard
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao criar ministério"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Criar Ministério</CardTitle>
          <CardDescription>
            Crie um novo ministério e torne-se o administrador
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Ministério</Label>
              <Input
                id="nome"
                placeholder="Ex: Ministério de Louvor"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o propósito do ministério"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => navigate('/dashboard')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Ministério"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 