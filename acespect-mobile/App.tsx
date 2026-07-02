import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { AuthProvider } from './src/context/AuthContext';
import { InspectionDraftProvider } from './src/context/InspectionDraftContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { database } from './src/db';

/**
 * App entry. Provider order: (database) -> safe area -> auth -> navigation.
 *
 * The WatermelonDB DatabaseProvider is only mounted when a real local database
 * exists — i.e. in a dev-client/standalone build. In Expo Go `database` is null
 * (the native SQLite adapter isn't available there), so we skip the provider and
 * the app still runs; photo persistence is simply inert until a dev client is built.
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
    return <DatabaseProvider database={database}>{tree}</DatabaseProvider>;
  }
  return tree;
}
