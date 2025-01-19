import Api from "./api";
import { BUTTON_ID_MAP, DISTANCE_ALLOW_PICKUP_METER, DISTANCE_ALLOW_RESERVE_METER, INTERVAL_SECOND_TO_CALL_API_WHEN_DRIVING, KeyOfButtonMap, TOAST_ID } from "./const";
import { errorHandler } from "./errorHandler";
import { globalStore, setTargetCarMarkerData, setUserStatus } from "./store";
import * as L from 'leaflet'
import { UserStatus } from "./type";
export class DomManager {
    btnDomGroup: { [key in KeyOfButtonMap]: HTMLElement }
    toast: HTMLElement
    setTimeoutId?: number
    drivingSetIntervalId?: number
    constructor(
        private resetMarkerStyle: (carMarkerId: number) => void,
        private setViewToNowLatlng: () => void,
        private setMarkerWhenPickcar: (carid: number) => void,
        private setMarkerWhenReturncar: (carid: number) => void,
    ) {
        this.btnDomGroup = {
            reserveCar: document.getElementById(BUTTON_ID_MAP.reserveCar) as HTMLElement,
            cancelReserveCar: document.getElementById(BUTTON_ID_MAP.cancelReserveCar) as HTMLElement,
            pickCar: document.getElementById(BUTTON_ID_MAP.pickCar) as HTMLElement,
            returnCar: document.getElementById(BUTTON_ID_MAP.returnCar) as HTMLElement,
            flyToSelf: document.getElementById('centerToSelf') as HTMLElement
        }
        this.toast = document.getElementById(TOAST_ID) as HTMLElement

        this.initButtons()
        this.hiddenToast(this)
    }
    setToastTextForDriving() {

    }
    setToastText(text: string) {
        const self = this
        self.toast.innerText = text
        self.toast.style.display = 'block'
        if (self.setTimeoutId) {
            clearTimeout(self.setTimeoutId)
        }
        self.setTimeoutId = setTimeout(() => {
            self.hiddenToast(self)
            clearTimeout(self.setTimeoutId)
        }, 3000);
    }
    hiddenToast(domManager: DomManager) {
        domManager.toast.style.display = 'none'
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
    isAllowByDistance(carLatlngTuple: L.LatLngTuple, type: 'reserve' | 'pickup'): boolean {
        const { nowLatlng } = globalStore.getState()
        const carLatlng = L.latLng(carLatlngTuple[0], carLatlngTuple[1])
        const distance = carLatlng.distanceTo(nowLatlng)
        const allowDistance = type === 'pickup' ? DISTANCE_ALLOW_PICKUP_METER : DISTANCE_ALLOW_RESERVE_METER
        return distance < allowDistance
    }
    getUserStatus() {
        return globalStore.getState().userStatus
    }
    async handleClickReserveCar() {
        if (this.getUserStatus() !== 'lookingCar') {
            return
        }
        const { targetCarMarkerData } = globalStore.getState()
        if (!targetCarMarkerData) {
            return
        }
        if (!this.isAllowByDistance(targetCarMarkerData.latlng, 'reserve')) {
            this.setToastText("距離太遠無法預約")
            return
        }
        const { isLoading } = globalStore.getState()
        if (isLoading) {
            return
        }
        const result = await Api.get(`Car/reserve/${targetCarMarkerData.id}`)
        if (!result.isSuccess) {
            this.setToastText('預約失敗')
            return
        }
        globalStore.dispatch(setUserStatus('reservedCar'))
        this.setToastText('預約成功')
        // this.displayButton('cancelReserveCar')
        // this.displayButton('pickCar')
        // this.hiddenButton('reserveCar')
    }
    async handleClickCancelReserveCar() {
        if (this.getUserStatus() !== 'reservedCar') {
            return
        }
        const { targetCarMarkerData } = globalStore.getState()
        if (!targetCarMarkerData) {
            return
        }
        const { isLoading } = globalStore.getState()
        if (isLoading) {
            return
        }
        const result = await Api.get(`Car/cancel/${targetCarMarkerData.id}`)
        if (!result.isSuccess) {

            this.setToastText('取消預約失敗')
            return
        }
        this.setToastText('取消預約成功')
        this.resetMarkerStyle(targetCarMarkerData.id)
        globalStore.dispatch(setUserStatus('noLooking'))
    }
    async handleClickPickupCar() {
        if (this.getUserStatus() !== 'reservedCar') {
            return
        }
        const { targetCarMarkerData } = globalStore.getState()
        if (!targetCarMarkerData) {
            return
        }
        if (!this.isAllowByDistance(targetCarMarkerData.latlng, 'pickup')) {
            this.setToastText("距離太遠無法取車")
            return
        }
        const { isLoading } = globalStore.getState()
        if (isLoading) {
            return
        }
        const result = await Api.get(`Car/pickup/${targetCarMarkerData.id}`)
        if (!result.isSuccess) {

            this.setToastText('取車失敗')
            return
        }
        globalStore.dispatch(setUserStatus('driving'))
        this.setMarkerWhenPickcar(targetCarMarkerData.id)
        this.setToastText('取車成功')
        this.setToastTextForDriving()
        const self = this
        this.drivingSetIntervalId = setInterval(async () => {
            self.callApiToRecordDriving()
        }, INTERVAL_SECOND_TO_CALL_API_WHEN_DRIVING);
    }
    async callApiToRecordDriving() {
        const { targetCarMarkerData, nowLatlng } = globalStore.getState()
        if (!targetCarMarkerData?.id) {
            errorHandler("callApiToRecordDriving")
            return
        }
        const result = await Api.get(`Car/update/${nowLatlng[0]}/${nowLatlng[1]}`)
        if (!result.isSuccess) {
            clearInterval(this.drivingSetIntervalId)
            errorHandler("callApiToRecordDriving, fail")
            return
        }
        globalStore.dispatch(setTargetCarMarkerData({
            ...targetCarMarkerData,
            latlng:nowLatlng
        }))
    }
    async handleClickReturnCar() {
        if (this.getUserStatus() !== 'driving') {
            return
        }
        const { targetCarMarkerData } = globalStore.getState()
        if (!targetCarMarkerData) {
            return
        }
        const { isLoading } = globalStore.getState()
        if (isLoading) {
            return
        }
        const result = await Api.get(`Car/return/${targetCarMarkerData.id}`)
        if (!result.isSuccess) {
            this.setToastText('還車失敗')
            return
        }
        clearInterval(this.drivingSetIntervalId)
        this.drivingSetIntervalId = undefined
        this.setToastText('還車成功')
        this.setMarkerWhenReturncar(targetCarMarkerData.id)
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