import React, { useState } from "react";
import { StyleSheet, Dimensions, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import type { Region } from "react-native-maps";
import { useClustering, type MapPoint } from "../../hooks/useClustering";
import { ClusterMarker } from "../../components/ClusterMarker";

// Mock-Daten: Events in Dithmarschen/Nordfriesland
const MOCK_EVENTS: MapPoint[] = [
  { id: "1", lat: 54.1459, lon: 8.8573, type: "event" }, // Heide
  { id: "2", lat: 54.1523, lon: 8.8612, type: "event" }, // Heide-Mitte
  { id: "3", lat: 54.1411, lon: 8.8491, type: "event" }, // Heide-Sued
  { id: "4", lat: 54.0928, lon: 8.9712, type: "event" }, // Meldorf
  { id: "5", lat: 54.0856, lon: 8.9643, type: "event" }, // Meldorf-Mitte
  { id: "6", lat: 54.2241, lon: 9.0183, type: "event" }, // Itzehoe Richtung
  { id: "7", lat: 54.3156, lon: 8.9023, type: "event" }, // Husum
  { id: "8", lat: 54.3089, lon: 8.8934, type: "event" }, // Husum-Sued
  { id: "9", lat: 54.1789, lon: 8.7234, type: "event" }, // Buesum Bereich
  { id: "10", lat: 54.0234, lon: 9.1023, type: "event" }, // Itzehoe
];

const INITIAL_REGION: Region = {
  latitude: 54.12,
  longitude: 8.85,
  latitudeDelta: 0.8,
  longitudeDelta: 0.8,
};

const { width, height } = Dimensions.get("window");

export default function MapScreen() {
  const [region, setRegion] = useState<Region>(INITIAL_REGION);

  const { clusters, supercluster } = useClustering(MOCK_EVENTS, region, {
    width,
    height,
  });

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        onRegionChangeComplete={setRegion}
      >
        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const coordinate = { latitude, longitude };
          const isCluster = cluster.properties.cluster === true;

          if (isCluster) {
            const pointCount = cluster.properties.point_count as number;
            const clusterId = cluster.properties.cluster_id as number;

            return (
              <ClusterMarker
                key={`cluster-${clusterId}`}
                coordinate={coordinate}
                pointCount={pointCount}
                onPress={() => {
                  const expansionZoom =
                    supercluster.getClusterExpansionZoom(clusterId);
                  setRegion((prev) => ({
                    ...prev,
                    latitude,
                    longitude,
                    latitudeDelta:
                      prev.latitudeDelta / Math.pow(2, expansionZoom - 10),
                    longitudeDelta:
                      prev.longitudeDelta / Math.pow(2, expansionZoom - 10),
                  }));
                }}
              />
            );
          }

          const id = cluster.properties.id as string;

          return (
            <Marker
              key={`event-${id}`}
              coordinate={coordinate}
              tracksViewChanges={false}
              pinColor="#2563EB"
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
