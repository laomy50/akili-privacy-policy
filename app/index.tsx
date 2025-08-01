import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import SplashComponent from './splash';

// Keep the splash visible while we do stuff
SplashScreen.preventAutoHideAsync();

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(async () => {
      // Hide the native splash screen
      await SplashScreen.hideAsync();
    }, 1000); // Quick transition to our custom splash

    return () => clearTimeout(timer);
  }, []);

  return <SplashComponent />;
}
