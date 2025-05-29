export async function getLLMResponse(userInput: string, nickname: string): Promise<string> {
    const res = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname, message: userInput }),
    })
  
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.detail || 'Failed to get response from backend')
    }
    const data = await res.json()
    return data.reply
  }
  