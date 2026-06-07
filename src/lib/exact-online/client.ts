import axios, { type AxiosInstance } from "axios";

const BASE_URL = process.env.EXACT_BASE_URL!;
const CLIENT_ID = process.env.EXACT_CLIENT_ID!;
const CLIENT_SECRET = process.env.EXACT_CLIENT_SECRET!;
const REDIRECT_URI = process.env.EXACT_REDIRECT_URI!;

export interface ExactTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
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
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
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
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return response.data;
}

export function createExactClient(accessToken: string, division: number): AxiosInstance {
  return axios.create({
    baseURL: `${BASE_URL}/${division}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });
}
