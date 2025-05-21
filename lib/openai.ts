export async function getLLMResponse(userInput: string, nickname: string): Promise<string> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, message: userInput }),
    })
  
    if (!res.ok) throw new Error('Failed to get response from backend')
    const data = await res.json()
    return data.reply
  }
  