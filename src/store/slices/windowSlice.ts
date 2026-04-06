import { createSlice } from '@reduxjs/toolkit'

interface WindowState {
  // Phase 2: will hold open windows, z-index stack, minimized state
  windows: {
    [key: string]: {
      x: number
      y: number
    }
  }
}

const initialState: WindowState = { windows: {} }

const windowSlice = createSlice({
  name: 'window',
  initialState,
  reducers: {
    // Phase 2: openWindow, closeWindow, minimizeWindow, maximizeWindow, focusWindow
  },
})

export default windowSlice.reducer
