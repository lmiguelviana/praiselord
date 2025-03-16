import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import LocalDatabaseService from '@/lib/local-database';
import { UsuarioMinisterio } from '@/types/usuario';

export default function EntrarMinisterio() {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, informe o PIN do ministério"
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
      
      // Buscar o ministério pelo PIN
      const ministerios = LocalDatabaseService.findRecords('ministerios', { pin });
      
      if (ministerios.length === 0) {
        throw new Error('PIN inválido. Nenhum ministério encontrado com este PIN.');
      }
      
      const ministerio = ministerios[0];
      
      // Verificar se o usuário já está no ministério
      if (user.ministerios && Array.isArray(user.ministerios)) {
        const jaParticipa = user.ministerios.some(
          (rel) => typeof rel === 'object' && rel.ministerioId === ministerio.id
        );
        
        if (jaParticipa) {
          throw new Error('Você já participa deste ministério');
        }
      } else {
        // Inicializar array de ministérios se não existir
        user.ministerios = [];
      }
      
      // Adicionar o usuário ao ministério
      ministerio.membros = [...(ministerio.membros || []), user.id];
      LocalDatabaseService.updateRecord('ministerios', ministerio.id, ministerio);
      
      // Criar relação do usuário com o ministério
      const relacaoMinisterio: UsuarioMinisterio = {
        ministerioId: ministerio.id,
        role: 'member',
        dataIngresso: new Date().toISOString()
      };
      
      // Adicionar relação ao usuário
      user.ministerios.push(relacaoMinisterio);
      
      // Definir sempre como ministério atual
      user.ministerioId = ministerio.id;
      
      // Atualizar o usuário no banco de dados
      LocalDatabaseService.updateRecord('usuarios', user.id, user);
      
      // Atualizar o localStorage
      localStorage.setItem('user', JSON.stringify(user));
      
      toast({
        title: "Sucesso",
        description: `Você entrou no ministério ${ministerio.nome} com sucesso! Agora você está utilizando este ministério.`
      });
      
      // Redirecionar para o dashboard
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao entrar no ministério"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Entrar em um Ministério</CardTitle>
          <CardDescription>
            Insira o PIN fornecido pelo administrador do ministério
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pin">PIN do Ministério</Label>
              <Input
                id="pin"
                placeholder="Ex: 123456"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
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
              {isLoading ? "Entrando..." : "Entrar no Ministério"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 