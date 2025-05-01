import { GoogleAuth } from 'google-auth-library';
import path from 'path';

export async function generateJWTToken() {
  try {
    const auth = new GoogleAuth({
      keyFilename: path.join(process.cwd(), 'google_credentials.json'),
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/dialogflow'
      ]
    });

    const client = await auth.getClient();
    const token = await client.getAccessToken();

    if (!token.token) {
      throw new Error('Failed to generate token');
    }

    return token.token;
  } catch (error) {
    console.error('Error generating GCP token:', error);
    throw error;
  }
}