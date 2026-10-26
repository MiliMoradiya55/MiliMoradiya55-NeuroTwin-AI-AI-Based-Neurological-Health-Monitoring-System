import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface TwinState {
  baselineStatus: string
  metrics: Record<string, number>
}

const initialState: TwinState = {
  baselineStatus: 'calibrating',
  metrics: {},
}

export const twinSlice = createSlice({
  name: 'twin',
  initialState,
  reducers: {
    setBaselineStatus: (state, action: PayloadAction<string>) => {
      state.baselineStatus = action.payload
    },
    setMetrics: (state, action: PayloadAction<Record<string, number>>) => {
      state.metrics = action.payload
    },
  },
})

export const { setBaselineStatus, setMetrics } = twinSlice.actions
export default twinSlice.reducer
