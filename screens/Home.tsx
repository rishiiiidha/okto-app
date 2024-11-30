import React, {useState, useEffect} from 'react';
import {View, Text, Button, StyleSheet, FlatList, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Wallet = {
  network_name: string;
  address: string;
};

type HomeProps = {
  navigation: any;
};

const Home: React.FC<HomeProps> = ({navigation}) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const retrieveToken = async () => {
      try {
        // Note: In the previous Auth screen, you were storing 'okto_auth_token'
        const token = await AsyncStorage.getItem('okto_auth_token');
        console.log('Retrieved token:', token);

        if (token) {
          setAuthToken(token);
          fetchWallets(token);
        } else {
          console.warn('No auth token found');
          Alert.alert('Authentication Error', 'Please log in again', [
            {text: 'OK', onPress: () => navigation.navigate('Auth')},
          ]);
        }
      } catch (error) {
        console.error('Error retrieving token:', error);
        Alert.alert('Error', 'Failed to retrieve authentication token');
      }
    };

    retrieveToken();
  }, []);

  const fetchWallets = async (token: string) => {
    try {
      const response = await fetch(
        'https://sandbox-api.okto.tech/api/v1/wallet',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const responseData = await response.json();
      console.log('Fetch wallets response:', responseData);

      if (responseData.status === 'success') {
        setWallets(responseData.data.wallets || []);
      } else {
        console.error('Fetch wallets failed:', responseData);
        Alert.alert('Error', responseData.message || 'Failed to fetch wallets');
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
      Alert.alert(
        'Network Error',
        'Unable to fetch wallets. Please try again.',
      );
    }
  };

  const createWallet = async () => {
    if (!authToken) {
      Alert.alert('Authentication Error', 'Please log in again');
      return;
    }

    try {
      const response = await fetch(
        'https://sandbox-api.okto.tech/api/v1/wallet',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const responseData = await response.json();
      console.log('Create wallet response:', responseData);

      if (responseData.status === 'success') {
        fetchWallets(authToken);
        Alert.alert('Success', 'Wallet created successfully');
      } else {
        console.error('Create wallet failed:', responseData);
        Alert.alert('Error', responseData.message || 'Failed to create wallet');
      }
    } catch (error) {
      console.error('Error creating wallet:', error);
      Alert.alert(
        'Network Error',
        'Unable to create wallet. Please try again.',
      );
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Create Wallet" onPress={createWallet} />
      <Button
        title="View Portfolio"
        onPress={() => navigation.navigate('Portfolio')}
      />
      <Button
        title="Transfer Tokens"
        onPress={() => navigation.navigate('Transfer')}
      />

      {wallets.length > 0 ? (
        <FlatList
          data={wallets}
          keyExtractor={item => item.network_name}
          renderItem={({item}) => (
            <View style={styles.walletItem}>
              <Text>Network: {item.network_name}</Text>
              <Text>Address: {item.address}</Text>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noWalletsText}>No wallets found</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  walletItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  noWalletsText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
  },
});

export default Home;
