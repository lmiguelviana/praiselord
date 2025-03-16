interface Env {
  GOOGLE_API_KEY: string;
  GOOGLE_CSE_ID: string;
}

// Carrega as variáveis de ambiente
export const env: Env = {
  GOOGLE_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
  GOOGLE_CSE_ID: process.env.NEXT_PUBLIC_GOOGLE_CSE_ID || '',
}; 