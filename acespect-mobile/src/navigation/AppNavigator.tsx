import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppStackParamList } from './types';
import { SelectInspectionTypeScreen } from '../screens/inspection/SelectInspectionTypeScreen';
import { JobInformationScreen } from '../screens/inspection/JobInformationScreen';
import { InspectionSetupStep2Screen } from '../screens/inspection/InspectionSetupStep2Screen';
import { InspectionSectionsScreen } from '../screens/inspection/InspectionSectionsScreen';
import { DrivewaySectionScreen } from '../screens/inspection/DrivewaySectionScreen';
import { PavingPathsScreen } from '../screens/inspection/PavingPathsScreen';
import { FencesScreen, RetainingWallsScreen } from '../screens/inspection/StructureInspectionScreen';
import { GarageCarportScreen } from '../screens/inspection/GarageCarportScreen';
import { ElevationsScreen } from '../screens/inspection/ElevationsScreen';
import { RoofChimneyScreen } from '../screens/inspection/RoofChimneyScreen';
import { PoolSpaScreen } from '../screens/inspection/PoolSpaScreen';
import { InternalAreasScreen } from '../screens/inspection/InternalAreasScreen';
import { NotesPostProjectScreen } from '../screens/inspection/NotesPostProjectScreen';
import { ReportSummaryScreen } from '../screens/inspection/ReportSummaryScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SelectInspectionType" component={SelectInspectionTypeScreen} />
      <Stack.Screen name="JobInformation" component={JobInformationScreen} />
      <Stack.Screen name="InspectionSetupStep2" component={InspectionSetupStep2Screen} />
      <Stack.Screen name="InspectionSections" component={InspectionSectionsScreen} />
      <Stack.Screen name="DrivewaySection">
        {({ navigation }) => (
          <DrivewaySectionScreen
            onBack={() => navigation.goBack()}
            // Report completion back to the hub so progress updates.
            onComplete={() =>
              navigation.navigate({
                name: 'InspectionSections',
                params: { completedId: 'driveway' },
                merge: true,
              })
            }
            onGoHome={() => navigation.popToTop()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="PavingPaths">
        {({ navigation }) => (
          <PavingPathsScreen
            onBack={() => navigation.goBack()}
            onComplete={() =>
              navigation.navigate({
                name: 'InspectionSections',
                params: { completedId: 'paving_paths' },
                merge: true,
              })
            }
            onGoHome={() => navigation.popToTop()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Fences">
        {({ navigation }) => (
          <FencesScreen
            onBack={() => navigation.goBack()}
            onComplete={() =>
              navigation.navigate({ name: 'InspectionSections', params: { completedId: 'fences' }, merge: true })
            }
            onGoHome={() => navigation.popToTop()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="RetainingWalls">
        {({ navigation }) => (
          <RetainingWallsScreen
            onBack={() => navigation.goBack()}
            onComplete={() =>
              navigation.navigate({ name: 'InspectionSections', params: { completedId: 'retaining_walls' }, merge: true })
            }
            onGoHome={() => navigation.popToTop()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="GarageCarport">
        {({ navigation }) => (
          <GarageCarportScreen
            onBack={() => navigation.goBack()}
            onComplete={() =>
              navigation.navigate({ name: 'InspectionSections', params: { completedId: 'garage_carport_sheds' }, merge: true })
            }
            onGoHome={() => navigation.popToTop()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Elevations">
        {({ navigation }) => (
          <ElevationsScreen
            onBack={() => navigation.goBack()}
            onComplete={() =>
              navigation.navigate({ name: 'InspectionSections', params: { completedId: 'elevations' }, merge: true })
            }
            onGoHome={() => navigation.popToTop()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="RoofChimneys">
        {({ navigation }) => (
          <RoofChimneyScreen
            onBack={() => navigation.goBack()}
            onComplete={() =>
              navigation.navigate({ name: 'InspectionSections', params: { completedId: 'roof_chimneys' }, merge: true })
            }
            onGoHome={() => navigation.popToTop()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="PoolSpa">
        {({ navigation }) => (
          <PoolSpaScreen
            onBack={() => navigation.goBack()}
            onComplete={() =>
              navigation.navigate({ name: 'InspectionSections', params: { completedId: 'pool_spa' }, merge: true })
            }
            onGoHome={() => navigation.popToTop()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="InternalAreas">
        {({ navigation }) => (
          <InternalAreasScreen
            onBack={() => navigation.goBack()}
            onComplete={() =>
              navigation.navigate({ name: 'InspectionSections', params: { completedId: 'internal_areas' }, merge: true })
            }
            onGoHome={() => navigation.popToTop()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="NotesPostProject">
        {({ navigation }) => (
          <NotesPostProjectScreen
            onBack={() => navigation.goBack()}
            onComplete={() =>
              navigation.navigate({ name: 'InspectionSections', params: { completedId: 'notes_defects' }, merge: true })
            }
            onGoHome={() => navigation.popToTop()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="ReportSummary" component={ReportSummaryScreen} />
    </Stack.Navigator>
  );
}
