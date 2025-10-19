import { Platform, StyleSheet, View, Text } from "react-native";
import { PolygonPoint } from "../types";

// Условный импорт MapLibre только для нативных платформ
let MapLibreGL: any, MarkerView: any, ShapeSource: any, Camera: any, MapView: any, FillLayer: any, LineLayer: any;
let MAP_URL = '';

if (Platform.OS !== 'web') {
  const maplibre = require("@maplibre/maplibre-react-native");
  MapLibreGL = maplibre.default;
  MarkerView = maplibre.MarkerView;
  ShapeSource = maplibre.ShapeSource;
  Camera = maplibre.Camera;
  MapView = maplibre.MapView;
  FillLayer = maplibre.FillLayer;
  LineLayer = maplibre.LineLayer;
  MAP_URL = require("../contexts/GlobalContext").MAP_URL;
}

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
const MOSCOW_CENTER: [number, number] = [37.6175, 55.7558];
const MAPTILER_URL= MAP_URL + '/styles/basic-preview/style.json'

// Your input format type
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
  return [point.latitude, point.longitude];
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

// Main conversion function for your entire data structure
export const convertRawPolygonsToMapLibreFormat = (
  rawData?: RawPolygonData, 
  featureName: string = "Polygon"
): MapLibrePolygon[] => {
  console.log("rawData:", rawData);
  
  if (rawData == null) {
    console.log("rawData is null or undefined");
    return [];
  }
  
  console.log("rawData.coordinates:", rawData.coordinates);
  console.log("rawData.coordinates length:", rawData.coordinates.length);

  const result = rawData.coordinates.map((polygonRings, index) => {
    console.log(`Processing polygon ${index}:`, polygonRings);
    
    const coords = polygonToArray(polygonRings);
    console.log(`polygonToArray result for polygon ${index}:`, coords);
    
    if (!coords) {
      console.warn(`polygonToArray returned undefined for polygon ${index}`);
      return undefined;
    }
    
    return {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: coords
      },
      properties: {
        name: `${featureName} ${index + 1}`
      }
    };
  });

  console.log("Final result before filtering:", result);
  
  // Filter out undefined values
  return result.filter((item): item is MapLibrePolygon => item !== undefined);
};


const CustomMarker = ({ isUserLocation = 'no' }) => {
  if (isUserLocation === 'yes') {
    return (
      <View style={styles.userLocationContainer}>
        <View style={styles.userLocationPulse} />
        <View style={styles.userLocationDot} />
      </View>
    );
  }

  return (
    <View style={[styles.marker, { backgroundColor: 'blue' }]}>
      <View style={styles.markerInner} />
    </View>
  );
};

const CustomMarkerView = (point: number[], id: string, isUserLocation: string) => {
  // Coordinates should be [longitude, latitude]
  const coordinate: [number, number] = [point[0], point[1]];
  
  console.log(`Rendering point ${id} at:`, coordinate);
  
  return (
    <MarkerView
      key={`marker-${id}`}
      id={`marker-${id}`}
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <CustomMarker isUserLocation={isUserLocation} />
    </MarkerView>
  );
};

function getPoints(points?: number[][]) {
  console.log("Rendering points:", points);
  if (!points || points.length === 0) return null;
  
  return points.map((point, index) => 
    CustomMarkerView(point, index.toString(), "no")
  );
}

function getUserLocationPointer(location?: number[]) {
  console.log("location at the time of rendering:" + location)
  if (location == null)
    return null
   return CustomMarkerView(location, "userLocation", "yes")
}

export const MapComponent = ({points, polygons, zoom, cameraCenter, userLocation, violationMarkers, polygonColor = '#0080ff' }: MapComponentProps) => {
  // Для веб-версии используем WebMapComponent
  if (Platform.OS === 'web') {
    const WebMapComponent = require('./WebMapComponent').default;
    return (
      <WebMapComponent
        points={points}
        polygons={polygons}
        zoom={zoom}
        cameraCenter={cameraCenter}
        userLocation={userLocation}
      />
    );
  }

  if (polygons != null)
    console.log("Raw Polygons: " + polygons[0][0][0].latitude)
  const polys: RawPolygonData = {
    coordinates: polygons || []
  }
  const mapLibrePolygons = convertRawPolygonsToMapLibreFormat(polys, "Building");
  console.log("Canera center is at: " + cameraCenter)

  return (
    <MapView
      style={styles.map}
      mapStyle={MAPTILER_URL}>
      <Camera
        centerCoordinate={
          cameraCenter ? cameraCenter : MOSCOW_CENTER
        }
        zoomLevel={zoom}
        animationDuration={0}
      />

      {mapLibrePolygons.map((polygon, index) => (
        <ShapeSource
          key={`polygon-${index}`}
          id={`polygon-${index}`}
          shape={polygon}
        >
          {/* Layers MUST be inside ShapeSource */}
          <FillLayer
            key={`fill-${index}`}
            id={`fill-${index}`}
            sourceID={`polygon-${index}`} // This should match ShapeSource id
            style={{
              fillColor: polygonColor,
              fillOpacity: 0.5,
            }}
          />
          <LineLayer
            key={`line-${index}`}
            id={`line-${index}`}
            sourceID={`polygon-${index}`} // This should match ShapeSource id
            style={{
              lineColor: polygonColor,
              lineWidth: 2,
            }}
          />
        </ShapeSource>
      ))}

      {getUserLocationPointer(userLocation)}
      {getPoints(points)}
      {getViolationMarkers(violationMarkers)}
    </MapView>
  );
}

function getViolationMarkers(violationMarkers?: ViolationMarker[]) {
  console.log("Rendering violation markers:", violationMarkers);
  if (!violationMarkers || violationMarkers.length === 0) return null;

  return violationMarkers.map((marker) =>
    CustomViolationMarkerView(marker)
  );
}

const CustomViolationMarkerView = (marker: ViolationMarker) => {
  const coordinate: [number, number] = [marker.coordinate[0], marker.coordinate[1]];

  console.log(`Rendering violation marker ${marker.id} at:`, coordinate, 'type:', marker.type, 'rec_type:', marker.rec_type);

  return (
    <MarkerView
      key={`violation-marker-${marker.id}`}
      id={`violation-marker-${marker.id}`}
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <CustomViolationMarker type={marker.type} rec_type={marker.rec_type} />
    </MarkerView>
  );
};

const CustomViolationMarker = ({ type, rec_type }: { type: number; rec_type: number }) => {
  // Определяем цвет маркера: красный для остановочных, оранжевый для обычных
  const backgroundColor = rec_type === 1 ? '#F44336' : '#FF9800';
  // Определяем букву: Н - нарушение, З - замечание
  const letter = type === 1 ? 'Н' : 'З';

  console.log(`Marker: type=${type} (${letter}), rec_type=${rec_type}, color=${backgroundColor}`);

  return (
    <View style={[styles.violationMarkerContainer, { backgroundColor }]}>
      <Text style={styles.violationMarkerText}>{letter}</Text>
    </View>
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
  userLocationContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(33, 150, 243, 0.5)',
  },
  userLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  violationMarkerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  violationMarkerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default MapComponent;