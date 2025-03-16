import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import LocalDatabaseService from './lib/local-database'

// Inicializar o banco de dados antes de renderizar a aplicação
LocalDatabaseService.initializeDatabase();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
