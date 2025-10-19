 //  app/components/MapComponent.tsx
 import Map, { Layer, MapRef, Marker, Source } from "react-map-gl/maplibre";

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Простой заглушка для MapComponent
/* const MapComponent: React.FC = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Карта недоступна</Text>
    </View>
  );
};

export default MapComponent;
*/
import { Platform} from 'react-native';
import { PolygonPoint } from "../types";
import { MAP_URL } from "../contexts/GlobalContext";

export interface ViolationMarker {
    id: number;
    coordinate: number[];
    type: number; // 0 = замечание, 1 = нарушение
    rec_type: number; // 0 = обычное, 1 = остановочное
}

interface MapComponentProps {
    points?: number[][],
    polygons?: PolygonPoint[][][],
    zoom: number,
    cameraCenter?: number[],
    userLocation?: number[],
    violationMarkers?: ViolationMarker[],
    polygonColor?: string
}

export interface RawPolygonData {
  coordinates: PolygonPoint[][][]; // Array of polygons, each containing rings (outer + holes)
}

// Target format for MapLibre
export interface MapLibrePolygon {
  type: "Feature";
  geometry: {
    type: "Polygon";
    coordinates: number[][][]; // [polygon][ring][point][longitude, latitude]
  };
  properties: {
    name: string;
  };
}

// Convert a single PolygonPoint to [longitude, latitude]
const pointToArray = (point: PolygonPoint): number[] => {
  console.log("pointToArray: " + point.latitude, point.longitude)
  return [point.longitude, point.latitude];
};

// Convert a ring (array of PolygonPoints) to array of number[]
const ringToArray = (ring: PolygonPoint[]): number[][] => {
  console.log(ring.map(pointToArray))
  return ring.map(pointToArray);
};

// Convert a polygon (array of rings) to array of number[][]
const polygonToArray = (polygon: PolygonPoint[][]): number[][][] => {
  console.log(polygon.map(ringToArray))
  return polygon.map(ringToArray);
};

export const convertPolygonPointsToGeoJSONFeatures = (
  polygons?: PolygonPoint[][][],
  featureName: string = "Polygon"
): GeoJSON.Feature[] => {
  if (!polygons) {
    console.log("polygons is undefined");
    return [];
  }

  console.log("polygons:", polygons);
  console.log("polygons length:", polygons.length);

  const features = polygons.map((polygonRings, index) => {
    console.log(`Processing polygon ${index}:`, polygonRings);

    // Convert PolygonPoint[][][] to GeoJSON coordinate structure
    const coordinates: number[][][] = polygonRings.map((ring: PolygonPoint[]) => {
      return ring.map((point: PolygonPoint) => [point.longitude, point.latitude]);
    });

    console.log(`Converted coordinates for polygon ${index}:`, coordinates);

    if (!coordinates || coordinates.length === 0) {
      console.warn(`No valid coordinates for polygon ${index}`);
      return undefined;
    }

    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: coordinates
      },
      properties: {
        name: `${featureName} ${index + 1}`
      }
    } as GeoJSON.Feature;
  });

  console.log("Features before filtering:", features);
  
  // Filter out undefined values
  return features.filter((feature): feature is GeoJSON.Feature => feature !== undefined);
};

export const convertPolygonPointsToGeoJSON = (
  polygons?: PolygonPoint[][][],
  featureName: string = "Polygon"
): GeoJSON.FeatureCollection => {
  if (!polygons) {
    console.log("polygons is undefined");
    return {
      type: "FeatureCollection",
      features: []
    };
  }

  console.log("polygons:", polygons);
  console.log("polygons length:", polygons.length);

  const features = polygons.map((polygonRings, index) => {
    console.log(`Processing polygon ${index}:`, polygonRings);

    // Convert PolygonPoint[][][] to GeoJSON coordinate structure
    // and ensure each ring is closed (first point == last point)
    const coordinates: number[][][] = polygonRings.map((ring: PolygonPoint[]) => {
      if (ring.length === 0) {
        return [];
      }

      const coords = ring.map((point: PolygonPoint) => [point.latitude, point.longitude]);
      
      // Check if ring is already closed (first and last points are the same)
      const firstPoint = coords[0];
      const lastPoint = coords[coords.length - 1];
      const isClosed = firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
      
      if (!isClosed) {
        // Add the first point at the end to close the ring
        coords.push([...firstPoint]);
        console.log(`Closed ring for polygon ${index}, ring ${polygonRings.indexOf(ring)}`);
      } else {
        console.log(`Ring for polygon ${index}, ring ${polygonRings.indexOf(ring)} was already closed`);
      }
      
      return coords;
    }).filter(ring => ring.length > 0); // Filter out empty rings

    console.log(`Converted coordinates for polygon ${index}:`, coordinates);

    if (!coordinates || coordinates.length === 0) {
      console.warn(`No valid coordinates for polygon ${index}`);
      return undefined;
    }

    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: coordinates
      },
      properties: {
        name: `${featureName} ${index + 1}`
      }
    } as GeoJSON.Feature;
  });

  console.log("Features before filtering:", features);
  
  // Filter out undefined values
  const validFeatures = features.filter((feature): feature is GeoJSON.Feature => feature !== undefined);

  return {
    type: "FeatureCollection",
    features: validFeatures
  };
};

