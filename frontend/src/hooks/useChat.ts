// src/hooks/useChat.ts
import { useState, useCallback } from 'react'

interface ChatMessage {
  id: number
  sender: 'user' | 'ai'
  text: string
  time: string
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 'ai', text: 'Hello! I am your NeuroTwin Clinical AI. How can I help?', time: 'Just now' },
  ])
  const [loading, setLoading] = useState(false)

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { id: Date.now(), sender: 'user', text, time: 'Just now' }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    // Simulated AI response
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Based on your Digital Brain Twin data, your neurological markers remain within your personal baseline range. Continue your scheduled assessments.',
        time: 'Just now',
      }
      setMessages(prev => [...prev, aiMsg])
      setLoading(false)
    }, 1200)
  }, [])

  const clearChat = useCallback(() => {
    setMessages([{ id: 1, sender: 'ai', text: 'Chat cleared. How can I help?', time: 'Just now' }])
  }, [])

  return { messages, loading, sendMessage, clearChat }
}

export default useChat
