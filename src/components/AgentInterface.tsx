import React, { useState } from 'react';
import './AgentInterface.css';

const AgentInterface: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{text: string, sender: 'user' | 'agent'}>>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Adiciona mensagem do usuário
    const newMessages = [...messages, {text: input, sender: 'user'}];
    setMessages(newMessages);
    
    // Simula resposta do agente (em uma aplicação real, isso seria uma chamada à API)
    setTimeout(() => {
      setMessages([...newMessages, {
        text: `Resposta simulada do agente para: "${input}"`,
        sender: 'agent'
      }]);
    }, 1000);

    setInput('');
  };

  return (
    <div className="agent-interface">
      <div className="chat-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>Envie uma mensagem para começar a conversa com o agente IA.</p>
          </div>
        ) : (
          <div className="messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <div className="message-content">{msg.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="message-input"
        />
        <button type="submit" className="send-button">Enviar</button>
      </form>
    </div>
  );
};

export default AgentInterface; 