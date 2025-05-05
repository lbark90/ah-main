import axios from 'axios';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

// Track recently sent webhooks to prevent duplicates
const recentWebhooks: Record<string, number> = {};
const DUPLICATE_PREVENTION_WINDOW = 30 * 1000; // 30 seconds in milliseconds

// Add your webhook URLs here (replace with your actual webhook URLs)
const webhookUrls = [
  "http://104.197.202.223:5678/webhook/c3c4b5b4-7b64-4c27-8161-f7cd29f58588",
  "http://104.197.202.223:5678/webhook/bb88961a-e279-4d20-a327-1ef2fd3f0036"
];

// Get the JWT token for webhook authentication
function getAuthToken() {
  try {
    // We know the private key file exists, so use it directly
    const privateKeyPath = path.join(process.cwd(), 'keys', 'webhook_private.key');
    try {
      const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
      const payload = {
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        iss: 'ah-webhook-sender',
        sub: 'webhook-auth',
      };
      console.log('Found webhook private key, generating token');
      return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    } catch (readError) {
      console.error('Error reading private key file:', readError);
    }

    // Fallback options if the file read fails
    if (process.env.WEBHOOK_SECRET) {
      const payload = {
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        iss: 'ah-webhook-sender',
        sub: 'webhook-auth',
      };
      return jwt.sign(payload, process.env.WEBHOOK_SECRET);
    }

    if (process.env.JWT_PRIVATE_KEY) {
      const payload = {
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        iss: 'ah-webhook-sender',
        sub: 'webhook-auth',
      };
      return jwt.sign(payload, process.env.JWT_PRIVATE_KEY, { algorithm: 'RS256' });
    }

    console.log('No webhook authentication method found');
    return null;
  } catch (error) {
    console.error('Error generating webhook token:', error);
    return null;
  }
}

// Function to add debug information to the webhook payload
function addDebugInfo(data: any) {
  return {
    ...data,
    timestamp: new Date().toISOString(),
    debug: {
      sentAt: new Date().toISOString(),
      userIdType: typeof data.userId,
      userIdValue: data.userId,
      isAuthenticated: !!data.userId
    }
  };
}

export async function sendWebhook(data: any) {
  if (!webhookUrls.length) {
    console.log('No webhook URLs configured');
    return { success: false, reason: 'No webhook URLs configured' };
  }

  // Create a key for duplicate prevention
  const webhookKey = `${data.userId}-${data.event}`;
  const now = Date.now();

  // Add debug information
  const enrichedData = addDebugInfo(data);
  console.log('Sending webhook with enriched data:', enrichedData);

  // Check for duplicate webhook
  if (webhookKey in recentWebhooks) {
    const lastSent = recentWebhooks[webhookKey];
    if (now - lastSent < DUPLICATE_PREVENTION_WINDOW) {
      console.log(`Duplicate webhook prevented for ${data.userId}, event: ${data.event}`);
      return { success: false, reason: 'Duplicate webhook prevented', timeSinceLastWebhook: now - lastSent };
    }
  }

  // Store this webhook in recent webhooks
  recentWebhooks[webhookKey] = now;

  // Clean up old entries from recentWebhooks
  Object.keys(recentWebhooks).forEach(key => {
    if (now - recentWebhooks[key] > DUPLICATE_PREVENTION_WINDOW) {
      delete recentWebhooks[key];
    }
  });

  // Send webhook to all configured URLs
  const results = await Promise.all(webhookUrls.map(async (url) => {
    try {
      // Get auth token from existing methods
      const token = data.token || getAuthToken();

      const response = await axios.post(url, enrichedData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : undefined
        }
      });

      return {
        success: response.status >= 200 && response.status < 300,
        statusCode: response.status,
        url
      };
    } catch (error) {
      console.error(`Error sending webhook to ${url}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        url
      };
    }
  }));

  const allSucceeded = results.every(result => result.success);

  return {
    success: allSucceeded,
    results,
    webhookCount: webhookUrls.length
  };
}
