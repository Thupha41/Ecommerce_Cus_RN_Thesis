import { Platform, StatusBar } from 'react-native';
import Constants from 'expo-constants';
 
// Get the status bar height for different platforms
export const statusBarHeight = Platform.OS === 'ios' 
  ? Constants.statusBarHeight 
  : StatusBar.currentHeight || 0; 