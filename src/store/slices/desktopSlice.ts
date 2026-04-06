import { createSlice } from '@reduxjs/toolkit'

interface DesktopState {
  // Phase 2: will hold icon positions, selected icon, wallpaper setting
  icons: {
    [key: string]: {
      x: number
      y: number
    }
  }
}

const initialState: DesktopState = { icons: {} }

const desktopSlice = createSlice({
  name: 'desktop',
  initialState,
  reducers: {
    // Phase 2: setIconPosition, setWallpaper, setSelectedIcon
  },
})

export default desktopSlice.reducer
