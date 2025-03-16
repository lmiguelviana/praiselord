import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Lock, 
  Globe, 
  Palette,
  Save,
  Edit,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from '@/components/ThemeProvider';

const Configuracoes = () => {
  const { theme, setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [configuracoes, setConfiguracoes] = useState({
    notificacoes: {
      email: true,
      push: true,
      whatsapp: false
    },
    privacidade: {
      perfilPublico: true,
      mostrarEmail: false,
      mostrarTelefone: false
    },
    idioma: 'pt-BR',
    fusoHorario: 'America/Sao_Paulo'
  });

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Personalize sua experiência no PraiseLord</p>
        </div>
        <Button 
          variant={isEditing ? "default" : "outline"}
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="gap-2"
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4" />
              Salvar Alterações
            </>
          ) : (
            <>
              <Edit className="h-4 w-4" />
              Editar Configurações
            </>
          )}
        </Button>
      </div>

      {/* Aparência */}
          <Card>
            <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Aparência
          </CardTitle>
              <CardDescription>
            Personalize a aparência do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
            <Label>Tema</Label>
            <Select 
              value={theme}
              onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o tema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light" className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <span>Claro</span>
                </SelectItem>
                <SelectItem value="dark" className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <span>Escuro</span>
                </SelectItem>
                <SelectItem value="system" className="flex items-center gap-2">
                  <Laptop className="h-4 w-4" />
                  <span>Sistema</span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Escolha entre tema claro, escuro ou siga as preferências do seu sistema
            </p>
              </div>
            </CardContent>
          </Card>

      {/* Notificações */}
          <Card>
            <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
              <CardDescription>
            Configure como você quer receber notificações
              </CardDescription>
            </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">
                Receba atualizações importantes por email
              </p>
            </div>
            <Switch 
              checked={configuracoes.notificacoes.email}
              onCheckedChange={(checked) => 
                setConfiguracoes({
                  ...configuracoes,
                  notificacoes: {
                    ...configuracoes.notificacoes,
                    email: checked
                  }
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações no navegador
              </p>
            </div>
            <Switch 
              checked={configuracoes.notificacoes.push}
              onCheckedChange={(checked) => 
                setConfiguracoes({
                  ...configuracoes,
                  notificacoes: {
                    ...configuracoes.notificacoes,
                    push: checked
                  }
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações WhatsApp</Label>
              <p className="text-sm text-muted-foreground">
                Receba lembretes via WhatsApp
              </p>
            </div>
            <Switch 
              checked={configuracoes.notificacoes.whatsapp}
              onCheckedChange={(checked) => 
                setConfiguracoes({
                  ...configuracoes,
                  notificacoes: {
                    ...configuracoes.notificacoes,
                    whatsapp: checked
                  }
                })
              }
            />
          </div>
            </CardContent>
          </Card>

      {/* Privacidade */}
          <Card>
            <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Privacidade
          </CardTitle>
              <CardDescription>
            Controle o que outras pessoas podem ver
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
              <Label>Perfil Público</Label>
                    <p className="text-sm text-muted-foreground">
                Permite que outros usuários vejam seu perfil
                    </p>
                  </div>
            <Switch 
              checked={configuracoes.privacidade.perfilPublico}
              onCheckedChange={(checked) => 
                setConfiguracoes({
                  ...configuracoes,
                  privacidade: {
                    ...configuracoes.privacidade,
                    perfilPublico: checked
                  }
                })
              }
            />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
              <Label>Mostrar Email</Label>
                    <p className="text-sm text-muted-foreground">
                Exibe seu email no perfil
                    </p>
                  </div>
            <Switch 
              checked={configuracoes.privacidade.mostrarEmail}
              onCheckedChange={(checked) => 
                setConfiguracoes({
                  ...configuracoes,
                  privacidade: {
                    ...configuracoes.privacidade,
                    mostrarEmail: checked
                  }
                })
              }
            />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
              <Label>Mostrar Telefone</Label>
                    <p className="text-sm text-muted-foreground">
                Exibe seu telefone no perfil
                    </p>
                  </div>
            <Switch 
              checked={configuracoes.privacidade.mostrarTelefone}
              onCheckedChange={(checked) => 
                setConfiguracoes({
                  ...configuracoes,
                  privacidade: {
                    ...configuracoes.privacidade,
                    mostrarTelefone: checked
                  }
                })
              }
            />
                </div>
        </CardContent>
      </Card>

      {/* Preferências */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Preferências
          </CardTitle>
          <CardDescription>
            Personalize sua experiência
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select 
              value={configuracoes.idioma}
              onValueChange={(value) => 
                setConfiguracoes({
                  ...configuracoes,
                  idioma: value
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
                  </div>
          <div className="space-y-2">
            <Label>Fuso Horário</Label>
            <Select 
              value={configuracoes.fusoHorario}
              onValueChange={(value) => 
                setConfiguracoes({
                  ...configuracoes,
                  fusoHorario: value
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fuso horário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                <SelectItem value="America/Belem">Belém (GMT-3)</SelectItem>
              </SelectContent>
            </Select>
              </div>
            </CardContent>
          </Card>
    </div>
  );
};

export default Configuracoes;
