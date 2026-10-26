import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface DoctorState {
  selectedPatientId: number | null
}

const initialState: DoctorState = {
  selectedPatientId: null,
}

export const doctorSlice = createSlice({
  name: 'doctor',
  initialState,
  reducers: {
    setSelectedPatient: (state, action: PayloadAction<number>) => {
      state.selectedPatientId = action.payload
    },
  },
})

export const { setSelectedPatient } = doctorSlice.actions
export default doctorSlice.reducer
