import * as L from "leaflet"
import { globalStore, setTargetCarMarkerJson, setUserStatus } from './store'
import { MAX_CARMARKERS_DATA_LENGTH } from './const';
import { errorHandler } from "./errorHandler";
import { CarData, CarMarkerJson } from "./type";
const originMarkerStyle = { radius: 4, color: 'blue', fillColor: 'blue', fillOpacity: 1 }
export const clickedMarkerStyle = { color: 'red', radius: 7, fillColor: 'red', fillOpacity: 1 }
export class CarMarker extends L.CircleMarker {
    _id: number
    constructor(
        _id: number,
        latlng: L.LatLngTuple) {
        super(latlng, originMarkerStyle)
        this._id = _id
    }
}

export class CarMarkerManager {
    list: CarMarker[] = []
    clickedCarMarker: CarMarker | undefined
    constructor(private map: L.Map) { }
    resetMarkerStyle(markerId: number) {
        const target = this.findMarkerById(markerId)
        if (!target) {
            return
        }
        target.setStyle(originMarkerStyle)
    }
    //not markerJson
    createMarker(id: number, lat: number, lon: number) {
        const newMarker = new CarMarker(id, [lat, lon])
        const bindFn = this.handleClickCarMarker.bind(this)
        newMarker.addEventListener("click", e => bindFn(e))
        newMarker.addTo(this.map)
        return newMarker
    }
    handleNewCarsMarker(newCars: CarData[]) {
        for (let index = 0; index < newCars.length; index++) {
            const car = newCars[index];
            if (this.list.some(cm => cm._id === car.id)) {
                continue
            }
            const newMarker = this.createMarker(car.id, car.latitude, car.longitude)
            this.list.push(newMarker)
        }
        if (this.list.length > MAX_CARMARKERS_DATA_LENGTH) {
            this.trimList()
        }
    }
    handleClickCarMarker(e: L.LeafletMouseEvent) {
        const state = globalStore.getState()
        const { userStatus, targetCarMarkerJson } = state
        if (userStatus === 'driving' || userStatus === 'reservedCar') {
            return
        }
        const targetMarker = e.target as CarMarker
        const { lat, lng } = targetMarker.getLatLng()
        const markerJson = this.createMarkerJson(targetMarker._id, lat, lng)
        const isSelf = targetCarMarkerJson?.id === targetMarker._id
        if (!targetCarMarkerJson) {
            targetMarker.setStyle(clickedMarkerStyle)
            globalStore.dispatch(setTargetCarMarkerJson(markerJson))
            globalStore.dispatch(setUserStatus('lookingCar'))
        }
        else if (targetCarMarkerJson && !isSelf) {
            const lastMarker = this.findMarkerById(targetCarMarkerJson.id)
            if (lastMarker) {
                lastMarker.setStyle(originMarkerStyle)
            } else {
                errorHandler("")//TODO
            }
            targetMarker.setStyle(clickedMarkerStyle)
            globalStore.dispatch(setTargetCarMarkerJson(markerJson))
            globalStore.dispatch(setUserStatus('lookingCar'))
        }
        else if (isSelf) {
            if (targetMarker) {
                targetMarker.setStyle(originMarkerStyle)
            } else {
                errorHandler("")//TODO
            }
            globalStore.dispatch(setUserStatus('noLooking'))
        }
    }
    //redux only save json, can't save Carmarker
    createMarkerJson(id: number, lat: number, lng: number): CarMarkerJson {
        return {
            id,
            latlng: [lat, lng]
        }
    }
    findMarkerById(id: number) {
        for (let index = 0; index < this.list.length; index++) {
            const curr = this.list[index];
            if (curr._id === id) {
                return curr
            }
        }
        return null
    }
    removeMarker(marker: CarMarker) {
        marker.clearAllEventListeners()
        marker.removeFrom(this.map)
    }
    trimList() {
        const currentBounds = this.map.getBounds()
        const {targetCarMarkerJson} = globalStore.getState()
        let hasPushTargetMarkerIndex = false
        const newList = [] as typeof this.list
        for (let i = 0; i < this.list.length; i++) {
            //Ensure that the target marker will not be deleted.
            const target = this.list[i]
            if (
                !hasPushTargetMarkerIndex &&
                targetCarMarkerJson &&
                targetCarMarkerJson.id === target._id
            ) {
                hasPushTargetMarkerIndex = true
                newList.push(target)
                continue
            }
            const isCurrentViewContainMarker = currentBounds.contains(this.list[i].getLatLng())
            if (isCurrentViewContainMarker) {
                newList.push(target)
            } else {
                this.removeMarker(target)
            }
        }
        this.list = newList
    }
    setMarkerStyleWhenPickcar(carId: number) {
        const target = this.findMarkerById(carId)
        if (!target) {
            errorHandler("")
            return
        }
        target.setStyle({ opacity: 0, fillOpacity: 0 })
    }

    setMarkerStyleWhenReturncar(carId: number) {
        const target = this.findMarkerById(carId)
        if (!target) {
            errorHandler("")
            return
        }
        target.setLatLng(globalStore.getState().nowLatlng)
        target.setStyle({ opacity: 100, fillOpacity: 1 })
    }
}