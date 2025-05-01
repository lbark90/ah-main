
// Debug script for voice issues
const fs = require('fs');
const axios = require('axios');

async function debugVoice(userId = 'lbark90') {
  console.log('==== Voice Debug Tool ====');
  console.log(`Debugging voice for user: ${userId}`);
  
  // Check environment variables
  console.log('\n1. Checking environment variables:');
  const hasElevenLabsKey = process.env.ELEVEN_LABS_API ? '✓' : '✗';
  console.log(`ELEVEN_LABS_API: ${hasElevenLabsKey}`);
  
  // Check localStorage simulation
  console.log('\n2. Simulating localStorage check:');
  const voiceData = {
    voiceId: 'BqVolG55J1XdqIXpATx4',
    name: 'Lawrence Bark Voice',
    status: 'ready',
    createdAt: new Date().toISOString(),
    userId: 'lbark90',
    isElevenLabsVoice: true,
    elevenLabsData: {
      voice_id: 'BqVolG55J1XdqIXpATx4',
      name: "Lawrence Bark Voice",
      category: "custom"
    }
  };
  
  console.log('Sample voice data that should be in localStorage:');
  console.log(JSON.stringify(voiceData, null, 2));
  
  // Check API endpoints
  console.log('\n3. Testing voice API endpoints:');
  
  try {
    console.log('Testing /api/voice/check endpoint...');
    const checkResponse = await axios.get(`http://localhost:5000/api/voice/check?userId=${userId}`);
    console.log('Voice check response:', checkResponse.data);
    
    if (checkResponse.data.voiceId) {
      console.log('\nTesting /api/voice/fetch-from-elevenlabs endpoint...');
      const fetchResponse = await axios.get(`http://localhost:5000/api/voice/fetch-from-elevenlabs?voiceId=${checkResponse.data.voiceId}`);
      console.log('Voice fetch response:', fetchResponse.data);
      
      console.log('\nTesting /api/voice/speak endpoint...');
      const speakResponse = await axios.post('http://localhost:5000/api/voice/speak', {
        text: 'This is a test of the ElevenLabs integration.',
        voiceId: checkResponse.data.voiceId,
        userId: userId
      });
      
      console.log('Speech generation successful:', !!speakResponse.data.audio);
      
      // Save test audio for verification
      if (speakResponse.data.audio) {
        const buffer = Buffer.from(speakResponse.data.audio, 'base64');
        fs.mkdirSync('debug', { recursive: true });
        fs.writeFileSync('debug/test_voice.mp3', buffer);
        console.log('Test audio saved to debug/test_voice.mp3');
      }
    }
  } catch (error) {
    console.error('API testing error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
  
  console.log('\n==== Debug Complete ====');
}

// Run the debug function
debugVoice();
#!/usr/bin/env node

const fs = require('fs');
const { exec } = require('child_process');

// Get user ID from local storage or command line
async function main() {
  console.log('Voice Debug Tool');
  console.log('================');

  // Check for command line arguments
  let userId = process.argv[2];

  if (!userId) {
    // No command line argument, try to read from localStorage in a browser context
    console.log('No user ID provided via command line, checking for current logged in user...');
    
    try {
      const { execSync } = require('child_process');
      // Run python script to get a list of users from GCS bucket
      const output = execSync('python -c "from google.cloud import storage; client = storage.Client.from_service_account_json(\'google_credentials.json\'); bucket = client.bucket(\'memorial-voices\'); blobs = list(bucket.list_blobs(delimiter=\'/\')); print(\'\\n\'.join([b.name.rstrip(\'/\') for b in blobs if b.name.endswith(\'/\')]));"');
      
      const users = output.toString().trim().split('\n');
      console.log('Found users in GCS bucket:', users);

      if (users.length > 0) {
        userId = users[0];
        console.log(`Using first user ID: ${userId}`);
      } else {
        console.log('No users found in GCS bucket');
        process.exit(1);
      }
    } catch (error) {
      console.error('Error getting users from GCS:', error);
      process.exit(1);
    }
  }

  console.log(`Checking voice for user: ${userId}`);

  // Test API connection
  console.log('\nTesting voice check API...');
  exec(`curl -s "http://localhost:5000/api/voice/check?userId=${userId}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error calling voice check API: ${error.message}`);
      return;
    }
    
    try {
      const response = JSON.parse(stdout);
      console.log('Voice check API response:', JSON.stringify(response, null, 2));
      
      if (response.exists) {
        console.log('\nVoice exists:');
        console.log(`Voice ID: ${response.voiceId}`);
        console.log(`Is ElevenLabs Voice: ${response.isElevenLabsVoice ? 'Yes' : 'No'}`);
        
        // Test ElevenLabs connection if it's an ElevenLabs voice
        if (response.isElevenLabsVoice) {
          console.log('\nTesting ElevenLabs connection...');
          exec(`node lib/audio/debug_elevenlabs.js ${response.voiceId}`, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error checking ElevenLabs: ${error.message}`);
              return;
            }
            console.log(stdout);
          });
        }
        
        // Testing speaking with the voice
        console.log('\nTesting voice speak endpoint...');
        const testText = "This is a test of the voice system.";
        exec(`curl -s -X POST "http://localhost:5000/api/voice/speak" -H "Content-Type: application/json" -d '{"text":"${testText}","voiceId":"${response.voiceId}","userId":"${userId}"}'`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error calling speak API: ${error.message}`);
            return;
          }
          
          try {
            const speakResponse = JSON.parse(stdout);
            console.log(`Speak API response success: ${!speakResponse.error}`);
            if (speakResponse.error) {
              console.error(`Error: ${speakResponse.error}`);
            } else {
              console.log('Generated audio data length:', speakResponse.audio ? speakResponse.audio.length : 'None');
            }
          } catch (e) {
            console.error('Invalid JSON response from speak API:', e);
            console.log('Raw response:', stdout);
          }
        });
      } else {
        console.log('\nVoice does not exist. Running check script...');
        // Run Python debug script
        exec(`python lib/storage/debug_voice_files.py ${userId}`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error running debug script: ${error.message}`);
            return;
          }
          console.log(stdout);
        });
      }
    } catch (e) {
      console.error('Invalid JSON response from API:', e);
      console.log('Raw API response:', stdout);
    }
  });
}

main().catch(console.error);
