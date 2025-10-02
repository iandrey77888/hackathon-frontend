import { StyleSheet } from "react-native";
import MapLibreGL, { CircleLayer, LineLayer, MarkerView, PointAnnotation, ShapeSource, ShapeSourceRef, SymbolLayer } from "@maplibre/maplibre-react-native";
import { Camera, MapView, MapViewRef, FillLayer } from "@maplibre/maplibre-react-native";
import { MAP_URL } from "../contexts/GlobalContext";
import { View } from "react-native";
import { PolygonPoint } from "../types";

interface MobileMapComponentProps {
    points?: number[][],
    polygons?: PolygonPoint[][][],
    zoom: number,
    cameraCenter?: number[],
    userLocation?: number[]
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
  return (
    <View style={[styles.marker, { backgroundColor: 'blue' }]}>
      <View style={isUserLocation === 'yes' ? styles.markerUserLoc : styles.markerInner} />
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

export const MobileMapComponent = ({points, polygons, zoom, cameraCenter, userLocation}: MobileMapComponentProps) => {
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
            fillColor: '#0080ff',
            fillOpacity: 0.5,
          }}
        />
        <LineLayer
          key={`line-${index}`}
          id={`line-${index}`}
          sourceID={`polygon-${index}`} // This should match ShapeSource id
          style={{
            lineColor: '#000080',
            lineWidth: 2,
          }}
        />
      </ShapeSource>
    ))}
    
    {getUserLocationPointer(userLocation)}
    {getPoints(points)}
  </MapView> 
);
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
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

export default MobileMapComponent;