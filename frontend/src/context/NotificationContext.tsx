import React, { createContext, useContext, useState } from 'react'

interface NotificationContextType {
  notifications: string[]
  addNotification: (msg: string) => void
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  addNotification: () => {},
})

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<string[]>([])

  const addNotification = (msg: string) => setNotifications(prev => [...prev, msg])

  return (
    <NotificationContext.Provider value={{ notifications, addNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => useContext(NotificationContext)