const CustomMarker = ({ isUserLocation = 'no' }) => {
  return (
    <View style={[styles.marker, { backgroundColor: 'blue' }]}>
      <View style={isUserLocation === 'yes' ? styles.markerUserLoc : styles.markerInner} />
    </View>
  );
};

const CustomMarkerView = (point: number[], id: string, isUserLocation: string, style?: string) => {
  // Coordinates should be [longitude, latitude]
  const coordinate: [number, number] = [point[0], point[1]];
  
  console.log(`Rendering point ${id} at:`, coordinate);
  
  return (
    <Marker
      key={`marker-${id}`}
      latitude={coordinate[1]}
      longitude={coordinate[0]}
      anchor={"bottom"}
      style={style === "violation" ? styles.markerViolationInner : styles.marker}
    >
      <CustomMarker isUserLocation={isUserLocation} />
    </Marker>
  );
};

function getPoints(points?: number[][], style?: string) {
  console.log("Rendering points:", points);
  if (!points || points.length === 0) return null;
  
  return points.map((point, index) => 
    CustomMarkerView(point, index.toString(), "no", style)
  );
}

function getViolationPoints(points?: ViolationMarker[], style?: string) {
  console.log("Rendering points:", points);
  if (!points || points.length === 0) return null;
  
  return points.map((point, index) => 
    CustomMarkerView(point.coordinate, index.toString(), "no", style)
  );
}

function getUserLocationPointer(location?: number[]) {
  console.log("location at the time of rendering:" + location)
  if (location == null)
    return null
   return CustomMarkerView(location, "userLocation", "yes")
}

  // Установка токена (может быть пустым для кастомного тайлового сервера)
  const MAPTILER_URL= MAP_URL + '/styles/basic-preview/style.json' 

  export const MapComponent = ({points, polygons, zoom, cameraCenter, userLocation, violationMarkers}: MapComponentProps) => {
 //    Функция для получения URL стиля карты
    const getStyleUrl = (): string => {
      if (Platform.OS === 'web') {
 //        Для веба используем прокси
        return 'http://192.168.88.193:8080/styles/basic-preview/style.json';
      }
 //      Для мобильных устройств - прямой URL
      return 'http://192.168.88.193:8080/styles/basic-preview/style.json';
    };

 //    Координаты Москвы [долгота, широта]
    const MOSCOW_CENTER: [number, number] = [37.6175, 55.7558];

//     ля веб-версии используем простой компонент, так как Mapbox может не работат
    const mapLibrePolygons = convertPolygonPointsToGeoJSON(polygons, "Building");

    return (
        <Map
       initialViewState={{
         latitude: cameraCenter ? cameraCenter[1] : MOSCOW_CENTER[0],
         longitude: cameraCenter ? cameraCenter[0] : MOSCOW_CENTER[1],
         zoom: zoom ? zoom : 2,
       }}
       style={{flex: 1 }}
       mapStyle={MAPTILER_URL}>
      <Source id="my-polygon-data" type="geojson" data={mapLibrePolygons}>
        <Layer
          id="my-polygon-fill"
          type="fill"
          paint={{
            'fill-color': '#007cbf',
            'fill-opacity': 0.5,
          }}
        />
        <Layer
          id="my-polygon-outline"
          type="line"
          paint={{
            'line-color': '#000',
            'line-width': 2,
          }}
        />
      </Source>
      {getPoints(points)}
      {getViolationPoints(violationMarkers, "violation")}
      
    </Map>
    );
  };



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
    markerViolationInner: {
    width: 12,
    height: 12,
    borderRadius: 4,
    backgroundColor: 'orange',
  },
  map: {
    flex: 1,
    width: '100%'
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  markerUserLoc: {
    width: 10,
    height: 10,
    borderRadius: 4,
    backgroundColor: 'blue',
  }
});

  export default MapComponent;