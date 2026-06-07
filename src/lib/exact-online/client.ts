import axios, { type AxiosInstance } from "axios";

export interface ExactTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Omgevingsvariabele ${key} is niet ingesteld`);
  return val;
}

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getEnv("EXACT_CLIENT_ID"),
    redirect_uri: getEnv("EXACT_REDIRECT_URI"),
    response_type: "code",
    force_login: "0",
    state,
  });
  return `https://start.exactonline.nl/api/oauth2/auth?${params}`;
}

export async function exchangeCodeForTokens(code: string): Promise<ExactTokens> {
  const response = await axios.post(
    "https://start.exactonline.nl/api/oauth2/token",
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getEnv("EXACT_REDIRECT_URI"),
      client_id: getEnv("EXACT_CLIENT_ID"),
      client_secret: getEnv("EXACT_CLIENT_SECRET"),
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return response.data;
}

export async function refreshAccessToken(refreshToken: string): Promise<ExactTokens> {
  const response = await axios.post(
    "https://start.exactonline.nl/api/oauth2/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: getEnv("EXACT_CLIENT_ID"),
      client_secret: getEnv("EXACT_CLIENT_SECRET"),
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return response.data;
}

export function createExactClient(accessToken: string, division: number): AxiosInstance {
  return axios.create({
    baseURL: `${getEnv("EXACT_BASE_URL")}/${division}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
}
