import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Auth from './screens/Auth';
import Home from './screens/Home';
import Transfer from './screens/Transfer';
import Portfolio from './screens/Portfolio';
import {OktoProvider, BuildType} from 'okto-sdk-react-native';

export type RootStackParamList = {
  Auth: {
    setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
    setAuthToken: React.Dispatch<React.SetStateAction<string | null>>;
  };
  Home: undefined;
  Transfer: undefined;
  Portfolio: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();



const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

useEffect(() => {
  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      console.log('Retrieved token from AsyncStorage:', token);
      if (token) {
        setAuthToken(token);
        setIsAuthenticated(true);
      } else {
        console.log('No token found in AsyncStorage.');
      }
    } catch (error) {
      console.error('Error retrieving auth token:', error);
    }
  };
  checkAuthStatus();
}, []);
  
  useEffect(() => {
    const testAsyncStorage = async () => {
      try {
        await AsyncStorage.setItem('testKey', 'testValue');
        const value = await AsyncStorage.getItem('testKey');
        console.log('Test value from AsyncStorage:', value); // Should log "testValue"
      } catch (error) {
        console.error('AsyncStorage test failed:', error);
      }
    };
    testAsyncStorage();
  }, []);


  return (
    <OktoProvider
      buildType={BuildType.SANDBOX}
      apiKey="e987fc5b-e39b-4516-b9de-dc419f545684">
      <NavigationContainer>
        <Stack.Navigator>
          {!isAuthenticated ? (
            <Stack.Screen
              name="Auth"
              component={Auth}
              initialParams={{setIsAuthenticated, setAuthToken}}
            />
          ) : (
            <>
              <Stack.Screen name="Home" component={Home} />
              <Stack.Screen name="Transfer" component={Transfer} />
              <Stack.Screen name="Portfolio" component={Portfolio} />
              
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </OktoProvider>
  );
};

export default App;
