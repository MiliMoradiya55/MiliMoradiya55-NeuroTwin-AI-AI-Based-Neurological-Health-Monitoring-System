// src/hooks/useWebcam.ts
import { useState, useRef, useCallback, useEffect } from 'react'

interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement>
  isActive: boolean
  error: string | null
  startCamera: () => Promise<void>
  stopCamera: () => void
  captureFrame: () => string | null
}

export function useWebcam(): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsActive(true)
    } catch (err) {
      setError('Camera access denied. Please enable camera permissions.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setIsActive(false)
  }, [])

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !isActive) return null
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(videoRef.current, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.8)
  }, [isActive])

  useEffect(() => {
    return () => { stopCamera() }
  }, [stopCamera])

  return { videoRef, isActive, error, startCamera, stopCamera, captureFrame }
}

export default useWebcam
