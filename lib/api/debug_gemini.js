
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const axios = require('axios');

// Function to test Gemini API connection
async function debugGeminiAPI() {
  console.log('Debug Gemini API Connection');
  console.log('==========================');
  
  // Check environment
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('⚠ GEMINI_API_KEY environment variable is not set');
    console.log('Checking for GCP credentials for Vertex AI...');
    
    const gcpKey = process.env.GCP_SA_KEY;
    if (!gcpKey) {
      console.error('⚠ GCP_SA_KEY environment variable is not set');
      console.log('- Please make sure either GEMINI_API_KEY or GCP_SA_KEY is correctly set in Replit Secrets tool');
      return;
    } else {
      console.log('✓ GCP_SA_KEY environment variable is set');
      console.log('Will use Vertex AI for Gemini access');
    }
  } else {
    console.log('✓ GEMINI_API_KEY environment variable is set');
  }
  
  try {
    // Try to generate a test response
    console.log('\nTesting Gemini response generation...');
    
    // Initialize the API client if we have a direct API key
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = "Write a haiku about digital memories.";
      console.log(`Test prompt: "${prompt}"`);
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      
      const response = result.response.text();
      console.log('✓ Successfully generated response:');
      console.log('\n---');
      console.log(response);
      console.log('---\n');
      
      console.log('Gemini API integration is working correctly!');
    } else {
      console.log('Skipping direct API test as GEMINI_API_KEY is not set');
      console.log('Please run a test using the conversation API endpoint');
    }
  } catch (error) {
    console.error('Error testing Gemini API:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the debug function
debugGeminiAPI().catch(console.error);
