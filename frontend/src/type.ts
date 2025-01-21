export interface CarData {
    id: number,
    carStatus: number,
    name: string,
    latitude: number,
    longitude: number
}

export type UserStatus = "noLooking" | "lookingCar" | "reservedCar" | "driving"
export interface CarMarkerJson {
    id: number,
    latlng: L.LatLngTuple
}
export interface BeforeStatus {
    targetCar?: CarData
    userStatus: UserStatus,
}