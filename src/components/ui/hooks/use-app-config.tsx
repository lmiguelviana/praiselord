/**
 * use-app-config.tsx
 * 
 * Hook personalizado para utilizar e reagir às mudanças na configuração do aplicativo.
 * Permite que componentes acessem as configurações personalizadas e se atualizem
 * automaticamente quando essas configurações são alteradas.
 */

import { useState, useEffect } from 'react';
import { 
  AppConfig, 
  defaultConfig, 
  loadConfig,
  CONFIG_STORAGE_KEY
} from '@/lib/app-config';

/**
 * Hook para acessar as configurações do aplicativo e reagir às mudanças.
 * @returns As configurações atuais do aplicativo
 */
export function useAppConfig(): AppConfig {
  const [config, setConfig] = useState<AppConfig>(loadConfig());

  useEffect(() => {
    // Função para carregar as configurações
    const loadCurrentConfig = () => {
      try {
        const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (savedConfig) {
          setConfig(JSON.parse(savedConfig));
        } else {
          setConfig(defaultConfig);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        setConfig(defaultConfig);
      }
    };

    // Carregar as configurações iniciais
    loadCurrentConfig();

    // Adicionar um listener para eventos de atualização de configuração
    const handleConfigUpdate = () => {
      loadCurrentConfig();
    };

    window.addEventListener('app-config-updated', handleConfigUpdate);
    window.addEventListener('storage', (event) => {
      if (event.key === CONFIG_STORAGE_KEY) {
        handleConfigUpdate();
      }
    });

    // Limpar o listener quando o componente for desmontado
    return () => {
      window.removeEventListener('app-config-updated', handleConfigUpdate);
      window.removeEventListener('storage', handleConfigUpdate);
    };
  }, []);

  return config;
}

/**
 * Hook para acessar uma seção específica das configurações do aplicativo.
 * @param section A seção das configurações que deseja acessar
 * @returns A seção específica das configurações
 */
export function useAppConfigSection<K extends keyof AppConfig>(section: K): AppConfig[K] {
  const config = useAppConfig();
  return config[section];
}

/**
 * Hook para acessar um valor específico das configurações do aplicativo.
 * @param section A seção das configurações
 * @param key A chave do valor que deseja acessar
 * @returns O valor específico das configurações
 */
export function useAppConfigValue<K extends keyof AppConfig, S extends keyof AppConfig[K]>(
  section: K,
  key: S
): AppConfig[K][S] {
  const sectionConfig = useAppConfigSection(section);
  return sectionConfig[key];
}

export default useAppConfig; 