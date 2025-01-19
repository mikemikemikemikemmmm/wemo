import * as turf from '@turf/turf'
import * as L from "leaflet"
import { globalStore } from './store'
export type PolygonGeojson = GeoJSON.Feature<GeoJSON.Polygon>
export const getDiffPolygonGeoJson =
    (newP: PolygonGeojson, oldP?: PolygonGeojson):
        PolygonGeojson => {
        if (!oldP) {
            return newP
        }
        const diff = turf.difference(
            turf.featureCollection([
                newP,
                oldP
            ])
        );
        if (!diff) {
            return newP
        }
        return diff as PolygonGeojson
    }
export const convertBoundsToPolygon = (bounds: L.LatLngBounds) => {
    return L.polygon([[
        [bounds.getSouthWest().lat, bounds.getSouthWest().lng], // 南西角
        [bounds.getNorthWest().lat, bounds.getNorthWest().lng], // 西北角
        [bounds.getNorthEast().lat, bounds.getNorthEast().lng], // 东北角
        [bounds.getSouthEast().lat, bounds.getSouthEast().lng], // 东南角
        [bounds.getSouthWest().lat, bounds.getSouthWest().lng]  // 闭合
    ]]);
}
export const convertBoundsToLatlngs = (bounds: L.LatLngBounds): L.LatLngTuple[] => {
    return [
        [bounds.getSouthWest().lat, bounds.getSouthWest().lng], // 南西角
        [bounds.getNorthWest().lat, bounds.getNorthWest().lng], // 西北角
        [bounds.getNorthEast().lat, bounds.getNorthEast().lng], // 东北角
        [bounds.getSouthEast().lat, bounds.getSouthEast().lng], // 东南角
        [bounds.getSouthWest().lat, bounds.getSouthWest().lng]  // 闭合
    ];
}