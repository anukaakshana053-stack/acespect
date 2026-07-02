import * as SecureStore from 'expo-secure-store';

/**
 * Token persistence backed by the device keychain / keystore (expo-secure-store)
 * — NOT AsyncStorage, so tokens are encrypted at rest and not readable by other
 * apps. Values are small (JWT + 96-char refresh), well under the secure-store limit.
 */
const ACCESS_KEY = 'acespect.accessToken';
const REFRESH_KEY = 'acespect.refreshToken';

export const tokenStorage = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_KEY),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_KEY),

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
    ]);
  },

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};
