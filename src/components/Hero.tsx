
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Music, Calendar, Users } from 'lucide-react';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/50 via-background to-background -z-10" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-0 w-full h-full -z-10 opacity-60">
        <div className="absolute top-0 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="mb-6 inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary font-medium">
              <span className="mr-2">✨</span>
              <span>Simplifique a organização do seu ministério</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight md:leading-tight tracking-tight mb-6">
              Organize seu ministério de louvor com<br /> 
              <span className="text-primary relative">
                facilidade e excelência
                <svg className="absolute bottom-1 left-0 w-full h-2 text-primary/20 -z-10" viewBox="0 0 418 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 11C83.2 6.2 166.667 3.667 252.5 3.5C325.5 3.5 373.667 6.5 416 11" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-10">
              Uma plataforma completa para gerenciar equipes, criar escalas de louvor
              e organizar ensaios com poucos cliques.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="rounded-full px-8 py-6 text-base font-medium">
                  Começar agora 
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/#como-funciona">
                <Button variant="outline" size="lg" className="rounded-full px-8 py-6 text-base font-medium">
                  Como funciona
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className={`mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 delay-200 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="glass-morphism rounded-2xl p-6 card-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestão de Equipes</h3>
              <p className="text-foreground/70">Gerencie seus músicos e cantores com facilidade</p>
            </div>
            
            <div className="glass-morphism rounded-2xl p-6 card-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Escalas Inteligentes</h3>
              <p className="text-foreground/70">Crie escalas balanceadas e evite sobrecarga</p>
            </div>
            
            <div className="glass-morphism rounded-2xl p-6 card-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Repertório Organizado</h3>
              <p className="text-foreground/70">Mantenha um catálogo com todas as músicas</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
