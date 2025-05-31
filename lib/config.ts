// API Configuration
export const API_CONFIG = {
  backend: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    endpoints: {
      chat: '/api/chat',
    },
  },
  llm: {
    providers: {
      openai: {
        baseUrl: 'https://api.openai.com/v1',
        endpoints: {
          chat: '/chat/completions',
        },
      },
      anthropic: {
        baseUrl: 'https://api.anthropic.com/v1',
        endpoints: {
          chat: '/messages',
        },
      },
      meta: {
        baseUrl: 'https://api-inference.huggingface.co/models',
      },
      google: {
        baseUrl: 'https://api.google.ai/gemini/v1',
        endpoints: {
          chat: '/chat',
        },
      },
    },
  },
} as const;

// LLM Character Mappings
export const LLM_MAPPINGS = {
  "sarah": {
    provider: "openai",
    model: "gpt-4-turbo-preview",
    displayName: "Sarah",
    description: "A friendly and knowledgeable AI assistant",
  },
  "peter": {
    provider: "anthropic",
    model: "claude-3-opus-20240229",
    displayName: "Peter",
    description: "A helpful and analytical AI assistant",
  },
  "james": {
    provider: "meta",
    model: "meta-llama/Llama-3-70b-chat-hf",
    displayName: "James",
    description: "A creative and insightful AI assistant",
  },
  "emily": {
    provider: "google",
    model: "gemini-1.5-pro",
    displayName: "Emily",
    description: "A versatile and adaptive AI assistant",
  },
} as const;

// Available LLM Models for Researcher Interface
export const AVAILABLE_LLMS = [
  { value: "gpt-4-turbo-preview", label: "GPT-4 Turbo", provider: "openai" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", provider: "openai" },
  { value: "claude-3-opus-20240229", label: "Claude 3 Opus", provider: "anthropic" },
  { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet", provider: "anthropic" },
  { value: "meta-llama/Llama-3-70b-chat-hf", label: "Llama 3 (70B)", provider: "meta" },
  { value: "mistral-large", label: "Mistral Large", provider: "meta" },
  { value: "gemini-1.5-pro", label: "Gemini Pro", provider: "google" },
] as const;

// Environment Variables Type
export type EnvVars = {
  NEXT_PUBLIC_API_URL?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  HF_API_KEY?: string;
  GEMINI_API_KEY?: string;
};

// Helper function to get API URL
export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.backend.baseUrl}${endpoint}`;
};

// Helper function to get LLM provider URL
export const getLLMProviderUrl = (provider: keyof typeof API_CONFIG.llm.providers, endpoint?: string) => {
  const providerConfig = API_CONFIG.llm.providers[provider];
  if (!endpoint) return providerConfig.baseUrl;
  return `${providerConfig.baseUrl}${endpoint}`;
}; 