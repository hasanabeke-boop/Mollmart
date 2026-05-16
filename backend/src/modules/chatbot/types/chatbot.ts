export interface ChatbotHistoryItem {
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  suggestedRoute?: string;
}

export interface ChatbotMessageInput {
  message: string;
  history?: ChatbotHistoryItem[];
  currentPath?: string;
  userRole?: 'buyer' | 'seller' | 'admin';
  language?: 'en' | 'ru' | 'kk';
}

export interface ChatbotReply {
  reply: string;
  intent: string;
  suggestions: string[];
  source?: 'openai' | 'local';
  suggestedRoute?: string;
  actions?: string[];
  confidence?: number;
}
