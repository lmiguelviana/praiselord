/**
 * DevPersonalizacao.tsx
 * 
 * Página de personalização do aplicativo para desenvolvedores.
 * Permite configurar:
 * - Logotipos do aplicativo
 * - Textos e descrições
 * - Cores e aparência
 * 
 * As configurações são salvas no localStorage e aplicadas em todo o app.
 */

import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Separator } from '@/components/ui/separator';
import { Info, Save, RefreshCw, Image, Type, Palette, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AppConfig, defaultConfig, saveConfig, resetConfig } from '@/lib/app-config';
import { checkDevAccess } from '@/lib/dev-auth';

// Chave para armazenar no localStorage
const LOCAL_STORAGE_KEY = 'praiselord-custom-config';

const DevPersonalizacao: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  
  // Verificar acesso - apenas para o usuário autorizado
  useEffect(() => {
    const isAuthorized = checkDevAccess();
    setIsAdmin(isAuthorized);
  }, []);
  
  // Carregar configurações do localStorage ou usar o padrão
  useEffect(() => {
    const loadConfig = () => {
      try {
        const savedConfig = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedConfig) {
          setConfig(JSON.parse(savedConfig));
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar as configurações personalizadas.",
        });
      }
    };
    
    loadConfig();
  }, [toast]);
  
  // Salvar configurações no localStorage
  const handleSaveConfig = () => {
    const success = saveConfig(config);
    
    if (success) {
      toast({
        title: "Configurações salvas",
        description: "As alterações foram aplicadas com sucesso.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
      });
    }
  };
  
  // Resetar para as configurações padrão
  const handleResetConfig = () => {
    if (window.confirm('Deseja realmente resetar todas as configurações para o padrão?')) {
      setConfig(defaultConfig);
      const success = resetConfig();
      
      if (success) {
        toast({
          title: "Configurações resetadas",
          description: "Todas as configurações foram restauradas para o padrão.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível resetar as configurações.",
        });
      }
    }
  };
  
  // Verificar acesso
  if (!isAdmin) {
    return (
      <div className="container max-w-5xl py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Esta página só está disponível para administradores.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Manipular mudanças nos campos de texto
  const handleTextChange = (
    category: keyof AppConfig,
    field: string,
    value: string
  ) => {
    setConfig({
      ...config,
      [category]: {
        ...config[category as keyof AppConfig],
        [field]: value,
      },
    });
  };

  return (
    <div className="container max-w-5xl py-10">
      <h1 className="text-3xl font-bold mb-2">Personalização do Aplicativo</h1>
      <p className="text-muted-foreground mb-6">
        Configure a aparência e textos do aplicativo. Todas as alterações são salvas localmente.
      </p>
      
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Modo desenvolvedor</AlertTitle>
        <AlertDescription>
          As alterações feitas aqui serão aplicadas apenas para esta instalação e salvas no navegador local.
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="logos" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="logos">
            <Image className="h-4 w-4 mr-2" />
            Logotipos
          </TabsTrigger>
          <TabsTrigger value="texts">
            <Type className="h-4 w-4 mr-2" />
            Textos
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Cores
          </TabsTrigger>
        </TabsList>
        
        {/* Aba de Logotipos */}
        <TabsContent value="logos">
          <Card>
            <CardHeader>
              <CardTitle>Logotipos do Aplicativo</CardTitle>
              <CardDescription>
                Configure os logotipos exibidos em diferentes áreas do aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="mainLogo">Logo Principal</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      id="mainLogo"
                      placeholder="URL ou caminho do logo"
                      value={config.logos.mainLogo}
                      onChange={(e) => handleTextChange('logos', 'mainLogo', e.target.value)}
                    />
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                        onClick={() => document.getElementById('mainLogoUpload')?.click()}
                      >
                        <Image className="h-3 w-3 mr-1" />
                        Upload
                      </Button>
                      <input
                        id="mainLogoUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64 = reader.result as string;
                              handleTextChange('logos', 'mainLogo', base64);
                              toast({
                                title: "Logo carregado",
                                description: `Imagem "${file.name}" carregada com sucesso.`,
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Exibido no cabeçalho e em várias telas do aplicativo
                    </p>
                  </div>
                  <div className="bg-muted p-4 rounded-md flex items-center justify-center">
                    <img 
                      src={config.logos.mainLogo} 
                      alt="Logo Principal" 
                      className="max-h-16"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                        (e.target as HTMLImageElement).className = 'max-h-16 opacity-30';
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="loginLogo">Logo da Tela de Login</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      id="loginLogo"
                      placeholder="URL ou caminho do logo de login"
                      value={config.logos.loginLogo}
                      onChange={(e) => handleTextChange('logos', 'loginLogo', e.target.value)}
                    />
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                        onClick={() => document.getElementById('loginLogoUpload')?.click()}
                      >
                        <Image className="h-3 w-3 mr-1" />
                        Upload
                      </Button>
                      <input
                        id="loginLogoUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64 = reader.result as string;
                              handleTextChange('logos', 'loginLogo', base64);
                              toast({
                                title: "Logo carregado",
                                description: `Imagem "${file.name}" carregada com sucesso.`,
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Exibido na tela de login e autenticação
                    </p>
                  </div>
                  <div className="bg-muted p-4 rounded-md flex items-center justify-center">
                    <img 
                      src={config.logos.loginLogo} 
                      alt="Logo de Login" 
                      className="max-h-16"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                        (e.target as HTMLImageElement).className = 'max-h-16 opacity-30';
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="favicon">Favicon</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input
                      id="favicon"
                      placeholder="URL ou caminho do favicon"
                      value={config.logos.favicon}
                      onChange={(e) => handleTextChange('logos', 'favicon', e.target.value)}
                    />
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                        onClick={() => document.getElementById('faviconUpload')?.click()}
                      >
                        <Image className="h-3 w-3 mr-1" />
                        Upload
                      </Button>
                      <input
                        id="faviconUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const base64 = reader.result as string;
                              handleTextChange('logos', 'favicon', base64);
                              toast({
                                title: "Favicon carregado",
                                description: `Imagem "${file.name}" carregada com sucesso.`,
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ícone exibido na aba do navegador
                    </p>
                  </div>
                  <div className="bg-muted p-4 rounded-md flex items-center justify-center">
                    <img 
                      src={config.logos.favicon} 
                      alt="Favicon" 
                      className="max-h-8"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                        (e.target as HTMLImageElement).className = 'max-h-8 opacity-30';
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba de Textos */}
        <TabsContent value="texts">
          <Card>
            <CardHeader>
              <CardTitle>Textos e Descrições</CardTitle>
              <CardDescription>
                Personalize os textos exibidos nas diferentes áreas do aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appName">Nome do Aplicativo</Label>
                <Input
                  id="appName"
                  placeholder="Nome do aplicativo"
                  value={config.texts.appName}
                  onChange={(e) => handleTextChange('texts', 'appName', e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Exibido no cabeçalho, título da página e vários componentes
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="appDescription">Descrição do Aplicativo</Label>
                <Textarea
                  id="appDescription"
                  placeholder="Uma breve descrição do aplicativo"
                  value={config.texts.appDescription}
                  onChange={(e) => handleTextChange('texts', 'appDescription', e.target.value)}
                  rows={2}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Exibido na tela de login e nas meta tags da página
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="loginWelcome">Mensagem de Boas-vindas</Label>
                <Textarea
                  id="loginWelcome"
                  placeholder="Mensagem de boas-vindas na tela de login"
                  value={config.texts.loginWelcome}
                  onChange={(e) => handleTextChange('texts', 'loginWelcome', e.target.value)}
                  rows={2}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Exibido na tela de login para dar boas-vindas aos usuários
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="footerText">Texto do Rodapé</Label>
                <Input
                  id="footerText"
                  placeholder="Texto exibido no rodapé"
                  value={config.texts.footerText}
                  onChange={(e) => handleTextChange('texts', 'footerText', e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Exibido no rodapé de todas as páginas
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba de Cores */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Cores e Aparência</CardTitle>
              <CardDescription>
                Personalize o esquema de cores do aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="primary">Cor Primária</Label>
                <div className="flex gap-4 items-center">
                  <Input
                    id="primary"
                    type="color"
                    value={config.colors.primary}
                    onChange={(e) => handleTextChange('colors', 'primary', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={config.colors.primary}
                    onChange={(e) => handleTextChange('colors', 'primary', e.target.value)}
                    placeholder="#000000"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Utilizada em botões, links e elementos principais
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="accent">Cor de Destaque</Label>
                <div className="flex gap-4 items-center">
                  <Input
                    id="accent"
                    type="color"
                    value={config.colors.accent}
                    onChange={(e) => handleTextChange('colors', 'accent', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={config.colors.accent}
                    onChange={(e) => handleTextChange('colors', 'accent', e.target.value)}
                    placeholder="#000000"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Utilizada para destacar elementos e criar contraste
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="background">Cor de Fundo</Label>
                <div className="flex gap-4 items-center">
                  <Input
                    id="background"
                    type="color"
                    value={config.colors.background}
                    onChange={(e) => handleTextChange('colors', 'background', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={config.colors.background}
                    onChange={(e) => handleTextChange('colors', 'background', e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Cor de fundo principal para telas com tema claro
                </p>
              </div>
              
              <Separator />
              
              <div className="p-4 rounded-md bg-muted">
                <h3 className="font-medium mb-2">Pré-visualização</h3>
                <div className="flex flex-wrap gap-4">
                  <div 
                    className="w-20 h-20 rounded-md flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: config.colors.primary }}
                  >
                    Primária
                  </div>
                  <div 
                    className="w-20 h-20 rounded-md flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: config.colors.accent }}
                  >
                    Destaque
                  </div>
                  <div 
                    className="w-20 h-20 rounded-md flex items-center justify-center border shadow-sm"
                    style={{ backgroundColor: config.colors.background }}
                  >
                    Fundo
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 flex justify-between">
        <Button onClick={handleResetConfig} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Resetar para Padrão
        </Button>
        
        <Button onClick={handleSaveConfig}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>
      
      <div className="mt-8 text-sm text-muted-foreground">
        <p>Versão: {config.system.version}</p>
        <p>Última atualização: {new Date(config.system.lastUpdate).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default DevPersonalizacao; 