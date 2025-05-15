import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { message } = await req.json()

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: message }],
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    console.log('DEBUG raw data:', data)

    if (data?.choices?.[0]?.message?.content) {
      return NextResponse.json({ reply: data.choices[0].message.content })
    } else {
      return NextResponse.json({ reply: JSON.stringify(data) }) // Return raw data for debugging
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ reply: 'OpenAI API call failed.' })
  }
}
