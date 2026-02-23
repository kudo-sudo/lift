import { useState, useEffect, useRef } from 'react'
import '../styles/AIChatModal.css'

const AIChatModal = ({
  isOpen,
  onClose,
  onSaveRecord,
  exerciseName: initialExercise,
  workoutRecords,
  aiSupportTargets,
}) => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [stage, setStage] = useState('exercise') // exercise -> weight -> reps -> sets -> confirm -> analysis
  const [recordData, setRecordData] = useState({
    exerciseName: initialExercise || '',
    weight: null,
    reps: null,
    sets: null,
    memo: '',
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      const initialMsg = initialExercise
        ? `🏋️ こんにちは！${initialExercise}の記録を入力しましょう。`
        : `🏋️ こんにちは！今日はどの種目を記録しますか？`

      setMessages([{ role: 'assistant', text: initialMsg }])
      setStage(initialExercise ? 'weight' : 'exercise')
      setRecordData({
        exerciseName: initialExercise || '',
        weight: null,
        reps: null,
        sets: null,
        memo: '',
      })
    }
  }, [isOpen, initialExercise])

  const addMessage = (role, text) => {
    setMessages((prev) => [...prev, { role, text }])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userInput = inputValue.trim()
    addMessage('user', userInput)
    setInputValue('')

    // Simulate AI response delay
    setTimeout(() => {
      handleStageLogic(userInput)
    }, 300)
  }

  const handleStageLogic = (input) => {
    switch (stage) {
      case 'exercise':
        handleExerciseInput(input)
        break
      case 'weight':
        handleWeightInput(input)
        break
      case 'reps':
        handleRepsInput(input)
        break
      case 'sets':
        handleSetsInput(input)
        break
      case 'memo':
        handleMemoInput(input)
        break
      case 'confirm':
        handleConfirm(input)
        break
      default:
        break
    }
  }

  const handleExerciseInput = (input) => {
    const exerciseName = input.trim()
    setRecordData((prev) => ({ ...prev, exerciseName }))
    addMessage('assistant', `✅ 「${exerciseName}」ですね。今回の重量は何kgですか？`)
    setStage('weight')
  }

  const handleWeightInput = (input) => {
    const weight = parseFloat(input)
    if (isNaN(weight) || weight <= 0) {
      addMessage('assistant', '❌ 正しい重量を入力してください（例: 70.5）')
      return
    }
    setRecordData((prev) => ({ ...prev, weight }))
    addMessage('assistant', `✅ ${weight}kg ですね。回数は？`)
    setStage('reps')
  }

  const handleRepsInput = (input) => {
    const reps = parseInt(input)
    if (isNaN(reps) || reps <= 0) {
      addMessage('assistant', '❌ 正しい回数を入力してください（例: 5）')
      return
    }
    setRecordData((prev) => ({ ...prev, reps }))
    addMessage('assistant', `✅ ${reps}回 ですね。セット数は？`)
    setStage('sets')
  }

  const handleSetsInput = (input) => {
    const sets = parseInt(input)
    if (isNaN(sets) || sets <= 0) {
      addMessage('assistant', '❌ 正しいセット数を入力してください（例: 3）')
      return
    }
    setRecordData((prev) => ({ ...prev, sets }))
    addMessage('assistant', `✅ ${sets}セット 了解です。メモはありますか？（なければ「なし」と入力）`)
    setStage('memo')
  }

  const handleMemoInput = (input) => {
    const memo = input.toLowerCase() === 'なし' ? '' : input
    setRecordData((prev) => ({ ...prev, memo }))

    const summary = `
📋 **記録内容**
種目: ${recordData.exerciseName}
重量: ${recordData.weight}kg
回数: ${recordData.reps}回
セット: ${recordData.sets}セット
${memo ? `メモ: ${memo}` : ''}

保存しますか？「はい」または「いいえ」で答えてください。`

    addMessage('assistant', summary)
    setStage('confirm')
  }

  const handleConfirm = async (input) => {
    if (input.toLowerCase().includes('いいえ') || input.toLowerCase().includes('no')) {
      addMessage('assistant', '❌ キャンセルしました。もう一度入力し直してください。')
      resetChat()
      return
    }

    if (!input.toLowerCase().includes('はい') && !input.toLowerCase().includes('yes')) {
      addMessage('assistant', '「はい」または「いいえ」で答えてください。')
      return
    }

    // Save record and analyze
    setIsAnalyzing(true)
    addMessage('assistant', '💡 記録を保存して分析中...')

    try {
      // Save record first
      const now = new Date().toISOString().split('T')[0]
      const newRecord = {
        date: now,
        weight: recordData.weight,
        reps: recordData.reps,
        sets: recordData.sets,
        memo: recordData.memo,
      }

      await onSaveRecord?.(recordData.exerciseName, newRecord)

      // Get AI analysis
      const records = workoutRecords[recordData.exerciseName] || []
      const updatedRecords = [newRecord, ...records]

      const response = await fetch('/api/trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: updatedRecords.slice(0, 5),
          exerciseName: recordData.exerciseName,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const suggestion = data.suggestion
          const analysisMsg = `
✅ **記録完了！**

📊 **AI分析結果**
推定1RM: ${suggestion.nextWeight ? suggestion.nextWeight * 1.3 : 'N/A'}kg

🎯 **次回セット提案**
${suggestion.planSets
  ?.map((s) => `${s.title}: ${s.weight}kg × ${s.reps}回 × ${s.sets}セット`)
  .join('\n')}

💬 ${suggestion.shortMessage?.join('\n') || ''}
`
          addMessage('assistant', analysisMsg)
        }
      }

      setStage('analysis')
      setIsAnalyzing(false)
    } catch (error) {
      console.error('Error analyzing workout:', error)
      addMessage('assistant', '❌ 分析中にエラーが発生しました。')
      setIsAnalyzing(false)
    }
  }

  const resetChat = () => {
    setStage(recordData.exerciseName ? 'weight' : 'exercise')
    const resetMsg = recordData.exerciseName
      ? `${recordData.exerciseName}の次の記録をどうぞ。重量は何kgですか？`
      : '別の種目を記録しますか？'
    addMessage('assistant', resetMsg)
    setRecordData({
      exerciseName: recordData.exerciseName,
      weight: null,
      reps: null,
      sets: null,
      memo: '',
    })
  }

  if (!isOpen) return null

  return (
    <div className="ai-chat-overlay" onClick={onClose}>
      <div className="ai-chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-chat-header">
          <h2>🤖 AI Training Assistant</h2>
          <button
            className="ai-chat-close"
            onClick={onClose}
            aria-label="Close chat"
          >
            ✕
          </button>
        </div>

        <div className="ai-chat-messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`ai-message ai-message-${msg.role}`}
            >
              <div className="ai-message-content">
                {msg.text}
              </div>
            </div>
          ))}
          {isAnalyzing && (
            <div className="ai-message ai-message-assistant">
              <div className="ai-message-content">
                <span className="ai-loader">⏳</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="ai-chat-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="ai-chat-input"
            placeholder={
              stage === 'analysis'
                ? 'チャットを閉じるか、別の記録を開始してください'
                : 'ここに入力...'
            }
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isAnalyzing || stage === 'analysis'}
            autoFocus
          />
          <button
            type="submit"
            className="ai-chat-submit"
            disabled={isAnalyzing || stage === 'analysis'}
          >
            送信
          </button>
        </form>

        {stage === 'analysis' && (
          <button
            className="ai-chat-close-btn"
            onClick={onClose}
          >
            閉じる
          </button>
        )}
      </div>
    </div>
  )
}

export default AIChatModal
