import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Marker } from "react-native-maps";

interface ClusterMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  pointCount: number;
  onPress?: () => void;
}

export function ClusterMarker({
  coordinate,
  pointCount,
  onPress,
}: ClusterMarkerProps) {
  return (
    <Marker coordinate={coordinate} tracksViewChanges={false} onPress={onPress}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={styles.container}>
          <Text style={styles.text}>{pointCount}</Text>
        </View>
      </TouchableOpacity>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  text: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
});
