import { create } from 'zustand';

export interface ChatMsg { id: number; role: 'user' | 'ia'; text: string; at: number }

let nextId = 1;

interface ChatState {
  messages: ChatMsg[];
  push: (role: ChatMsg['role'], text: string) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [{
    id: 0, role: 'ia', at: Date.now(),
    text: '¡Hola! Soy tu tutor de trigonometría. Prueba: «dibuja un triángulo de 45°», «¿qué es la hipotenusa?», «¿por qué suman 180°?», «tangente»…',
  }],
  push: (role, text) => set((s) => ({ messages: [...s.messages, { id: nextId++, role, text, at: Date.now() }] })),
}));