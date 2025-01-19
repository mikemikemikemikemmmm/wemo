import { createSlice, configureStore, PayloadAction } from '@reduxjs/toolkit'
import { TAIWAN_TRAIN_STATION_COOR } from './const'
import { CarMarkerData, UserStatus } from './type'
import { handleBtnGroupDisplay } from './main'
const loadingDom = document.getElementById('loading') as HTMLElement
const mapSlice = createSlice({
  name: 'map',
  initialState: {
    userStatus: "noLooking" as UserStatus,
    targetCarMarkerData: undefined as CarMarkerData | undefined,
    nowLatlng: TAIWAN_TRAIN_STATION_COOR as L.LatLngTuple,
    isLoading: false
  },
  reducers: {
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
      if (action.payload) {
        loadingDom.style.display = 'block'
      } else {
        loadingDom.style.display = 'none'
      }
    },
    setUserStatus: (state, action: PayloadAction<UserStatus>) => {
      state.userStatus = action.payload
      handleBtnGroupDisplay(action.payload)
      if (action.payload === 'noLooking') {
        state.targetCarMarkerData = undefined
      }
    },
    setTargetCarMarkerData: (state, action: PayloadAction<CarMarkerData | undefined>) => {
      state.targetCarMarkerData = action.payload
    },
    setNowLatlngForStore: (state, action: PayloadAction<L.LatLngTuple>) => {
      state.nowLatlng = action.payload
    }
  }
})

export const { setIsLoading, setNowLatlngForStore, setTargetCarMarkerData, setUserStatus } = mapSlice.actions

export const globalStore = configureStore({
  reducer: mapSlice.reducer
})
export type GlobalStoreType = typeof globalStore
export type RootMapState = ReturnType<typeof globalStore.getState>


