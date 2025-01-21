import { createSlice, configureStore, PayloadAction } from '@reduxjs/toolkit'
import { LOADING_ID, TAIWAN_TRAIN_STATION_COOR, TOAST_ID } from './const'
import { CarMarkerData, UserStatus } from './type'
import { handleBtnGroupDisplay } from './main'
const loadingDom = document.getElementById(LOADING_ID) as HTMLElement
const toastDom = document.getElementById(TOAST_ID) as HTMLElement
let toastSetTimeoutId = undefined as number | undefined
const mapSlice = createSlice({
  name: 'map',
  initialState: {
    userStatus: "noLooking" as UserStatus,

    //redux only save json, can't save Carmarker
    targetCarMarkerData: undefined as CarMarkerData | undefined,
    nowLatlng: TAIWAN_TRAIN_STATION_COOR as L.LatLngTuple,
    isLoading: false
  },
  reducers: {
    setToastText(state, action: PayloadAction<string>) {
      const text = action.payload
      toastDom.innerText = text
      toastDom.style.display = 'block'
      if (toastSetTimeoutId) {
        clearTimeout(toastSetTimeoutId)
      }
      toastSetTimeoutId = setTimeout(() => {
        toastDom.style.display = 'none'
        clearTimeout(toastSetTimeoutId)
      }, 3000);
    },
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

export const { setIsLoading,setToastText, setNowLatlngForStore, setTargetCarMarkerData, setUserStatus } = mapSlice.actions

export const globalStore = configureStore({
  reducer: mapSlice.reducer
})
export type GlobalStoreType = typeof globalStore
export type RootMapState = ReturnType<typeof globalStore.getState>


