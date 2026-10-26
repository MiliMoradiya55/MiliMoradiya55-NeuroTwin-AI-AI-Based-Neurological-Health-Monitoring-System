import React, { useState } from 'react'
import { FiZap } from 'react-icons/fi'
import toast from 'react-hot-toast'

const ReactionTest: React.FC = () => {
  const [gameState, setGameState] = useState<'idle' | 'waiting' | 'ready' | 'finished'>('idle')
  const [startTime, setStartTime] = useState<number>(0)
  const [reactionTime, setReactionTime] = useState<number | null>(null)
  const [timeoutId, setTimeoutId] = useState<any>(null)

  const startTest = () => {
    setGameState('waiting')
    setReactionTime(null)

    const delay = Math.floor(Math.random() * 2000) + 1500
    const id = setTimeout(() => {
      setGameState('ready')
      setStartTime(Date.now())
    }, delay)
    setTimeoutId(id)
  }

  const handleClick = () => {
    if (gameState === 'waiting') {
      clearTimeout(timeoutId)
      setGameState('idle')
      toast.error('Too early! Wait for the screen to turn GREEN.')
    } else if (gameState === 'ready') {
      const ms = Date.now() - startTime
      setReactionTime(ms)
      setGameState('finished')
      toast.success(`Reaction speed: ${ms} ms!`)
    }
  }

  return (
    <div className="text-center space-y-6">
      <div
        onClick={gameState !== 'idle' ? handleClick : undefined}
        className={`max-w-md mx-auto h-48 rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer transition-all duration-300 ${
          gameState === 'idle'
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700'
            : gameState === 'waiting'
            ? 'bg-amber-500 text-white animate-pulse'
            : gameState === 'ready'
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-105'
            : 'bg-indigo-900 text-white'
        }`}
      >
        <FiZap className="w-12 h-12 mb-2" />
        {gameState === 'idle' && <p className="font-semibold">Click "Start Test" below</p>}
        {gameState === 'waiting' && <p className="font-bold text-xl">Wait for GREEN...</p>}
        {gameState === 'ready' && <p className="font-extrabold text-3xl animate-bounce">CLICK NOW!</p>}
        {gameState === 'finished' && (
          <div>
            <p className="text-sm opacity-80">Visual Reaction Time</p>
            <p className="font-bold text-3xl">{reactionTime} ms</p>
          </div>
        )}
      </div>

      {gameState === 'idle' && (
        <button
          onClick={startTest}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-500/20"
        >
          Start Reaction Test
        </button>
      )}

      {gameState === 'finished' && (
        <button
          onClick={startTest}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all"
        >
          Try Again
        </button>
      )}
    </div>
  )
}

export default ReactionTest
