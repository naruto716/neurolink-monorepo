import { Slot, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedLayout() {
  const { authTokens } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !authTokens) {
      // Only redirect after component is mounted
      router.replace('/(auth)/login');
    }
  }, [authTokens, isMounted, router]);

  // If no tokens, optionally return null or a loading screen
  // to avoid flicker while we redirect
  if (!authTokens) return null;

  // If user is authenticated, render child routes (Slot)
  return <Slot />;
} 