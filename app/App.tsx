import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';

import React from 'react';
import { Pressable, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './screens/HomeScreen';
import ArticleDetailScreen from './screens/ArticleDetailScreen';
import VocabularyScreen from './screens/VocabularyScreen';
import { Article } from './types/article';

export type RootStackParamList = {
  Home: undefined;
  ArticleDetail: { article: Article };
  Vocabulary: undefined;
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
                options={({ navigation }) => ({
                  title: '오늘의 일본 뉴스',
                  headerRight: () => (
                    <Pressable
                      onPress={() => navigation.navigate('Vocabulary')}
                      hitSlop={8}
                      style={{ paddingHorizontal: 8, paddingVertical: 4 }}
                    >
                      <Text style={{ fontSize: 14, color: '#1d4ed8', fontWeight: '600' }}>
                        📚 단어장
                      </Text>
                    </Pressable>
                  ),
                })}
              />
              <Stack.Screen
                name="ArticleDetail"
                component={ArticleDetailScreen}
                options={{ title: '기사 학습' }}
              />
              <Stack.Screen
                name="Vocabulary"
                component={VocabularyScreen}
                options={{ title: '단어장 (SRS 복습)' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="auto" />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
