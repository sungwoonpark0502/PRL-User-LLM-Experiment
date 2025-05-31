import { NextRequest, NextResponse } from 'next/server'
import { getApiUrl } from '@/lib/config'

// Define the backend URL
// const BACKEND_URL = "http://localhost:3000";

// Central nickname → provider, model, env key mapping
// This mapping might still be useful for other purposes or could be removed if the backend handles all mapping
// const llmMap = {
//   Sarah: { provider: 'openai', model: 'gpt-4o', keyEnv: 'OPENAI_API_KEY' },
//   Peter: { provider: 'openai', model: 'gpt-3.5-turbo', keyEnv: 'OPENAI_API_KEY' },
//   James: { provider: 'meta', model: 'meta-llama/Llama-3-70b-chat-hf', keyEnv: 'HF_API_KEY' },
//   Emily: { provider: 'google', model: 'gemini-1.5-pro', keyEnv: 'GEMINI_API_KEY' },
// }

export async function POST(req: NextRequest) {
  try {
    const { nickname, messages } = await req.json();

    // Call the local backend API using the configured URL
    const backendResponse = await fetch(getApiUrl('/api/chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nickname, messages }),
    });

    if (!backendResponse.ok) {
      // Handle backend errors
      const errorData = await backendResponse.json();
      console.error('Backend API error:', backendResponse.status, errorData);
      return NextResponse.json({ error: errorData.detail || 'Backend error' }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    console.log('Backend response:', data);

    return NextResponse.json({ response: data.response });
  } catch (error) {
    console.error('Frontend API route error:', error);
    return NextResponse.json({ error: 'Failed to communicate with backend LLM service.' }, { status: 500 });
  }
}
