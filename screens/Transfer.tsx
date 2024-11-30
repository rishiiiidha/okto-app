import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TransferProps = {
  navigation: any;
};

const Transfer: React.FC<TransferProps> = ({navigation}) => {
  const [network, setNetwork] = useState<string>('');
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const retrieveToken = async () => {
      try {
        const token = await AsyncStorage.getItem('okto_auth_token');
        console.log('Retrieved token:', token);

        if (token) {
          setAuthToken(token);
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
  }, [navigation]);

  const handleTransfer = async () => {
    if (!network || !tokenAddress || !amount || !recipient) {
      Alert.alert('Error', 'Please fill out all fields.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        'https://sandbox-api.okto.tech/api/v1/transfer/tokens/execute',
        {
          network_name: network.toUpperCase(),
          token_address: tokenAddress || '',
          quantity: amount,
          recipient_address: recipient,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log(response)
      // Handle successful transfer
      if (response.status === 200) {
        const orderId = response.data.data.orderId;
        Alert.alert(
          'Transfer Successful',
          `Order ID: ${orderId}\n\nNetwork: ${network}\nToken Address: ${tokenAddress}\nAmount: ${amount}\nRecipient: ${recipient}`,
        );

        // Reset fields
        setNetwork('');
        setTokenAddress('');
        setAmount('');
        setRecipient('');
      }
    } catch (error: any) {
      // Handle error
      Alert.alert(
        'Transfer Failed',
        error.response?.data?.message || 'An unexpected error occurred.',
      );
    } finally {
      // Stop loading
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transfer Tokens</Text>

      <TextInput
        style={styles.input}
        placeholder="Network Name "
        value={network}
        onChangeText={setNetwork}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Token Address "
        value={tokenAddress}
        onChangeText={setTokenAddress}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Amount"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <TextInput
        style={styles.input}
        placeholder="Recipient Address"
        value={recipient}
        onChangeText={setRecipient}
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleTransfer}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Transfer</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333333',
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Transfer;
