import { MapManager } from './mapManager.ts'
const mapManager = new MapManager()
export const handleBtnGroupDisplay = mapManager.domManager.handleBtnGroupDisplay.bind(mapManager.domManager)