/**
 * This script generates a new RSA key pair for webhook signing
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function generateKeyPair() {
  console.log('=== Generating New RSA Keys for Webhook Authentication ===');
  
  // Create keys directory if it doesn't exist
  const keysDir = path.join(__dirname, '..', 'keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
    console.log(`Created directory: ${keysDir}`);
  }
  
  // Generate RSA private key using OpenSSL (better format than Node.js crypto)
  const privateKeyPath = path.join(keysDir, 'webhook_private.key');
  const publicKeyPath = path.join(keysDir, 'webhook_public.key');
  
  try {
    // Generate private key
    console.log('Generating RSA private key...');
    execSync(`openssl genrsa -out "${privateKeyPath}" 2048`);
    
    // Generate public key from private key
    console.log('Generating RSA public key...');
    execSync(`openssl rsa -in "${privateKeyPath}" -pubout -out "${publicKeyPath}"`);
    
    console.log(`Private key saved to: ${privateKeyPath}`);
    console.log(`Public key saved to: ${publicKeyPath}`);
    
    // Read the generated keys
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    
    console.log('\n=== Public Key (share this with the webhook service) ===');
    console.log(publicKey);
    
    console.log('\n=== Set up the private key as an environment variable ===');
    console.log('Run the following command to set the JWT_PRIVATE_KEY environment variable:');
    
    // Format the key for environment variable
    const formattedKey = privateKey.replace(/\n/g, '\\n');
    console.log(`\nexport JWT_PRIVATE_KEY='${formattedKey}'`);
    
    return { privateKey, publicKey };
  } catch (error) {
    console.error('Error generating keys:', error.message);
    if (error.message.includes('openssl')) {
      console.log('\nOpenSSL not found. Please install OpenSSL or use an alternative method.');
    }
    process.exit(1);
  }
}

generateKeyPair();
