import { NextRequest, NextResponse } from 'next/server'

// Central nickname → provider, model, env key mapping
const llmMap = {
  Sarah: { provider: 'openai', model: 'gpt-4o', keyEnv: 'OPENAI_API_KEY' },
  Peter: { provider: 'openai', model: 'gpt-3.5-turbo', keyEnv: 'OPENAI_API_KEY' },
  James: { provider: 'meta', model: 'meta-llama/Llama-3-70b-chat-hf', keyEnv: 'HF_API_KEY' },
  Emily: { provider: 'google', model: 'gemini-1.5-pro', keyEnv: 'GEMINI_API_KEY' },
}

export async function POST(req: NextRequest) {
  const { nickname, message } = await req.json()

  const llmInfo = llmMap[nickname]

  if (!llmInfo) {
    return NextResponse.json({ reply: `Unknown LLM nickname: ${nickname}` })
  }

  const apiKey = process.env[llmInfo.keyEnv as keyof typeof process.env]

  if (!apiKey) {
    return NextResponse.json({ reply: `API Key not configured for nickname: ${nickname}` })
  }

  try {
    let reply = 'Default fallback reply.'

    if (llmInfo.provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: llmInfo.model,
          messages: [{ role: 'user', content: message }],
          temperature: 0.7,
        }),
      })

      const data = await response.json()
      console.log('OpenAI response:', data)
      reply = data.choices?.[0]?.message?.content || JSON.stringify(data)
    }

    if (llmInfo.provider === 'meta') {
      const response = await fetch(`https://api-inference.huggingface.co/models/${llmInfo.model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: message }),
      })

      const data = await response.json()
      console.log('Meta LLaMA response:', data)
      reply = data?.[0]?.generated_text || JSON.stringify(data)
    }

    if (llmInfo.provider === 'google') {
      // Example Gemini (replace with actual Google Gemini endpoint and format)
      const response = await fetch('https://api.google.ai/gemini/v1/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: llmInfo.model,
          messages: [{ role: 'user', content: message }],
        }),
      })

      const data = await response.json()
      console.log('Gemini Pro response:', data)
      reply = data.candidates?.[0]?.content || JSON.stringify(data)
    }

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('API call error:', error)
    return NextResponse.json({ reply: 'LLM API call failed.' })
  }
}
