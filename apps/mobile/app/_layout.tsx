import { AuthProvider } from "@/context/AuthContext";
import AuthReduxSync from "@/components/AuthReduxSync";
import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { store } from "@neurolink/shared";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AuthReduxSync />
        <Stack>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </Provider>
  );
}