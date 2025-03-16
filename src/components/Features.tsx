
import { useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Calendar, Music, Bell, MessageSquare, 
  CheckCircle2, Settings, FileText, PieChart 
} from 'lucide-react';

const Features = () => {
  const featuresRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-up');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const featureElements = document.querySelectorAll('.feature-animate');
    featureElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      featureElements.forEach((element) => {
        observer.unobserve(element);
      });
    };
  }, []);

  return (
    <section 
      id="features" 
      className="py-20 bg-accent/30"
      ref={featuresRef}
    >
      <div className="container mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 feature-animate opacity-0">
          <div className="mb-6 inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary font-medium">
            <span>Recursos poderosos</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Tudo o que você precisa em um só lugar
          </h2>
          <p className="text-lg text-foreground/80">
            Nossa plataforma oferece todas as ferramentas necessárias para a gestão 
            completa do seu ministério de louvor.
          </p>
        </div>

        <Tabs defaultValue="equipes" className="w-full max-w-5xl mx-auto feature-animate opacity-0">
          <TabsList className="grid w-full grid-cols-3 mb-12 h-auto p-1 bg-muted/80 rounded-full">
            <TabsTrigger 
              value="equipes" 
              className="rounded-full py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Equipes
            </TabsTrigger>
            <TabsTrigger 
              value="escalas" 
              className="rounded-full py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Escalas
            </TabsTrigger>
            <TabsTrigger 
              value="repertorio" 
              className="rounded-full py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Music className="h-4 w-4 mr-2" />
              Repertório
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="equipes" className="mt-4">
            <div className="glass-morphism rounded-3xl overflow-hidden">
              <div className="grid md:grid-cols-2 items-center">
                <div className="p-8 md:p-12">
                  <h3 className="text-2xl font-bold mb-6">Gerenciamento de Equipes Simplificado</h3>
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 bg-primary/10 p-1.5 rounded-full">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium mb-2">Convites por Código</h4>
                        <p className="text-foreground/70">Gere códigos de convite exclusivos para convidar novos membros ao ministério.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 bg-primary/10 p-1.5 rounded-full">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium mb-2">Perfis Detalhados</h4>
                        <p className="text-foreground/70">Mantenha informações completas sobre cada membro, incluindo instrumentos e disponibilidade.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 bg-primary/10 p-1.5 rounded-full">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium mb-2">Níveis de Acesso</h4>
                        <p className="text-foreground/70">Configure permissões específicas para líderes, administradores e membros.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-accent/30 p-6 h-full flex items-center justify-center">
                  <div className="relative w-full max-w-md aspect-[4/3] bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-12 bg-primary/5 border-b flex items-center px-4">
                      <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="pt-14 px-4 pb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-medium">Equipe de Louvor</h5>
                        <button className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Adicionar</button>
                      </div>
                      <div className="space-y-3">
                        {[
                          { name: 'Ricardo Oliveira', role: 'Líder - Guitarra' },
                          { name: 'Mariana Santos', role: 'Vocal' },
                          { name: 'Lucas Ferreira', role: 'Bateria' },
                          { name: 'Juliana Costa', role: 'Teclado' },
                          { name: 'Pedro Almeida', role: 'Baixo' }
                        ].map((member, index) => (
                          <div key={index} className="flex items-center p-3 bg-accent/30 rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium mr-3">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-foreground/70">{member.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="escalas" className="mt-4">
            <div className="glass-morphism rounded-3xl overflow-hidden">
              <div className="grid md:grid-cols-2 items-center">
                <div className="p-8 md:p-12">
                  <h3 className="text-2xl font-bold mb-6">Escalas Inteligentes e Automáticas</h3>
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 bg-primary/10 p-1.5 rounded-full">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium mb-2">Criação Simplificada</h4>
                        <p className="text-foreground/70">Crie escalas de forma rápida, com sugestões automáticas baseadas na disponibilidade.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 bg-primary/10 p-1.5 rounded-full">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium mb-2">Notificações Automáticas</h4>
                        <p className="text-foreground/70">Envie lembretes automáticos para os membros escalados para um evento.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 bg-primary/10 p-1.5 rounded-full">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium mb-2">Substituições Rápidas</h4>
                        <p className="text-foreground/70">Gerenciar substituições com facilidade quando alguém não puder participar.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-accent/30 p-6 h-full flex items-center justify-center">
                  <div className="relative w-full max-w-md aspect-[4/3] bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-12 bg-primary/5 border-b flex items-center px-4">
                      <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="pt-14 px-4 pb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-medium">Escala - Culto de Domingo</h5>
                        <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">10/06</div>
                      </div>
                      <div className="space-y-3">
                        {[
                          { name: 'Ricardo Oliveira', role: 'Guitarra', time: '8:00' },
                          { name: 'Mariana Santos', role: 'Vocal', time: '8:00' },
                          { name: 'Lucas Ferreira', role: 'Bateria', time: '7:45' },
                          { name: 'Juliana Costa', role: 'Teclado', time: '8:00' },
                          { name: 'Pedro Almeida', role: 'Baixo', time: '7:30' }
                        ].map((member, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium mr-3">
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{member.name}</p>
                                <p className="text-xs text-foreground/70">{member.role}</p>
                              </div>
                            </div>
                            <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              {member.time}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="repertorio" className="mt-4">
            <div className="glass-morphism rounded-3xl overflow-hidden">
              <div className="grid md:grid-cols-2 items-center">
                <div className="p-8 md:p-12">
                  <h3 className="text-2xl font-bold mb-6">Gerenciamento de Repertório</h3>
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 bg-primary/10 p-1.5 rounded-full">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium mb-2">Banco de Músicas</h4>
                        <p className="text-foreground/70">Mantenha um catálogo completo com todas as músicas do ministério.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 bg-primary/10 p-1.5 rounded-full">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium mb-2">Cifras e Partituras</h4>
                        <p className="text-foreground/70">Armazene e compartilhe cifras, partituras e áudios de referência.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="mr-4 mt-1 bg-primary/10 p-1.5 rounded-full">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium mb-2">Listas de Reprodução</h4>
                        <p className="text-foreground/70">Crie listas personalizadas para diferentes tipos de eventos e cultos.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-accent/30 p-6 h-full flex items-center justify-center">
                  <div className="relative w-full max-w-md aspect-[4/3] bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-12 bg-primary/5 border-b flex items-center px-4">
                      <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="pt-14 px-4 pb-4">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-medium">Repertório - Culto de Domingo</h5>
                        <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">5 músicas</div>
                      </div>
                      <div className="space-y-3">
                        {[
                          { name: 'Grande é o Senhor', key: 'D', tempo: '72 bpm' },
                          { name: 'Consagração', key: 'G', tempo: '68 bpm' },
                          { name: 'Santo Espírito', key: 'E', tempo: '74 bpm' },
                          { name: 'Deus de Promessas', key: 'A', tempo: '70 bpm' },
                          { name: 'Seu Nome é Jesus', key: 'C', tempo: '65 bpm' }
                        ].map((song, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium mr-3">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{song.name}</p>
                                <p className="text-xs text-foreground/70">Tom: {song.key} • {song.tempo}</p>
                              </div>
                            </div>
                            <div className="text-primary">
                              <FileText className="h-4 w-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 feature-animate opacity-0">
          <div className="glass-morphism rounded-2xl p-8 text-center card-shadow">
            <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-3">Notificações</h3>
            <p className="text-foreground/70">
              Receba lembretes automáticos de ensaios, eventos e atualizações nas escalas.
            </p>
          </div>
          
          <div className="glass-morphism rounded-2xl p-8 text-center card-shadow">
            <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-3">Chat Integrado</h3>
            <p className="text-foreground/70">
              Comunique-se facilmente com sua equipe através do chat interno da plataforma.
            </p>
          </div>
          
          <div className="glass-morphism rounded-2xl p-8 text-center card-shadow">
            <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <PieChart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-3">Relatórios</h3>
            <p className="text-foreground/70">
              Acompanhe a participação dos membros e a frequência das músicas utilizadas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
