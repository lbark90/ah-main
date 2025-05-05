/**
 * This script checks if the JWT_PRIVATE_KEY environment variable is set
 * and if it's in the correct format
 */
const jwt = require('jsonwebtoken');

function checkJwtKey() {
  console.log('=== JWT Private Key Check ===');
  
  // Check if JWT_PRIVATE_KEY is set
  const privateKey = process.env.JWT_PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ JWT_PRIVATE_KEY environment variable is not set!');
    console.log('Please set this variable with your private key for webhook authentication.');
    return false;
  }
  
  console.log('✓ JWT_PRIVATE_KEY is set');
  
  // Format the key for testing
  let formattedKey = privateKey;
  if (!privateKey.includes('\n')) {
    console.log('Reformatting key (adding newlines)...');
    formattedKey = privateKey
      .replace('-----BEGIN PRIVATE KEY----- ', '-----BEGIN PRIVATE KEY-----\n')
      .replace(' -----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----')
      .replace(/\\n/g, '\n');
  }
  
  // Try to use the key to sign a JWT
  try {
    const testToken = jwt.sign({ test: 'data' }, formattedKey, { algorithm: 'RS256' });
    console.log('✓ Successfully created a test token with RS256 algorithm');
    console.log('Token preview:', testToken.substring(0, 40) + '...');
    return true;
  } catch (error) {
    console.error('❌ Failed to create JWT with private key:', error.message);
    console.log('Please check if your private key is in the correct format.');
    console.log('Hint: It should be an RSA private key in PEM format starting with "-----BEGIN PRIVATE KEY-----"');
    return false;
  }
}

checkJwtKey();
