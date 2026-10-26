// src/hooks/useMicrophone.ts
import { useState, useRef, useCallback } from 'react'

export const useMicrophone = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
      setError(null)
      return true
    } catch (err) {
      setError('Failed to access microphone')
      return false
    }
  }, [])

  const stopRecording = useCallback(() => {
    return new Promise<Blob | null>((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
          if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
          }
          setIsRecording(false)
          resolve(audioBlob)
        }
        mediaRecorderRef.current.stop()
      } else {
        resolve(null)
      }
    })
  }, [isRecording])

  return {
    isRecording,
    error,
    startRecording,
    stopRecording,
  }
}