import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import { Platform, View } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#0095F6', // Instagram blue
                tabBarInactiveTintColor: '#262626', // Instagram text color
                headerTitle: '', // Remove title text
                headerStyle: {
                    height: 10, // Make header thinner
                },
                tabBarBackground: () => (
                    Platform.OS === 'ios' ? (
                        <BlurView
                            tint="light"
                            intensity={80}
                            style={{ flex: 1, borderRadius: 100 }}
                        />
                    ) : (
                        <View
                            style={{
                                flex: 1,
                                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                borderRadius: 100
                            }}
                        />
                    )
                ),
                tabBarStyle: {
                    position: 'absolute',
                    borderRadius: 100,
                    marginHorizontal: 40,
                    marginBottom: 16,
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOpacity: 0.1,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 15,
                    height: 60,
                    overflow: 'hidden',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: '',
                    headerStyle: {
                        height: 10,
                    },
                    headerTransparent: true,
                    headerBackground: () => (
                        Platform.OS === 'ios' ? (
                            <BlurView
                                tint="light"
                                intensity={80}
                                style={{ flex: 1 }}
                            />
                        ) : (
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                }}
                            />
                        )
                    ),
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
                    ),
                }}
            />
            <Tabs.Screen
                name="about"
                options={{
                    title: '',
                    headerStyle: {
                        height: 40,
                    },
                    headerTransparent: true,
                    headerBackground: () => (
                        Platform.OS === 'ios' ? (
                            <BlurView
                                tint="light"
                                intensity={80}
                                style={{ flex: 1 }}
                            />
                        ) : (
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                }}
                            />
                        )
                    ),
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'search' : 'search-outline'} color={color} size={24} />
                    ),
                }}
            />
        </Tabs>
    );
}