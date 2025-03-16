# Componente TestBusca

Este componente foi criado para demonstrar e testar a funcionalidade de busca intuitiva implementada no PraiseLord.

## Funcionalidades

- **Busca Intuitiva**: Permite buscar músicas usando linguagem natural, sem necessidade de seguir um formato específico.
- **Múltiplas Fontes**: Combina resultados de diferentes fontes (local, Google, análise de texto).
- **Visualização de Confiança**: Exibe a pontuação de confiança para cada resultado.
- **Exemplos Pré-configurados**: Inclui botões com exemplos de consultas para testar rapidamente.

## Como Acessar

O componente TestBusca está disponível na rota `/teste-busca`, mas só é visível quando o modo de desenvolvedor está ativado.

Para ativar o modo de desenvolvedor:
1. Clique no botão "Ativar Modo Desenvolvedor" no rodapé da barra lateral.
2. O item "Teste Busca" aparecerá no menu lateral.
3. Clique neste item para acessar a interface de teste.

## Implementação Técnica

O componente utiliza o `SearchService` para realizar buscas intuitivas, que combina:

1. **Análise de Texto**: Usa expressões regulares para identificar possíveis combinações de artista/música.
2. **Busca no Google**: Utiliza a API Google Custom Search para validar e enriquecer os resultados.
3. **Pontuação de Relevância**: Atribui uma pontuação (0-100) para cada resultado com base na confiança.

## Exemplo de Uso

```tsx
// Em qualquer componente
import { useNavigate } from 'react-router-dom';

const MeuComponente = () => {
  const navigate = useNavigate();
  
  const abrirTesteBusca = () => {
    // Ativar modo desenvolvedor
    localStorage.setItem('devMode', 'true');
    // Navegar para a página de teste
    navigate('/teste-busca');
  };
  
  return (
    <button onClick={abrirTesteBusca}>
      Abrir Teste de Busca
    </button>
  );
};
```

## Notas de Desenvolvimento

Este componente é apenas para fins de teste e desenvolvimento. Em um ambiente de produção, você pode:

1. Remover completamente o componente
2. Ocultar o acesso através da propriedade `devOnly` no menu
3. Integrar a funcionalidade diretamente na interface principal de busca

## Contribuição

Sinta-se à vontade para melhorar este componente adicionando:

- Mais exemplos de consultas
- Visualizações alternativas dos resultados
- Métricas de desempenho da busca
- Comparação com outros algoritmos de busca 