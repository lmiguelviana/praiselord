/**
 * app-config.ts
 * 
 * Biblioteca para gerenciar as configurações personalizáveis do aplicativo.
 * Fornece funções para carregar, salvar e acessar configurações como logos,
 * textos e cores que podem ser personalizados pelo desenvolvedor.
 */

// Interface para as configurações do aplicativo
export interface AppConfig {
  logos: {
    mainLogo: string;     // URL ou base64 do logo principal
    loginLogo: string;    // URL ou base64 do logo da tela de login
    favicon: string;      // URL ou base64 do favicon
  };
  texts: {
    appName: string;      // Nome do aplicativo
    appDescription: string; // Descrição curta do aplicativo
    loginWelcome: string; // Texto de boas-vindas na tela de login
    footerText: string;   // Texto do rodapé
  };
  colors: {
    primary: string;      // Cor primária (botões, links)
    accent: string;       // Cor de destaque 
    background: string;   // Cor de fundo
  };
  system: {
    version: string;     // Versão do app
    lastUpdate: string;  // Data da última atualização
  };
}

// Configurações padrão do aplicativo
export const defaultConfig: AppConfig = {
  logos: {
    mainLogo: '/logo.png',
    loginLogo: '/logo-login.png',
    favicon: '/favicon.ico',
  },
  texts: {
    appName: 'PraiseLord',
    appDescription: 'Gerencie seu ministério de música com facilidade',
    loginWelcome: 'Bem-vindo ao PraiseLord',
    footerText: '© PraiseLord 2023',
  },
  colors: {
    primary: '#4f46e5',
    accent: '#818cf8',
    background: '#ffffff',
  },
  system: {
    version: '1.0.0',
    lastUpdate: new Date().toISOString(),
  }
};

// Chave para armazenar as configurações no localStorage
export const CONFIG_STORAGE_KEY = 'praiselord-custom-config';

/**
 * Carrega as configurações do localStorage
 * @returns As configurações personalizadas ou as configurações padrão
 */
export function loadConfig(): AppConfig {
  try {
    const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
  }
  return defaultConfig;
}

/**
 * Salva as configurações no localStorage
 * @param config As configurações a serem salvas
 * @returns true se as configurações foram salvas com sucesso, false caso contrário
 */
export function saveConfig(config: AppConfig): boolean {
  try {
    // Atualizar data da última atualização
    const updatedConfig = {
      ...config,
      system: {
        ...config.system,
        lastUpdate: new Date().toISOString()
      }
    };
    
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updatedConfig));
    
    // Disparar evento para notificar outros componentes
    window.dispatchEvent(new Event('app-config-updated'));
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    return false;
  }
}

/**
 * Reseta as configurações para o padrão
 * @returns true se as configurações foram resetadas com sucesso, false caso contrário
 */
export function resetConfig(): boolean {
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
    
    // Disparar evento para notificar outros componentes
    window.dispatchEvent(new Event('app-config-updated'));
    
    return true;
  } catch (error) {
    console.error('Erro ao resetar configurações:', error);
    return false;
  }
}

/**
 * Hook para utilizar e reagir a alterações nas configurações do aplicativo 
 */
export function useAppConfig(): AppConfig {
  return loadConfig();
}

/**
 * Hook para utilizar uma seção específica das configurações
 * @param section Seção das configurações a ser utilizada
 * @returns A seção específica das configurações
 */
export function getConfigSection<K extends keyof AppConfig>(section: K): AppConfig[K] {
  const config = loadConfig();
  return config[section];
}

/**
 * Obtém um valor específico das configurações
 * @param section Seção das configurações
 * @param key Chave do valor a ser obtido
 * @returns O valor específico das configurações
 */
export function getConfigValue<K extends keyof AppConfig, S extends keyof AppConfig[K]>(
  section: K,
  key: S
): AppConfig[K][S] {
  const config = loadConfig();
  return config[section][key];
}

// Exportar uma instância para uso fácil
export const AppConfigService = {
  loadConfig,
  saveConfig,
  resetConfig,
  getConfigSection,
  getConfigValue,
  defaultConfig,
};

export default AppConfigService; 