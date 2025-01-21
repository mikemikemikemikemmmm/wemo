import * as L from "leaflet"
//api
export const BASE_URL = import.meta.env.VITE_API_BASE_URL
export const INTERVAL_SECOND_TO_CALL_API_WHEN_DRIVING = 5*1000 //5 second
//geo
export const MOVE_SPEED = 0.001
//car
export const MAX_CARMARKERS_DATA_LENGTH = 100
export const DISTANCE_ALLOW_RESERVE_METER = 1000
export const DISTANCE_ALLOW_PICKUP_METER = 200
//map
export const TAIWAN_TRAIN_STATION_COOR: L.LatLngTuple = [25.0478, 121.5170]
export const MAP_CONTAINER_DOM_ID = "mapContainer"
export const MAP_CONTAINER_CONFIG: L.MapOptions = {
    center: TAIWAN_TRAIN_STATION_COOR,
    zoom: 14,
    zoomAnimation: false,
    doubleClickZoom:false
}
export const MAP_CONTAINER_START = L.map(MAP_CONTAINER_DOM_ID, MAP_CONTAINER_CONFIG)

//dom
export const TOAST_ID = 'toast'
export const LOADING_ID = 'loading'
export const BUTTON_ID_MAP = {
    reserveCar: "reserveCar",
    cancelReserveCar: "cancelReserveCar",
    pickCar: "pickCar",
    returnCar: "returnCar",
    flyToSelf:'flyToSelf'
}
export type KeyOfButtonMap = keyof typeof BUTTON_ID_MAP