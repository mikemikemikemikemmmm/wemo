import * as L from "leaflet"
import { globalStore, setTargetCarMarkerData, setUserStatus } from './store'
import { MAX_CARMARKERS_DATA_LENGTH } from './const';
import { errorHandler } from "./errorHandler";
import { CarData, CarMarkerData } from "./type";
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
    handleNewCarsMarker(newCars: CarData[]) {
        const self = this
        for (let index = 0; index < newCars.length; index++) {
            const car = newCars[index];
            if (this.list.some(cm => cm._id === car.id)) {
                continue
            }
            const newMarker = new CarMarker(car.id, [car.latitude, car.longitude])
            const bindFn = self.handleClickCarMarker.bind(self)
            newMarker.addEventListener("click", e => bindFn(e))
            newMarker.addTo(this.map)
            this.list.push(newMarker)
        }
        if (this.list.length > MAX_CARMARKERS_DATA_LENGTH) {
            this.trimList()
        }
    }
    handleClickCarMarker(e: L.LeafletMouseEvent) {
        const state = globalStore.getState()
        const {userStatus,targetCarMarkerData} = state
        if (userStatus === 'driving' || userStatus === 'reservedCar') {
            return
        }
        const targetMarker = e.target
        const isSelf = targetCarMarkerData?.id === targetMarker._id
        if (!targetCarMarkerData) {
            targetMarker.setStyle(clickedMarkerStyle)
            const data = this.createMarkerData(targetMarker)
            globalStore.dispatch(setTargetCarMarkerData(data))
            globalStore.dispatch(setUserStatus('lookingCar'))
        }
        else if (targetCarMarkerData && !isSelf) {
            const lastMarker = this.findMarkerById(targetCarMarkerData.id)
            if (lastMarker) {
                lastMarker.setStyle(originMarkerStyle)
            } else {
                errorHandler("")//TODO
            }
            targetMarker.setStyle(clickedMarkerStyle)
            const data = this.createMarkerData(targetMarker)
            globalStore.dispatch(setTargetCarMarkerData(data))
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
    createMarkerData(marker: CarMarker): CarMarkerData {
        const latlng = marker.getLatLng()
        return {
            id: marker._id,
            latlng: [latlng.lat, latlng.lng]
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
        const targetCarMarkerData = globalStore.getState().targetCarMarkerData
        let hasPushTargetMarkerIndex = false
        const newList = [] as typeof this.list
        for (let i = 0; i < this.list.length; i++) {
            //Ensure that the target marker will not be deleted.
            const target = this.list[i]
            if (
                !hasPushTargetMarkerIndex &&
                targetCarMarkerData &&
                targetCarMarkerData.id === target._id
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