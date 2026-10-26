// src/hooks/useTimer.ts
import { useState, useRef, useCallback, useEffect } from 'react'

interface UseTimerReturn {
  time: number
  isRunning: boolean
  start: () => void
  stop: () => void
  reset: () => void
  formatTime: (ms: number) => string
}

export function useTimer(initialTime: number = 0, countDown: boolean = false): UseTimerReturn {
  const [time, setTime] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    if (isRunning) return
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setTime(prev => {
        if (countDown) {
          if (prev <= 0) {
            clearInterval(intervalRef.current!)
            setIsRunning(false)
            return 0
          }
          return prev - 100
        }
        return prev + 100
      })
    }, 100)
  }, [isRunning, countDown])

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    stop()
    setTime(initialTime)
  }, [stop, initialTime])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const tenths = Math.floor((ms % 1000) / 100)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`
  }

  return { time, isRunning, start, stop, reset, formatTime }
}

export default useTimer
