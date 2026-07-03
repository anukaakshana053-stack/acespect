import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { InspectionDraftProvider } from './src/context/InspectionDraftContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { database } from './src/db';

/**
 * App entry. Provider order: (database) -> safe area -> auth -> navigation.
 *
 * `@nozbe/watermelondb/react` is required lazily, only when a real database
 * exists, because merely importing it touches WatermelonDB's native JSI
 * binding — which isn't installed in this build (the config plugin that wires
 * it into MainApplication.kt was removed for Expo SDK 54/new-arch
 * compatibility). A static top-level import here crashed the app on launch.
 */
export default function App() {
  const tree = (
    <SafeAreaProvider>
      <AuthProvider>
        <InspectionDraftProvider>
          <RootNavigator />
        </InspectionDraftProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );

  if (database) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DatabaseProvider } = require('@nozbe/watermelondb/react');
    return <DatabaseProvider database={database}>{tree}</DatabaseProvider>;
  }
  return tree;
}
