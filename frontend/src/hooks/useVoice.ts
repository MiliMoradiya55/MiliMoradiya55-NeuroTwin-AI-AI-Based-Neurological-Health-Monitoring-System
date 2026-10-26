// src/hooks/useVoice.ts
import { useState, useRef, useCallback } from 'react'

interface UseVoiceReturn {
  isRecording: boolean
  audioBlob: Blob | null
  duration: number
  startRecording: () => Promise<void>
  stopRecording: () => void
  resetRecording: () => void
  error: string | null
}

export function useVoice(): UseVoiceReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
        if (timerRef.current) clearInterval(timerRef.current)
      }

      mediaRecorder.start(100)
      setIsRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000)
    } catch (err) {
      setError('Microphone access denied. Please enable microphone permissions.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const resetRecording = useCallback(() => {
    setAudioBlob(null)
    setDuration(0)
    setError(null)
  }, [])

  return { isRecording, audioBlob, duration, startRecording, stopRecording, resetRecording, error }
}

export default useVoice
