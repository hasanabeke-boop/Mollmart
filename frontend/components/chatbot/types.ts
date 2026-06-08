export type ChatbotReply = {
  reply: string;
  intent: string;
  suggestions: string[];
  suggestedRoute?: string;
  actions?: string[];
  confidence?: number;
  source?: "gemini" | "openai" | "local";
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  suggestedRoute?: string;
  actions?: string[];
  source?: "gemini" | "openai" | "local";
  intent?: string;
  confidence?: number;
};

export type ChatbotHistoryItem = {
  role: ChatMessage["role"];
  content: string;
  intent?: string;
  suggestedRoute?: string;
};
