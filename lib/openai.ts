// lib/openai.ts
export async function getLLMResponse(userInput: string): Promise<string> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userInput }),
    })
  
    if (!res.ok) throw new Error('Failed to get response from LLM')
    const data = await res.json()
    return data.reply
  }
  