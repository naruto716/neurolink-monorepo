import { AuthProvider } from "@/context/AuthContext";
import { Tabs } from "expo-router";
import Ionicons from '@expo/vector-icons/Ionicons';

// Root layout wrapper that provides auth context
export default function RootLayout() {
  return (
    <AuthProvider>
      <TabsNavigator />
    </AuthProvider>
  );
}

// Tabs navigation component
function TabsNavigator() {
  return (
    <Tabs>
      <Tabs.Screen
        name="(auth)"
        options={{
          title: "Login",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'log-in' : 'log-in-outline'} color={color} size={24} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="(protected)"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={24} />
          ),
        }}
      />
      
      <Tabs.Screen 
        name="+not-found"
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}
