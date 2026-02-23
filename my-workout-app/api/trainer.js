export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { records, exerciseName } = req.body

    if (!records || !exerciseName) {
      res.status(400).json({ error: 'Missing records or exerciseName' })
      return
    }

    // OpenAI API 呼び出し
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `あなたは筋トレのAIトレーナーです。過去の記録から次回のセット提案をJSON形式で返してください。
出力形式：
{
  "nextWeight": 数値（kg）,
  "nextReps": 数値（回数）,
  "nextSets": 数値（セット数）,
  "reasoning": "提案理由の文章"
}`,
          },
          {
            role: 'user',
            content: `種目：${exerciseName}
過去の記録：
${JSON.stringify(records.slice(0, 5), null, 2)}

上記の記録から、次回のトレーニングで試すべき重量、回数、セット数を提案してください。`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error('OpenAI API Error:', errorData)
      res.status(openaiResponse.status).json({ error: 'OpenAI API error', details: errorData })
      return
    }

    const data = await openaiResponse.json()
    const suggestion = JSON.parse(data.choices[0].message.content)

    res.status(200).json({
      success: true,
      suggestion: {
        exerciseName,
        nextWeight: suggestion.nextWeight,
        nextReps: suggestion.nextReps,
        nextSets: suggestion.nextSets,
        reasoning: suggestion.reasoning,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error in trainer API:', error)
    res.status(500).json({ error: 'Internal server error', message: error.message })
  }
}
