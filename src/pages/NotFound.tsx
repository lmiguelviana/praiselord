import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl mb-8">Página não encontrada</p>
        <Link to="/" className="text-primary hover:underline">
          Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
