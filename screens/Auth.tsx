import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Button,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
} from 'react-native';
import {GoogleSignin, User} from '@react-native-community/google-signin';
import {useOkto} from 'okto-sdk-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RootStackParamList} from '../App';
import {NativeStackScreenProps} from '@react-navigation/native-stack';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId:
    '727452062096-ce6o67luq1rudeghfri8jv7bd4227cdj.apps.googleusercontent.com',

  offlineAccess: false,
});

type AuthScreenProps = NativeStackScreenProps<RootStackParamList, 'Auth'> & {
  route: {
    params: {
      setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
      setAuthToken: React.Dispatch<React.SetStateAction<string | null>>;
    };
  };
};

const Auth: React.FC<AuthScreenProps> = ({navigation, route}) => {
  const {setIsAuthenticated, setAuthToken} = route.params;
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authResult, setAuthResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const {authenticate} : any = useOkto();

  useEffect(() => {
    checkPreviousSignIn();
  }, []);
  const checkStoredTokens = async () => {
    try {
      const authToken = await AsyncStorage.getItem('okto_auth_token');
      const refreshToken = await AsyncStorage.getItem('okto_refresh_token');

      console.log('Stored Auth Token:', authToken);
      console.log('Stored Refresh Token:', refreshToken);
    } catch (error) {
      console.error('Error retrieving tokens:', error);
    }
  };

  // Call this method after authentication or in useEffect
  useEffect(() => {
    checkStoredTokens();
  }, []);

  const checkPreviousSignIn = async () => {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        setIsLoading(true);
        const user = await GoogleSignin.signInSilently();
        setUserInfo(user);
        handleOktoAuthentication(user);
      }
    } catch (error) {
      console.error('Previous sign-in check failed:', error);
      Alert.alert('Error', 'Failed to restore previous session');
    } finally {
      setIsLoading(false);
    }
  };

const handleOktoAuthentication = async (user: User) => {
  if (!user.idToken) {
    Alert.alert('Error', 'No ID token available');
    return;
  }

  authenticate(user.idToken, async (result: any, error: any) => {
    if (error) {
      console.error('Okto authentication error:', error);
      setAuthResult(JSON.stringify(error, null, 2));
      setAuthModalVisible(true);
      return;
    }

    if (result && result.auth_token) {
      try {
        await AsyncStorage.setItem('okto_auth_token', result.auth_token)
          .then(() => console.log('Auth token stored successfully'))
          .catch(storageError => {
            console.error('Failed to store auth token:', storageError);
            Alert.alert('Storage Error', 'Could not save authentication token');
          });

        if (result.refresh_auth_token) {
          await AsyncStorage.setItem(
            'okto_refresh_token',
            result.refresh_auth_token,
          )
            .then(() => console.log('Refresh token stored successfully'))
            .catch(storageError => {
              console.error('Failed to store refresh token:', storageError);
              Alert.alert('Storage Error', 'Could not save refresh token');
            });
        }

        setAuthResult(JSON.stringify(result, null, 2));
        setAuthModalVisible(true);

        setAuthToken(result.auth_token);
        setIsAuthenticated(true);
      } catch (storageError) {
        console.error('Unexpected storage error:', storageError);
        Alert.alert('Error', 'Failed to store tokens');
      }
    }
  });
};
const handleSignIn = async () => {
  try {
    setIsLoading(true);
    const hasPlayServices = await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
    console.log('Play services check:', hasPlayServices);

    const userInfo = await GoogleSignin.signIn();
    console.log('Sign in successful:', userInfo);
    handleOktoAuthentication(userInfo);
  } catch (error: any) {
    console.error('Detailed sign in error:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
    });
    Alert.alert(
      'Authentication Error',
      `Error Code: ${error.code}\nMessage: ${error.message}`,
    );
  } finally {
    setIsLoading(false);
  }
};

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await GoogleSignin.signOut();
      await AsyncStorage.multiRemove(['okto_auth_token', 'okto_refresh_token']);
      setUserInfo(null);
      setIsAuthenticated(false);
      setAuthToken(null);
    } catch (error) {
      console.error('Sign out error:', error);
      Alert.alert('Error', 'Failed to sign out');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Okto Demo</Text>

        <View style={styles.authSection}>
          {userInfo ? (
            <>
              <Text style={styles.welcomeText}>
                Welcome, {userInfo.user.givenName} {userInfo.user.familyName}
              </Text>
              <View style={styles.buttonSpacing} />
              <Button
                title="Sign Out"
                onPress={handleSignOut}
                disabled={isLoading}
              />
            </>
          ) : (
            <Button
              title="Sign in with Google"
              onPress={handleSignIn}
              disabled={isLoading}
            />
          )}
        </View>
      </View>

      {/* Authentication Result Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={authModalVisible}
        onRequestClose={() => setAuthModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Authentication Result</Text>
          </View>
          <ScrollView style={styles.modalContent} nestedScrollEnabled={true}>
            <Text style={styles.modalText}>{authResult}</Text>
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button title="Close" onPress={() => setAuthModalVisible(false)} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  authSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  buttonSpacing: {
    height: 15,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#333',
  },
  modalFooter: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

export default Auth;
