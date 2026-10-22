import React from 'react';
import { Redirect } from 'expo-router';
import { useAppStore } from '@/store/AppStore';

export default function Index() {
  const { state, hydrated } = useAppStore();
  if (!hydrated) return null;
  return <Redirect href={state.onboarded ? '/(tabs)' : '/onboarding'} />;
}
