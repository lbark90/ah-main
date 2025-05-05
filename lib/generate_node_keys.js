/**
 * Alternative key generation script that uses only Node.js
 * Use this if OpenSSL is not available
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function generateKeyPair() {
  console.log('=== Generating New RSA Keys using Node.js Crypto ===');
  
  // Create keys directory if it doesn't exist
  const keysDir = path.join(__dirname, '..', 'keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
    console.log(`Created directory: ${keysDir}`);
  }
  
  console.log('Generating RSA key pair...');
  
  // Generate new RSA key pair
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  
  // Save keys to files
  const privateKeyPath = path.join(keysDir, 'webhook_private.key');
  const publicKeyPath = path.join(keysDir, 'webhook_public.key');
  
  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);
  
  console.log(`Private key saved to: ${privateKeyPath}`);
  console.log(`Public key saved to: ${publicKeyPath}`);
  
  // Test JWT signing
  try {
    const jwt = require('jsonwebtoken');
    const testToken = jwt.sign({ test: true }, privateKey, { algorithm: 'RS256' });
    console.log('\n✅ Successfully tested JWT signing with the generated key');
  } catch (error) {
    console.error('\n❌ Error testing JWT signing:', error.message);
    console.log('The generated key might not be in the correct format for JWT signing.');
  }
  
  console.log('\n=== Public Key (share this with the webhook service) ===');
  console.log(publicKey);
  
  console.log('\n=== Set up the private key as an environment variable ===');
  console.log('Run the following command to set the JWT_PRIVATE_KEY environment variable:');
  console.log(`\nexport JWT_PRIVATE_KEY='${privateKey.replace(/\n/g, '\\n')}'`);
}

generateKeyPair();
