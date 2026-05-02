import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
import ArticleDetailScreen from './screens/ArticleDetailScreen';
import { Article } from './types/article';

export type RootStackParamList = {
  Home: undefined;
  ArticleDetail: { article: Article };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerStyle: { backgroundColor: '#ffffff' },
                headerTintColor: '#1a1a1a',
                headerTitleStyle: { fontWeight: '600' },
              }}
            >
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: '오늘의 일본 뉴스' }}
              />
              <Stack.Screen
                name="ArticleDetail"
                component={ArticleDetailScreen}
                options={{ title: '기사 학습' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="auto" />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
