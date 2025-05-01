
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function debugElevenLabs() {
  console.log('Debug ElevenLabs API Connection');
  console.log('==============================');
  
  // Check environment
  const apiKey = process.env.ELEVEN_LABS_API;
  if (!apiKey) {
    console.error('Error: ELEVEN_LABS_API environment variable is not set');
    console.log('- Please make sure the API key is correctly set in Replit Secrets tool');
    return;
  }
  
  console.log('✓ ELEVEN_LABS_API environment variable is set');
  
  // Try to get voices list
  try {
    console.log('\nAttempting to fetch voices list from ElevenLabs...');
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey
      }
    });
    
    console.log('✓ Successfully connected to ElevenLabs API');
    console.log(`Found ${response.data.voices.length} voices`);
    
    // Check for the specific voice ID
    const targetVoiceId = 'BqVolG55J1XdqIXpATx4';
    const targetVoice = response.data.voices.find(v => v.voice_id === targetVoiceId);
    
    if (targetVoice) {
      console.log(`✓ Found target voice (${targetVoiceId}): ${targetVoice.name}`);
    } else {
      console.warn(`⚠ Target voice (${targetVoiceId}) not found in your account!`);
      console.log('Available voices:');
      response.data.voices.forEach(voice => {
        console.log(`- ${voice.voice_id}: ${voice.name}`);
      });
    }
    
    // Test TTS with the target voice
    console.log('\nTesting text-to-speech...');
    const ttsResponse = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`,
      {
        text: 'Hello, this is a test of the ElevenLabs API integration.',
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    
    console.log('✓ Successfully generated speech audio');
    console.log(`Received ${ttsResponse.data.length} bytes of audio data`);
    
    // Save the audio file for verification
    const debugDir = path.join(process.cwd(), 'debug');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir);
    }
    
    const audioPath = path.join(debugDir, 'test_audio.mp3');
    fs.writeFileSync(audioPath, Buffer.from(ttsResponse.data));
    console.log(`Saved test audio to: ${audioPath}`);
    
    console.log('\nElevenLabs API integration is working correctly!');
    
  } catch (error) {
    console.error('Error testing ElevenLabs API:');
    
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Headers:', error.response.headers);
      
      // Try to parse the response body
      if (error.response.data) {
        if (error.response.data instanceof Buffer) {
          try {
            const dataStr = error.response.data.toString('utf8');
            const jsonData = JSON.parse(dataStr);
            console.error('Response body:', jsonData);
          } catch (e) {
            console.error('Response body (raw):', error.response.data.toString('utf8').substring(0, 200));
          }
        } else {
          console.error('Response body:', error.response.data);
        }
      }
    } else {
      console.error(error.message);
    }
    
    console.log('\nTroubleshooting suggestions:');
    console.log('1. Verify the API key is correct and has not expired');
    console.log('2. Check your network connection to api.elevenlabs.io');
    console.log('3. Verify your ElevenLabs account has enough credits');
  }
}

// Run the debug function
debugElevenLabs().catch(err => {
  console.error('Unhandled error:', err);
});
