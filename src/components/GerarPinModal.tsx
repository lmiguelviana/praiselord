import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share2, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useMinisterio } from '@/hooks/useMinisterio';
import { MinisterioPin } from '@/types/usuario';

interface GerarPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  ministerio: string;
  ministerioId: string;
}

const GerarPinModal = ({ isOpen, onClose, ministerio, ministerioId }: GerarPinModalProps) => {
  const [pinAtual, setPinAtual] = useState<MinisterioPin | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pins, setPins] = useState<MinisterioPin[]>([]);
  const { gerarPinConvite, ministerios } = useMinisterio();

  // Carregar PINs existentes quando o modal for aberto
  useEffect(() => {
    if (isOpen && ministerioId) {
      carregarPins();
    }
  }, [isOpen, ministerioId]);

  // Carregar PINs do ministério
  const carregarPins = () => {
    const ministerioAtual = ministerios.find(m => m.id === ministerioId);
    if (ministerioAtual && ministerioAtual.pins) {
      setPins(ministerioAtual.pins);
    } else {
      setPins([]);
    }
  };

  // Criar novo PIN
  const criarNovoPin = async () => {
    try {
      // Mostrar feedback de carregamento
      toast.loading('Gerando novo PIN...');
      
      // Tentar gerar o PIN
      const novoPin = await gerarPinConvite(ministerioId);
      
      // Fechar toast de carregamento
      toast.dismiss();
      
      if (novoPin) {
        setPinAtual(novoPin);
        setPins(prev => [novoPin, ...prev]);
        toast.success('PIN gerado com sucesso!');
        
        // Mostrar mensagem com instruções
        toast('Compartilhe este PIN para convidar pessoas para o ministério', {
          duration: 5000,
        });
      } else {
        toast.error('Erro ao gerar PIN. Tente novamente.');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Não foi possível gerar o PIN. Verifique se você tem permissões de administrador.');
      console.error('Erro ao gerar PIN:', error);
    }
  };

  const handleCopiarPin = () => {
    if (pinAtual) {
      navigator.clipboard.writeText(pinAtual.codigo);
      setCopiado(true);
      toast.success('PIN copiado para a área de transferência!');
      
      // Mostrar mensagem com instruções
      toast('Compartilhe este PIN com os membros que deseja convidar', {
        duration: 4000,
      });
      
      setTimeout(() => setCopiado(false), 2000);
    } else {
      toast.error('Nenhum PIN gerado para copiar. Gere um novo PIN primeiro.');
    }
  };

  const handleCompartilharWhatsapp = () => {
    if (pinAtual) {
      const dataExpiracao = new Date(pinAtual.dataExpiracao);
      const mensagem = `Olá! Você foi convidado para participar do ministério ${ministerio}.\nUse este PIN para se cadastrar: ${pinAtual.codigo}\nEste PIN expira em ${formatarData(dataExpiracao)}`;
      const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
      window.open(url, '_blank');
    }
  };

  const formatarData = (data: Date) => {
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusPin = (pin: MinisterioPin) => {
    if (pin.usado) return 'Usado';
    if (new Date(pin.dataExpiracao) < new Date()) return 'Expirado';
    return 'Ativo';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerar PIN de Convite</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Ministério</label>
            <Input value={ministerio} disabled className="mt-1" />
          </div>

          {pinAtual ? (
            <div>
              <label className="text-sm font-medium">PIN de Convite</label>
              <div className="flex gap-2 mt-1">
                <Input value={pinAtual.codigo} disabled className="font-mono text-lg tracking-widest" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopiarPin}
                  className="flex-shrink-0"
                >
                  {copiado ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Expira em {formatarData(new Date(pinAtual.dataExpiracao))}</span>
              </div>
            </div>
          ) : (
            <Button onClick={criarNovoPin} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Gerar Novo PIN
            </Button>
          )}

          <div className="text-sm text-muted-foreground">
            Compartilhe este PIN com o novo membro para que ele possa se cadastrar no ministério.
            O PIN tem validade de 24 horas.
          </div>

          {/* Histórico de PINs */}
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">PINs Gerados</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {pins.length > 0 ? (
                pins.map((pin, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-md border">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{pin.codigo}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatarData(new Date(pin.dataCriacao))}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      getStatusPin(pin) === 'Ativo' 
                        ? 'bg-green-100 text-green-800'
                        : getStatusPin(pin) === 'Expirado'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {getStatusPin(pin)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-2 text-sm text-muted-foreground">
                  Nenhum PIN gerado ainda.
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {pinAtual && (
            <Button onClick={handleCompartilharWhatsapp} className="gap-2">
              <Share2 className="h-4 w-4" />
              Compartilhar no WhatsApp
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GerarPinModal; 