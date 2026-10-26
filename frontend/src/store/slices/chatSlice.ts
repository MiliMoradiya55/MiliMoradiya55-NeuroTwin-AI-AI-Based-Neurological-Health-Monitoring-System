import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Message {
  id: number
  sender: 'user' | 'ai'
  text: string
}

interface ChatState {
  messages: Message[]
}

const initialState: ChatState = {
  messages: [],
}

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload)
    },
    clearMessages: (state) => {
      state.messages = []
    },
  },
})

export const { addMessage, clearMessages } = chatSlice.actions
export default chatSlice.reducer
