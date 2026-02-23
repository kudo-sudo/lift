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

次回提案は以下のロジックを優先して組み立てます。

1) 強度（%1RM）
推定1RMは直近の記録から算出します。
推定式の例: 1RM ≒ weight * (1 + reps / 30)
目安:
- 90%: MAX練習
- 85%: 神経系
- 80%: 筋力の土台
- 70%: ボリューム

2) レップ数の意味
- 1〜2回: 神経系
- 3〜5回: 筋力メイン
- 6〜10回: 筋肥大

3) 総ボリューム（重量×回数×セット）
重さを上げた日はボリュームを少し抑える。
急なボリューム増加は避ける。

4) プレート効率化
利用可能なプレート: 1.25, 2.5, 5, 10, 20 kg
バーの重量: 20kg
セット間でプレートの付け外し回数が少なくなるよう、重量を選んでください。
例: メイン70kg→①アップ60kg (プレート付替最小), ③補助50kg (プレート操作最小)
③補助の重量は① アップと同じでも構いません。

メモ（フォーム、深さ、ポーズ等）があれば理由に短く反映してください。

出力形式：
{
  "shortMessage": ["短い励まし1", "短い励まし2"],
  "planSets": [
    { "title": "① アップ", "weight": 数値（kg）, "reps": 数値（回数）, "sets": 数値（セット数） },
    { "title": "② メイン", "weight": 数値（kg）, "reps": 数値（回数）, "sets": 数値（セット数） },
    { "title": "③ 補助", "weight": 数値（kg）, "reps": 数値（回数）, "sets": 数値（セット数） }
  ],
  "nextWeight": 数値（kg）, 
  "nextReps": 数値（回数）, 
  "nextSets": 数値（セット数）, 
  "reasoning": "提案理由の文章"
}
shortMessageは2行。planSetsは①アップ②メイン③補助の3グループを必ず出す。`,
          },
          {
            role: 'user',
            content: `種目：${exerciseName}
過去の記録：
${JSON.stringify(records.slice(0, 5), null, 2)}

上記の記録から、次回のトレーニングで試すべき重量、回数、セット数を提案してください。
推定1RMと%1RMの考え方、レップ数の役割、ボリューム調整の観点を必ず使ってください。
【重要】セット間でプレート（1.25,2.5,5,10,20kg）の付け外し回数が最小になるよう選んでください。
shortMessageは2行。planSetsは以下の3グループを必ず含めてください：
"① アップ" - 神経系ウォームアップ（軽め、1〜3回、1〜3セット）
"② メイン" - メインセット（目標重量付近、3〜5回、3〜5セット）
"③ 補助" - ボリュームセット（軽め、6〜10回、2〜3セット。①アップと同じ重量でも可）`,
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
        shortMessage: Array.isArray(suggestion.shortMessage)
          ? suggestion.shortMessage
          : [],
        planSets: Array.isArray(suggestion.planSets)
          ? suggestion.planSets
          : [],
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
