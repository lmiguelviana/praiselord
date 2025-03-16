import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuração do Firebase para o seu projeto
// Essas informações são públicas e podem ser incluídas no código
const firebaseConfig = {
  apiKey: "AIzaSyBeriGtVYXG20B6UXMQ4-FZrRF80OgxEck", // Estou usando a chave do YouTube como exemplo
  authDomain: "praiseapp-db.firebaseapp.com",
  projectId: "praiseapp-db",
  storageBucket: "praiseapp-db.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);

// Inicializar o Firestore
const db = getFirestore(app);

export { db }; 