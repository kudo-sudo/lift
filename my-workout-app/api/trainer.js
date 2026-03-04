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
    const { records, exerciseName, targetWeight } = req.body

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

次回提案は以下ルールを厳守して組み立てます。

1) 推定1RM（Epley）
1RM = weight * (1 + reps / 30)

2) 3レイヤー構造
A. トップ（神経系）: 92〜95%, 1〜2回, 2〜3セット
B. メイン（筋力）: 85〜88%, 2〜4回, 3セット
C. ボリューム（筋肥大）: 75〜80%, 5回前後, 3セット

3) 進歩ロジック
2回連続成功なら +2.5kg
2回連続失敗なら -2.5kg
それ以外は維持
（連続成功/失敗でない場合、トップセットは直近トップ重量を下回らない）

4) 安全ロジック
合計ボリューム(重量*回数*セット)は前回の120%以内
疲労が高い日はトップセットを削る
フォーム崩れ(浅い等)は重量据え置き

5) プレート効率化
利用可能プレート: 1.25, 2.5, 5, 10, 20kg（バー20kg）
セット間のプレート付け外し回数が少ない重量を優先

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
目標重量：${Number.isFinite(Number(targetWeight)) ? `${Number(targetWeight)}kg` : '未設定'}
過去の記録：
${JSON.stringify(records.slice(0, 5), null, 2)}

上記の記録から、次回のトレーニングで試すべき重量、回数、セット数を提案してください。
推定1RMと%1RM、3レイヤー構造、進歩ロジック、安全ロジックを必ず使ってください。
目標重量が設定されている場合は、今どれくらいの立ち位置か（推定1RMベース）をreasoningに必ず含めてください。
【重要】セット間でプレート（1.25,2.5,5,10,20kg）の付け外し回数が最小になるよう選んでください。
【重要】nextWeight/nextReps/nextSets は planSets の中で最重量セットを返してください。
shortMessageは2行。planSetsは以下の3グループを必ず含めてください：
"① アップ" - 神経系ウォームアップ（軽め、1〜3回、1〜3セット）
"② メイン" - メインセット（目標重量付近、3〜5回、3〜5セット）
"③ 補助" - ボリュームセット（軽め、6〜10回、2〜3セット。①アップと同じ重量でも可）`,
          },
        ],
        temperature: 0,
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
