import { Redirect } from "expo-router";

export default function RootIndex() {
  // Always redirect to the protected home - its layout will handle auth checks
  return <Redirect href="/(protected)" />;
}