import * as L from 'leaflet'
import { MAP_CONTAINER_START, MOVE_SPEED } from './const';
import { errorHandler } from './errorHandler';
import Api from './api';
import { convertBoundsToLatlngs, convertBoundsToPolygon, getDiffPolygonGeoJson, PolygonGeojson } from './helpers';
import { CarMarker, CarMarkerManager, clickedMarkerStyle } from './carMarkerManager';
import { globalStore, setNowLatlngForStore, setTargetCarMarkerData, setUserStatus } from './store';
import { DomManager } from './domManager';
import { BeforeStatus, CarData } from './type';
export class MapManager {
    nowLatlng: L.LatLngTuple
    nowPositionCircle: L.Circle
    lastGetNewCarsPolygon: L.Polygon
    carMarkerManager: CarMarkerManager
    domManager: DomManager
    keyState = {
        w: false,
        a: false,
        s: false,
        d: false,
    };

    constructor(
        private map: L.Map = MAP_CONTAINER_START
    ) {
        this.carMarkerManager = new CarMarkerManager(this.map)
        this.domManager = new DomManager(
            this.carMarkerManager.resetMarkerStyle.bind(this.carMarkerManager),
            this.setViewToNowLatlng.bind(this),
            this.carMarkerManager.setMarkerStyleWhenPickcar.bind(this.carMarkerManager),
            this.carMarkerManager.setMarkerStyleWhenReturncar.bind(this.carMarkerManager),
        )
        L.tileLayer(
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
        const { lat, lng } = this.map.getCenter()
        this.nowLatlng = [lat, lng]
        this.nowPositionCircle = L.circle(this.nowLatlng, { radius: 50, color: 'black', fillOpacity: 1, fillColor: 'black' }).addTo(this.map)
        this.lastGetNewCarsPolygon =
            convertBoundsToPolygon(this.map.getBounds())
                .setStyle({ opacity: 0, fillOpacity: 0 })
                .addTo(this.map)
        this.initListenKeyboard()
        this.initListenMapEvent()
        this.handleGetNewCars()
        this.handleBeforeStatus()
    }
    async handleBeforeStatus() {
        const result = await Api.get<BeforeStatus>('Car/before')
        if (!result.isSuccess) {
            return
        }
        const { userStatus, targetCar } = result.data
        if (userStatus == 'noLooking' || userStatus === 'lookingCar') {
            return
        }
        if (!targetCar) {
            errorHandler('')
            return
        }
        const carmarkerData = this.carMarkerManager.createMarkerDataByCar(targetCar)
        globalStore.dispatch(setTargetCarMarkerData(carmarkerData))
        globalStore.dispatch(setUserStatus(userStatus))
        this.carMarkerManager.handleNewCarsMarker([targetCar])
        const targetCarmarker = this.carMarkerManager.findMarkerById(targetCar.id)
        if (!targetCarmarker) {
            errorHandler('')
            return
        }
        if (userStatus === 'driving') {
            this.setNowLatlng([targetCar.latitude, targetCar.longitude])
            this.setViewToNowLatlng()
            this.carMarkerManager.setMarkerStyleWhenPickcar(targetCar.id)
            this.domManager.handleAddIntervalWhenPickupCar()
        } else if (userStatus === 'reservedCar') {
            targetCarmarker.setStyle(clickedMarkerStyle)
        }
    }
    setViewToNowLatlng() {
        this.map.setView(
            this.nowLatlng,
            this.map.getZoom(),
            { animate: false, noMoveStart: true }
        )
        this.handleGetNewCars()
    }
    async handleGetNewCars() {
        const currentBounds = this.map.getBounds()
        const newPolygonGeojson = convertBoundsToPolygon(currentBounds).toGeoJSON() as PolygonGeojson
        const diffPolygon = getDiffPolygonGeoJson(newPolygonGeojson, this.lastGetNewCarsPolygon.toGeoJSON() as PolygonGeojson)
        const result = await Api.post<PolygonGeojson, CarData[]>(`Car/get_cars_by_polygon`, diffPolygon)
        if (!result.isSuccess) {
            errorHandler("")
            return
        }
        const newCars = result.data
        this.carMarkerManager.handleNewCarsMarker(newCars)
        this.lastGetNewCarsPolygon.setLatLngs(convertBoundsToLatlngs(currentBounds))
    }
    setNowLatlng(latlng: L.LatLngTuple) {
        this.nowLatlng = latlng
        this.nowPositionCircle.setLatLng(latlng)
        globalStore.dispatch(setNowLatlngForStore(latlng))
    }
    moveCenterByKeyboardDirection(direction: "up" | "right" | "left" | "down") {
        const nextPosition = [this.nowLatlng[0], this.nowLatlng[1]] as L.LatLngTuple
        switch (direction) {//TODO
            case 'up':
                nextPosition[0] += MOVE_SPEED
                break;
            case 'right':
                nextPosition[1] += MOVE_SPEED
                break;
            case 'down':
                nextPosition[0] -= MOVE_SPEED
                break;
            case 'left':
                nextPosition[1] -= MOVE_SPEED
                break;
            default:
                errorHandler("")//TODO
        }
        this.setNowLatlng(nextPosition)
    }
    initListenKeyboard() {
        document.addEventListener('keydown', (event) => {
            switch (event.key.toLowerCase()) {
                case 'w':
                    this.keyState.w = true;
                    this.moveCenterByKeyboardDirection("up");
                    break;
                case 'a':
                    this.keyState.a = true;
                    this.moveCenterByKeyboardDirection("left");
                    break;
                case 's':
                    this.keyState.s = true;
                    this.moveCenterByKeyboardDirection("down");
                    break;
                case 'd':
                    this.keyState.d = true;
                    this.moveCenterByKeyboardDirection("right");
                    break;
            }
        });

        // 監聽鍵盤鬆開事件
        document.addEventListener('keyup', (event) => {
            switch (event.key.toLowerCase()) {
                case 'w':
                    this.keyState.w = false;
                    break;
                case 'a':
                    this.keyState.a = false;
                    break;
                case 's':
                    this.keyState.s = false;
                    break;
                case 'd':
                    this.keyState.d = false;
                    break;
            }
        });
    }
    initListenMapEvent() {
        const bindFn = this.handleGetNewCars.bind(this)
        this.map.addEventListener('zoom', bindFn)
        this.map.addEventListener('dragend', bindFn)
    }
}