import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AssessmentState {
  currentStep: number
  results: Record<string, any>
  isSubmitting: boolean
}

const initialState: AssessmentState = {
  currentStep: 0,
  results: {},
  isSubmitting: false,
}

export const assessmentSlice = createSlice({
  name: 'assessment',
  initialState,
  reducers: {
    setStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload
    },
    saveStepResult: (state, action: PayloadAction<{ step: string; data: any }>) => {
      state.results[action.payload.step] = action.payload.data
    },
    resetAssessment: (state) => {
      state.currentStep = 0
      state.results = {}
    },
  },
})

export const { setStep, saveStepResult, resetAssessment } = assessmentSlice.actions
export default assessmentSlice.reducer
