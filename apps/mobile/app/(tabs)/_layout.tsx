import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563EB",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Karte",
          tabBarIcon: ({ color, size }) => null,
        }}
      />
    </Tabs>
  );
}
