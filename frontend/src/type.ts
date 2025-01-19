export interface CarData {
    id: number,
    carStatus: number,
    name: string,
    latitude: number,
    longitude: number
}

export type UserStatus = "noLooking" | "lookingCar" | "reservedCar" | "driving"
export interface CarMarkerData {
    id: number,
    latlng: L.LatLngTuple
}
export interface BeforeStatus {
    targetCarId: number
    userStatus: UserStatus
}