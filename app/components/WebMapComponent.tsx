import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PolygonPoint } from '../types';

interface WebMapComponentProps {
  points?: number[][];
  polygons?: PolygonPoint[][][];
  zoom: number;
  cameraCenter?: number[];
  userLocation?: number[];
}

const MOSCOW_CENTER: [number, number] = [37.6175, 55.7558];
// Для веб-версии используем локальный прокси на порту 8082
const MAPTILER_URL = 'http://localhost:8082/styles/basic-preview/style.json';

// Конвертация полигонов из формата PolygonPoint в GeoJSON
const convertPolygonsToGeoJSON = (polygons?: PolygonPoint[][][]) => {
  if (!polygons || polygons.length === 0) return null;

  const features = polygons.map((polygon, index) => {
    // Конвертируем каждый полигон в GeoJSON Feature
    // GeoJSON использует формат [longitude, latitude]
    const coordinates = polygon.map(ring =>
      ring.map(point => [point.longitude, point.latitude])
    );

    return {
      type: 'Feature',
      properties: {
        name: `Building ${index + 1}`
      },
      geometry: {
        type: 'Polygon',
        coordinates: coordinates
      }
    };
  });

  return {
    type: 'FeatureCollection',
    features: features
  };
};

export const WebMapComponent: React.FC<WebMapComponentProps> = ({
  points,
  polygons,
  zoom,
  cameraCenter,
  userLocation
}) => {
  const mapRef = useRef<HTMLDivElement>(null);

  // Получаем центр карты
  const getCenter = (): [number, number] => {
    if (cameraCenter && cameraCenter.length >= 2) {
      return [cameraCenter[0], cameraCenter[1]];
    }
    return MOSCOW_CENTER;
  };

  const center = getCenter();
  const geojsonData = convertPolygonsToGeoJSON(polygons);

  useEffect(() => {
    console.log('WebMapComponent mounted');
    console.log('Map Style URL:', MAPTILER_URL);
    console.log('Center:', center);
    console.log('Zoom:', zoom);
    console.log('Polygons:', polygons?.length || 0);
    console.log('User Location:', userLocation);

    // Создаем карту
    const map = new maplibregl.Map({
      container: mapRef.current!,
      style: MAPTILER_URL,
      center: [center[0], center[1]],
      zoom: zoom,
      attributionControl: false
    });

    map.on('load', () => {
      console.log('Map loaded successfully');

      // Добавляем полигоны
      if (geojsonData) {
        map.addSource('polygons', {
          type: 'geojson',
          data: geojsonData as any
        });

        map.addLayer({
          id: 'polygon-fill',
          type: 'fill',
          source: 'polygons',
          paint: {
            'fill-color': '#0080ff',
            'fill-opacity': 0.5
          }
        });

        map.addLayer({
          id: 'polygon-outline',
          type: 'line',
          source: 'polygons',
          paint: {
            'line-color': '#000080',
            'line-width': 2
          }
        });
      }

      // Добавляем маркер пользователя
      if (userLocation && userLocation.length >= 2) {
        const userMarkerEl = document.createElement('div');
        userMarkerEl.style.width = '20px';
        userMarkerEl.style.height = '20px';
        userMarkerEl.style.borderRadius = '50%';
        userMarkerEl.style.backgroundColor = '#4CAF50';
        userMarkerEl.style.border = '3px solid white';
        userMarkerEl.style.boxShadow = '0 0 10px rgba(0,0,0,0.3)';

        new maplibregl.Marker({ element: userMarkerEl })
          .setLngLat([userLocation[0], userLocation[1]])
          .addTo(map);
      }

      // Добавляем маркеры точек
      if (points) {
        points.forEach((point, index) => {
          if (point.length >= 2) {
            const pointMarkerEl = document.createElement('div');
            pointMarkerEl.style.width = '16px';
            pointMarkerEl.style.height = '16px';
            pointMarkerEl.style.borderRadius = '50%';
            pointMarkerEl.style.backgroundColor = '#FF5722';
            pointMarkerEl.style.border = '2px solid white';
            pointMarkerEl.style.boxShadow = '0 0 8px rgba(0,0,0,0.3)';

            new maplibregl.Marker({ element: pointMarkerEl })
              .setLngLat([point[0], point[1]])
              .addTo(map);
          }
        });
      }
    });

    map.on('error', (e) => {
      console.error('Map error:', e);
    });

    // Очистка при размонтировании
    return () => {
      map.remove();
    };
  }, [center, zoom, polygons, userLocation, points, geojsonData]);

  return (
    <View style={styles.container}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%'
  }
});

export default WebMapComponent;
