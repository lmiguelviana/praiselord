
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass-morphism py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            to="/" 
            className="text-xl md:text-2xl font-semibold tracking-tight"
          >
            <span className="text-primary">Praise</span>Scheduler
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="/#features" 
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Recursos
          </Link>
          <Link 
            to="/#how-it-works" 
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Como Funciona
          </Link>
          <Link 
            to="/#testimonials" 
            className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
          >
            Depoimentos
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="outline" className="rounded-full px-5">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button className="rounded-full px-5">Registrar</Button>
            </Link>
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-foreground p-2 focus:outline-none"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <nav 
        className={`md:hidden absolute top-full left-0 right-0 glass-morphism transition-all duration-300 ease-in-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-[300px] opacity-100 py-4' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="container mx-auto px-6 flex flex-col space-y-4 pb-4">
          <Link 
            to="/#features" 
            className="text-sm font-medium py-2 text-foreground/80 hover:text-foreground transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Recursos
          </Link>
          <Link 
            to="/#how-it-works" 
            className="text-sm font-medium py-2 text-foreground/80 hover:text-foreground transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Como Funciona
          </Link>
          <Link 
            to="/#testimonials" 
            className="text-sm font-medium py-2 text-foreground/80 hover:text-foreground transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Depoimentos
          </Link>
          <div className="pt-2 flex flex-col space-y-3">
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full rounded-full">Entrar</Button>
            </Link>
            <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full rounded-full">Registrar</Button>
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
