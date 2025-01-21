import Api from "./api";
import { BUTTON_ID_MAP, DISTANCE_ALLOW_PICKUP_METER, DISTANCE_ALLOW_RESERVE_METER, INTERVAL_SECOND_TO_CALL_API_WHEN_DRIVING, KeyOfButtonMap, TOAST_ID } from "./const";
import { errorHandler } from "./errorHandler";
import { globalStore, setTargetCarMarkerData, setToastText, setUserStatus } from "./store";
import * as L from 'leaflet'
import { UserStatus } from "./type";
export class DomManager {
    btnDomGroup: { [key in KeyOfButtonMap]: HTMLElement }
    drivingSetIntervalId?: number
    constructor(
        private resetMarkerStyle: (carMarkerId: number) => void,
        private setViewToNowLatlng: () => void,
        private setMarkerStyleWhenPickcar: (carid: number) => void,
        private setMarkerStyleWhenReturncar: (carid: number) => void,
    ) {
        this.btnDomGroup = {
            reserveCar: document.getElementById(BUTTON_ID_MAP.reserveCar) as HTMLElement,
            cancelReserveCar: document.getElementById(BUTTON_ID_MAP.cancelReserveCar) as HTMLElement,
            pickCar: document.getElementById(BUTTON_ID_MAP.pickCar) as HTMLElement,
            returnCar: document.getElementById(BUTTON_ID_MAP.returnCar) as HTMLElement,
            flyToSelf: document.getElementById('centerToSelf') as HTMLElement
        }
        this.initButtons()
    }
    setGlobalToastText(text: string) {
        globalStore.dispatch(setToastText(text))
    }
    initButtons() {
        this.btnDomGroup.flyToSelf.addEventListener('click', this.setViewToNowLatlng)

        this.btnDomGroup.cancelReserveCar.addEventListener('click', this.handleClickCancelReserveCar.bind(this))
        this.hiddenButton('cancelReserveCar')

        this.btnDomGroup.pickCar.addEventListener('click', this.handleClickPickupCar.bind(this))
        this.hiddenButton('pickCar')

        this.btnDomGroup.reserveCar.addEventListener('click', this.handleClickReserveCar.bind(this))
        this.hiddenButton('reserveCar')

        this.btnDomGroup.returnCar.addEventListener('click', this.handleClickReturnCar.bind(this))
        this.hiddenButton('returnCar')
    }
    hiddenButton(buttonKey: KeyOfButtonMap) {
        const targetDom = this.btnDomGroup[buttonKey]
        targetDom.style.display = 'none'
    }
    displayButton(buttonKey: KeyOfButtonMap) {
        const targetDom = this.btnDomGroup[buttonKey]
        targetDom.style.display = 'block'
    }
    isAllowByDistance(nowLatlng: L.LatLngTuple, carLatlngTuple: L.LatLngTuple, type: 'reserve' | 'pickup'): boolean {
        const carLatlng = L.latLng(carLatlngTuple[0], carLatlngTuple[1])
        const distance = carLatlng.distanceTo(nowLatlng)
        const allowDistance = type === 'pickup' ? DISTANCE_ALLOW_PICKUP_METER : DISTANCE_ALLOW_RESERVE_METER
        return distance < allowDistance
    }
    async handleClickReserveCar() {
        const { targetCarMarkerData, isLoading, userStatus, nowLatlng } = globalStore.getState()
        if (userStatus !== 'lookingCar' || !targetCarMarkerData || isLoading) {
            return
        }
        if (!this.isAllowByDistance(nowLatlng, targetCarMarkerData.latlng, 'reserve')) {
            this.setGlobalToastText("距離太遠無法預約")
            return
        }
        const result = await Api.get(`Car/reserve/${targetCarMarkerData.id}`)
        if (!result.isSuccess) {
            return
        }
        globalStore.dispatch(setUserStatus('reservedCar'))
        this.setGlobalToastText('預約成功')
    }
    async handleClickCancelReserveCar() {
        const { targetCarMarkerData, isLoading, userStatus } = globalStore.getState()
        if (userStatus !== 'reservedCar' || !targetCarMarkerData || isLoading) {
            return
        }
        const result = await Api.get(`Car/cancel/${targetCarMarkerData.id}`)
        if (!result.isSuccess) {
            return
        }
        this.setGlobalToastText('取消預約成功')
        this.resetMarkerStyle(targetCarMarkerData.id)
        globalStore.dispatch(setUserStatus('noLooking'))
    }
    async handleClickPickupCar() {
        const { targetCarMarkerData, isLoading, userStatus, nowLatlng } = globalStore.getState()
        if (userStatus !== 'reservedCar' || !targetCarMarkerData || isLoading) {
            return
        }
        if (!this.isAllowByDistance(nowLatlng, targetCarMarkerData.latlng, 'pickup')) {
            this.setGlobalToastText("距離太遠無法取車")
            return
        }
        const result = await Api.get(`Car/pickup/${targetCarMarkerData.id}`)
        if (!result.isSuccess) {
            return
        }
        if (result.data === 'hasExpired') {
            this.resetMarkerStyle(targetCarMarkerData.id)
            this.setGlobalToastText('預約已過期')
            globalStore.dispatch(setUserStatus('noLooking'))
            globalStore.dispatch(setTargetCarMarkerData(undefined))
            return
        }
        globalStore.dispatch(setUserStatus('driving'))
        this.setMarkerStyleWhenPickcar(targetCarMarkerData.id)
        this.setGlobalToastText('取車成功')
        this.handleAddIntervalWhenPickupCar()
    }
    handleAddIntervalWhenPickupCar() {
        const self = this
        this.drivingSetIntervalId = setInterval(async () => {
            self.callApiToRecordDriving()
        }, INTERVAL_SECOND_TO_CALL_API_WHEN_DRIVING);
    }
    async callApiToRecordDriving() {
        const { targetCarMarkerData, nowLatlng } = globalStore.getState()
        if (!targetCarMarkerData) {
            errorHandler("callApiToRecordDriving")
            return
        }
        const result = await Api.get(`Car/update/${nowLatlng[0]}/${nowLatlng[1]}`, false)
        this.setGlobalToastText('紀錄座標中')
        if (!result.isSuccess) {
            clearInterval(this.drivingSetIntervalId)
            errorHandler("callApiToRecordDriving, fail")
            return
        }
        globalStore.dispatch(setTargetCarMarkerData({
            ...targetCarMarkerData,
            latlng: nowLatlng
        }))
    }
    async handleClickReturnCar() {
        const { targetCarMarkerData, isLoading, nowLatlng, userStatus } = globalStore.getState()
        if (userStatus !== 'driving' || !targetCarMarkerData || isLoading) {
            return
        }
        const postData = {
            carId: targetCarMarkerData.id,
            lat: nowLatlng[0],
            lng: nowLatlng[1]
        }
        const result = await Api.post(`Car/return`, postData)
        if (!result.isSuccess) {
            return
        }
        clearInterval(this.drivingSetIntervalId)
        this.drivingSetIntervalId = undefined
        this.setGlobalToastText('還車成功')
        this.setMarkerStyleWhenReturncar(targetCarMarkerData.id)
        this.resetMarkerStyle(targetCarMarkerData.id)
        globalStore.dispatch(setUserStatus('noLooking'))
    }
    handleBtnGroupDisplay(nextUserStatus: UserStatus) {
        switch (nextUserStatus) {
            case 'noLooking': {
                this.hiddenButton('cancelReserveCar')
                this.hiddenButton('pickCar')
                this.hiddenButton('reserveCar')
                this.hiddenButton('returnCar')
                break
            }
            case 'lookingCar': {
                this.hiddenButton('cancelReserveCar')
                this.hiddenButton('pickCar')
                this.displayButton('reserveCar')
                this.hiddenButton('returnCar')
                break
            }
            case 'reservedCar': {
                this.displayButton('cancelReserveCar')
                this.displayButton('pickCar')
                this.hiddenButton('reserveCar')
                this.hiddenButton('returnCar')
                break
            }
            case 'driving': {
                this.hiddenButton('cancelReserveCar')
                this.hiddenButton('pickCar')
                this.hiddenButton('reserveCar')
                this.displayButton('returnCar')
                break
            }

        }
    }
}