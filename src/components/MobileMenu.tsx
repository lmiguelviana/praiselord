import React from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Sidebar from './Sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUsuario } from '@/hooks/useUsuario';

export const MobileMenu = () => {
  const [open, setOpen] = React.useState(false);
  const { usuario } = useUsuario();  // Obter informações do usuário atual

  // Função para obter as iniciais do nome para o fallback do avatar
  const obterIniciais = (nome: string) => {
    if (!nome) return "U";
    
    return nome
      .split(" ")
      .map(n => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2">
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        
        {/* Avatar do usuário no menu móvel */}
        <Avatar className="h-9 w-9 border border-border md:hidden">
          <AvatarImage src={usuario?.foto || ''} alt={usuario?.nome || 'Usuário'} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {usuario ? obterIniciais(usuario.nome) : "U"}
          </AvatarFallback>
        </Avatar>
      </div>
      
      <SheetContent side="left" className="p-0 w-[270px]">
        <Sidebar setOpen={setOpen} />
      </SheetContent>
    </Sheet>
  );
}; 