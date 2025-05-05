const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Webhook URLs to test
const webhookUrls = [
  "http://104.197.202.223:5678/webhook/bb88961a-e279-4d20-a327-1ef2fd3f0036",
  "http://104.197.202.223:5678/webhook/c3c4b5b4-7b64-4c27-8161-f7cd29f58588"
];

// Test data that matches what we're sending
const testData = {
  firstName: 'Test',
  lastName: 'User',
  userId: 'test_user_123',
  event: 'voice_missing'
};

// Get the private key from environment or file
function getPrivateKey() {
  // Try environment variable first
  if (process.env.JWT_PRIVATE_KEY) {
    console.log('Using private key from JWT_PRIVATE_KEY environment variable');
    const key = process.env.JWT_PRIVATE_KEY;
    return key.includes('\n') ? key : key.replace(/\\n/g, '\n');
  }
  
  // Then try file
  const keyPath = path.join(__dirname, '..', 'keys', 'webhook_private.key');
  if (fs.existsSync(keyPath)) {
    console.log(`Using private key from file: ${keyPath}`);
    return fs.readFileSync(keyPath, 'utf8');
  }
  
  return null;
}

// Write a sample JWT payload to a file for inspection
function writeDebugPayload(token) {
  try {
    const [header, payload] = token.split('.');
    const decodedHeader = Buffer.from(header, 'base64').toString();
    const decodedPayload = Buffer.from(payload, 'base64').toString();
    
    const debugInfo = {
      token: token.substring(0, 40) + '...',
      header: JSON.parse(decodedHeader),
      payload: JSON.parse(decodedPayload)
    };
    
    fs.writeFileSync(
      path.join(__dirname, '..', 'debug_token.json'), 
      JSON.stringify(debugInfo, null, 2)
    );
    console.log('Debug token info written to debug_token.json');
  } catch (error) {
    console.error('Error writing debug info:', error.message);
  }
}

async function testWebhooks() {
  console.log('=== Webhook Testing Tool ===');
  
  const privateKey = getPrivateKey();
  if (!privateKey) {
    console.error('No private key found! Please run setup-webhook-keys.sh first.');
    process.exit(1);
  }
  
  console.log('Found private key for signing');
  console.log('Key begins with:', privateKey.substring(0, 32) + '...');
  
  for (const url of webhookUrls) {
    console.log(`\nTesting webhook URL: ${url}`);
    
    // Create a JWT with RS256 algorithm
    try {
      console.log('Creating RS256 JWT with the private key...');
      
      const token = jwt.sign(testData, privateKey, { 
        algorithm: 'RS256',
        expiresIn: '1h'
      });
      
      // Write debug info for inspection
      writeDebugPayload(token);
      
      console.log('Sending webhook request...');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testData)
      });
      
      console.log(`Response: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`Response body: ${text}`);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      if (error.message.includes('secretOrPublicKey')) {
        console.log('\nPrivate key format issue detected. The key must be a valid PEM-encoded private key.');
        console.log('Please regenerate the keys using the setup script.');
      }
    }
  }
  
  console.log('\n=== Testing Complete ===');
}

testWebhooks().catch(console.error);
