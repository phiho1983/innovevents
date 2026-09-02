import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "innovevents_access_token";
const REFRESH_TOKEN_KEY = "innovevents_refresh_token";

export async function getAccessToken() {
  return SecureStore.getItemAsync(
    ACCESS_TOKEN_KEY
  );
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(
    REFRESH_TOKEN_KEY
  );
}

export async function setTokens(
  access,
  refresh
) {
  if (!access) {
    throw new Error(
      "Jeton d'accès manquant."
    );
  }

  await SecureStore.setItemAsync(
    ACCESS_TOKEN_KEY,
    access
  );

  if (refresh) {
    await SecureStore.setItemAsync(
      REFRESH_TOKEN_KEY,
      refresh
    );
  }
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(
      ACCESS_TOKEN_KEY
    ),
    SecureStore.deleteItemAsync(
      REFRESH_TOKEN_KEY
    ),
  ]);
}