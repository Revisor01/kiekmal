import { useMemo } from "react";
import Supercluster from "supercluster";
import type { Region } from "react-native-maps";

export interface MapPoint {
  id: string;
  lat: number;
  lon: number;
  type: "event" | "congregation";
}

export function useClustering(
  points: MapPoint[],
  region: Region,
  mapDimensions: { width: number; height: number }
) {
  const supercluster = useMemo(() => {
    const sc = new Supercluster({ radius: 60, maxZoom: 16 });
    sc.load(
      points.map((p) => ({
        type: "Feature" as const,
        properties: { id: p.id, type: p.type },
        geometry: {
          type: "Point" as const,
          coordinates: [p.lon, p.lat] as [number, number],
        },
      }))
    );
    return sc;
  }, [points]);

  const clusters = useMemo(() => {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    const bbox: [number, number, number, number] = [
      longitude - longitudeDelta / 2,
      latitude - latitudeDelta / 2,
      longitude + longitudeDelta / 2,
      latitude + latitudeDelta / 2,
    ];
    const zoom = Math.round(Math.log2(360 / longitudeDelta));
    return supercluster.getClusters(bbox, zoom);
  }, [supercluster, region]);

  return { clusters, supercluster };
}
