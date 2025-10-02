//   //app/components/MapComponent.tsx
// import Map, { MapRef } from "react-map-gl/maplibre";

// import React from 'react';
// import { Platform} from 'react-native';

//   //Установка токена (может быть пустым для кастомного тайлового сервера)
//  const MAPTILER_URL='/map-proxy/styles/basic-preview/style.json' 

//  const MapComponent: React.FC = () => {
//     //Функция для получения URL стиля карты
//    const getStyleUrl = (): string => {
//      if (Platform.OS === 'web') {
//         //Для веба используем прокси
//        return 'http:192.168.88.193:8080/styles/basic-preview/style.json';
//      }
//       //Для мобильных устройств - прямой URL
//      return 'http:192.168.88.193:8080/styles/basic-preview/style.json';
//    };

//     //Координаты Москвы [долгота, широта]
//    const MOSCOW_CENTER: [number, number] = [37.6175, 55.7558];

//     //ля веб-версии используем простой компонент, так как Mapbox может не работат

//    return (
//        <Map
//       initialViewState={{
//         latitude: location ? MOSCOW_CENTER[0] : 0,
//         longitude: location ? MOSCOW_CENTER[1] : 0,
//         zoom: location ? 12 : 2,
//       }}
//       style={{flex: 1 }}
//       mapStyle={MAPTILER_URL
//       }
//     />
//    );
//  };

//  export default MapComponent;