// app/utils/locationUtils.ts

/**
 * Вычисляет расстояние между двумя точками используя формулу Haversine
 * @param lat1 Широта точки 1
 * @param lon1 Долгота точки 1
 * @param lat2 Широта точки 2
 * @param lon2 Долгота точки 2
 * @returns Расстояние в метрах
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Радиус Земли в метрах
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Расстояние в метрах
}

/**
 * Проверяет, находится ли точка внутри полигона (алгоритм Ray Casting)
 * @param point Точка для проверки {latitude, longitude}
 * @param polygon Массив точек полигона
 * @returns true если точка внутри полигона
 */
export function isPointInPolygon(
  point: { latitude: number; longitude: number },
  polygon: { latitude: number; longitude: number }[]
): boolean {
  let inside = false;
  const x = point.latitude;
  const y = point.longitude;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    // ВАЖНО: координаты в полигонах перепутаны местами в бэкенде
    // В объекте написано {latitude: 58.968, longitude: 53.398}, но на самом деле:
    // 58.968 - это longitude (долгота), 53.398 - это latitude (широта)
    const xi = polygon[i].longitude; // Меняем местами!
    const yi = polygon[i].latitude;  // Меняем местами!
    const xj = polygon[j].longitude; // Меняем местами!
    const yj = polygon[j].latitude;  // Меняем местами!

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Проверяет, находится ли пользователь на объекте - используя полигоны объекта
 * @param userLocation Локация пользователя
 * @param sitePolygons Полигоны объекта (PolygonPoint[][][])
 * @param siteCenter Центр объекта (для фолбэка, если нет полигонов)
 * @param accuracyBuffer Дополнительный буфер (по умолчанию 50м)
 * @returns true если пользователь на объекте, false иначе
 */
export function isUserOnSite(
  userLocation: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null,
  sitePolygons?: { latitude: number; longitude: number }[][][],
  siteCenter?: {
    latitude: number;
    longitude: number;
  } | null,
  accuracyBuffer: number = 50 // Буфер для учета погрешности GPS
): boolean {
  if (!userLocation) {
    console.log('Location check FAILED: No user location');
    return false;
  }

  console.log('=== DETAILED LOCATION CHECK ===');
  console.log('User Location:', {
    lat: userLocation.latitude,
    lon: userLocation.longitude,
    accuracy: userLocation.accuracy
  });

  // Если есть полигоны - проверяем нахождение внутри полигона с буфером
  if (sitePolygons && sitePolygons.length > 0) {
    console.log('Checking against site polygons...');
    console.log('Number of polygons:', sitePolygons.length);

    // Выводим первые несколько точек для отладки
    if (sitePolygons[0] && sitePolygons[0][0]) {
      console.log('First polygon sample points:', sitePolygons[0][0].slice(0, 3));
    }

    // Проходим по всем полигонам объекта
    for (let i = 0; i < sitePolygons.length; i++) {
      const multiPolygon = sitePolygons[i];

      for (let j = 0; j < multiPolygon.length; j++) {
        const polygon = multiPolygon[j];

        // Проверяем, находится ли пользователь внутри полигона
        const insidePolygon = isPointInPolygon(userLocation, polygon);

        if (insidePolygon) {
          console.log(`User is INSIDE polygon [${i}][${j}]`);
          console.log('=== LOCATION CHECK: ON SITE ===');
          return true;
        }

        // Если не внутри, проверяем расстояние до ближайшей точки полигона (с учетом буфера)
        let minDistance = Infinity;
        for (const point of polygon) {
          // ВАЖНО: координаты в полигонах перепутаны местами в бэкенде
          // point.latitude на самом деле содержит longitude, и наоборот
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            point.longitude, // Меняем местами!
            point.latitude   // Меняем местами!
          );
          minDistance = Math.min(minDistance, distance);
        }

        const totalBuffer = (userLocation.accuracy || 15) + accuracyBuffer;

        console.log(`Distance to polygon [${i}][${j}]: ${minDistance.toFixed(2)}m (buffer: ${totalBuffer.toFixed(2)}m)`);

        if (minDistance <= totalBuffer) {
          console.log(`User is NEAR polygon [${i}][${j}] (within buffer)`);
          console.log('=== LOCATION CHECK: ON SITE ===');
          return true;
        }
      }
    }

    console.log('User is NOT inside or near any polygon');
    console.log('=== LOCATION CHECK: OFF SITE ===');
    return false;
  }

  // Фолбэк: если нет полигонов, используем расстояние до центра
  if (siteCenter) {
    console.log('No polygons available, checking distance to center...');
    console.log('Site Center:', {
      lat: siteCenter.latitude,
      lon: siteCenter.longitude
    });

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      siteCenter.latitude,
      siteCenter.longitude
    );

    const allowedDistance = (userLocation.accuracy || 15) + accuracyBuffer + 50; // Увеличиваем буфер для центра

    console.log('Distance Calculation:', {
      distance: distance.toFixed(2) + 'm',
      allowedDistance: allowedDistance.toFixed(2) + 'm',
      isOnSite: distance <= allowedDistance
    });

    const result = distance <= allowedDistance;
    console.log(result ? '=== LOCATION CHECK: ON SITE ===' : '=== LOCATION CHECK: OFF SITE ===');
    return result;
  }

  console.log('No location data to check against');
  console.log('=== LOCATION CHECK: OFF SITE ===');
  return false;
}
