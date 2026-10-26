// src/components/tests/MemoryTest/WordRecall.tsx

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiCpu, FiClock, FiAward, FiRefreshCw, FiCheckCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { memoryService } from '@/services/memoryService'

interface MemoryResult {
  score: number
  accuracy: number
  correct_count: number
  total_count: number
  avg_reaction_time: number
  total_time: number
  memory_level: string
  memory_quotient: number
  recommendation: string
  assessment_id?: number
}

interface WordRecallProps {
  onComplete?: (result: MemoryResult) => void
  onError?: (error: string) => void
}

const WordRecall: React.FC<WordRecallProps> = ({ onComplete, onError }) => {
  const [phase, setPhase] = useState<'intro' | 'memorizing' | 'recalling' | 'results'>('intro')
  const [words, setWords] = useState<string[]>([])
  const [remembered, setRemembered] = useState<string[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [timeLeft, setTimeLeft] = useState(30)
  const [score, setScore] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<MemoryResult | null>(null)

  // Word lists by difficulty
  const wordLists = {
    easy: ['Apple', 'Book', 'Cat', 'Dog', 'Elephant', 'Flower', 'Garden', 'House'],
    medium: ['Mountain', 'Ocean', 'Forest', 'Desert', 'Island', 'River', 'Valley', 'Canyon', 'Glacier', 'Cave'],
    hard: ['Knowledge', 'Wisdom', 'Courage', 'Integrity', 'Compassion', 'Perseverance', 'Gratitude', 'Resilience', 'Ambition', 'Empathy'],
  }

  // Shuffle function
  const shuffleArray = (arr: string[]) => {
    const shuffled = [...arr]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const startTest = () => {
    // Select difficulty based on user or random
    const difficulties = ['easy', 'medium', 'hard']
    const selectedDifficulty = difficulties[Math.floor(Math.random() * 2)] // easy or medium for now
    
    // Shuffle words
    const selectedWords = wordLists[selectedDifficulty as keyof typeof wordLists]
    const shuffled = shuffleArray(selectedWords)
    
    // Take 6 words for the test
    setWords(shuffled.slice(0, 6))
    setPhase('memorizing')
    setTimeLeft(30)
    setRemembered([])
    setScore(0)
    setStartTime(Date.now())
    toast.success('🧠 Memorize these words!')
  }

  // Timer effect
  useEffect(() => {
    if (phase === 'memorizing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            setPhase('recalling')
            toast.success('⏰ Time is up! Now recall the words.')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [phase, timeLeft])

  const handleWordRecall = () => {
    if (!currentInput.trim()) return
    const word = currentInput.trim().toLowerCase()
    
    // Check if word exists in the list (case insensitive)
    const matchedWord = words.find(w => w.toLowerCase() === word)
    
    if (matchedWord && !remembered.includes(matchedWord)) {
      setRemembered([...remembered, matchedWord])
      setScore(prev => prev + (100 / words.length))
      toast.success(`✅ "${matchedWord}" remembered!`)
    } else if (remembered.some(w => w.toLowerCase() === word)) {
      toast.error(`"${currentInput.trim()}" already remembered!`)
    } else {
      toast.error(`"${currentInput.trim()}" was not in the list!`)
    }
    setCurrentInput('')
  }

  const calculateResults = async () => {
    setIsProcessing(true)
    const totalTime = ((Date.now() - (startTime || Date.now())) / 1000)
    const accuracy = (remembered.length / words.length) * 100
    const finalScore = Math.round(score)
    
    // Calculate synthetic metrics
    const memoryQuotient = Math.min(100, Math.round(finalScore * 0.8 + accuracy * 0.2))
    const avgReactionTime = Math.max(0.5, 1.5 - (remembered.length / words.length) * 0.5)
    
    let memoryLevel = 'Below Average'
    let recommendation = 'Consider daily memory exercises.'
    
    if (memoryQuotient >= 85) {
      memoryLevel = 'Excellent'
      recommendation = 'Keep up the great work! Continue challenging your memory.'
    } else if (memoryQuotient >= 70) {
      memoryLevel = 'Good'
      recommendation = 'Your memory is above average. Try more challenging exercises.'
    } else if (memoryQuotient >= 50) {
      memoryLevel = 'Average'
      recommendation = 'Regular memory exercises can help improve your recall ability.'
    } else {
      memoryLevel = 'Needs Improvement'
      recommendation = 'Consider cognitive exercises and consult with a healthcare professional.'
    }

    const resultData: MemoryResult = {
      score: finalScore,
      accuracy: accuracy,
      correct_count: remembered.length,
      total_count: words.length,
      avg_reaction_time: avgReactionTime,
      total_time: totalTime,
      memory_level: memoryLevel,
      memory_quotient: memoryQuotient,
      recommendation: recommendation
    }

    setResult(resultData)
    setPhase('results')
    setIsProcessing(false)
    toast.success('📊 Results calculated!')
    
    // Save to database
    try {
      const response = await memoryService.saveAssessment(resultData)
      resultData.assessment_id = response.data?.assessment_id
      toast.success('💾 Results saved to database!')
    } catch (error) {
      console.error('Error saving memory assessment:', error)
      toast.error('Failed to save results to database')
    }
    
    if (onComplete) onComplete(resultData)
  }

  const resetTest = () => {
    setPhase('intro')
    setWords([])
    setRemembered([])
    setCurrentInput('')
    setTimeLeft(30)
    setScore(0)
    setStartTime(null)
    setResult(null)
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 80) return '🌟'
    if (score >= 60) return '👍'
    if (score >= 40) return '📖'
    return '💪'
  }

  const getScoreMessage = (score: number) => {
    if (score >= 80) return 'Excellent memory! Keep it up!'
    if (score >= 60) return 'Good memory! You can improve with practice.'
    if (score >= 40) return 'Average memory. Try memory exercises daily.'
    return 'Memory needs improvement. Consider cognitive exercises.'
  }

  // ===== INTRO PHASE =====
  if (phase === 'intro') {
    return (
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">🧠</div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Word Recall Test</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
          You will see 6 words. Memorize them in 30 seconds, then type the words you remember.
        </p>
        <button
          onClick={startTest}
          className="mt-4 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
        >
          Start Test
        </button>
      </div>
    )
  }

  // ===== MEMORIZING PHASE =====
  if (phase === 'memorizing') {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <FiClock className="w-5 h-5" />
            <span className="font-medium">{timeLeft}s remaining</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <FiCpu className="w-5 h-5" />
            <span className="font-medium">Memorize {words.length} words</span>
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800/30">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {words.map((word, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="p-3 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 text-center font-medium text-slate-800 dark:text-white"
              >
                {word}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-4 w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
            style={{ width: `${((30 - timeLeft) / 30) * 100}%` }}
          />
        </div>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-2">
          Memorize all words. Time is running!
        </p>
      </div>
    )
  }

  // ===== RECALLING PHASE =====
  if (phase === 'recalling') {
    return (
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <FiCpu className="text-indigo-600" />
          What do you remember? ({remembered.length}/{words.length})
        </h3>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleWordRecall()}
            placeholder="Type a word..."
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
            autoFocus
          />
          <button
            onClick={handleWordRecall}
            disabled={!currentInput.trim()}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-xl font-medium transition-all"
          >
            Add
          </button>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[60px] p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
          {remembered.length === 0 && (
            <p className="text-slate-400 dark:text-slate-500 text-sm w-full text-center py-2">
              Type words you remember above...
            </p>
          )}
          {remembered.map((word, idx) => (
            <motion.span
              key={idx}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium border border-green-200 dark:border-green-800/30"
            >
              ✅ {word}
            </motion.span>
          ))}
        </div>

        <button
          onClick={calculateResults}
          disabled={remembered.length === 0}
          className="mt-4 w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 disabled:shadow-none"
        >
          {isProcessing ? 'Saving Results...' : 'Finish & See Results'}
        </button>
      </div>
    )
  }

  // ===== RESULTS PHASE =====
  if (phase === 'results' && result) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center">
            <FiAward className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Memory Test Results</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl text-center">
            <div className="text-3xl mb-1">{getScoreEmoji(result.score)}</div>
            <div className="text-2xl font-bold text-indigo-600">{result.score.toFixed(0)}%</div>
            <div className="text-xs text-slate-500">Memory Score</div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-slate-500">Accuracy</div>
                <div className="text-lg font-bold text-emerald-600">{result.accuracy.toFixed(0)}%</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Correct</div>
                <div className="text-lg font-bold text-green-600">{result.correct_count}/{result.total_count}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Time</div>
                <div className="text-lg font-bold">{result.total_time.toFixed(1)}s</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Level</div>
                <div className="text-lg font-bold text-purple-600">{result.memory_level}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">{result.recommendation}</p>
          {result.assessment_id && (
            <p className="text-xs text-slate-400 mt-2">Saved to database ✓</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={resetTest}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            <FiRefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default WordRecall