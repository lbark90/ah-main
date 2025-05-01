# Technical Summary of AliveHere.com

## Project Architecture

AliveHere.com is built as a Next.js application with a modern tech stack that enables a memorial service allowing users to create AI-powered digital representations of themselves for posthumous conversations. Here's a comprehensive technical breakdown:

### Core Technologies

- **Framework:** Next.js 15.1.4 (React-based framework)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Package Management:** pnpm
- **State Management:** React Context API
- **API Communication:** REST API endpoints

### Component Structure

The application follows a modular component architecture:

### Pages

- **Landing Page (src/app/page.tsx):** Introduction to the service with elegant, compassionate messaging
- **Registration Page (src/app/registration/page.tsx):** Collects user information
- **Interview Page (src/app/interview/page.tsx):** Manages the question-answer recording process
- **Conversation Page (src/app/conversation/page.tsx)**: Provides the AI conversation interface

### Components

- **Forms**
  - **RegistrationForm.tsx:** Handles user registration with field validation
- **Audio**
  - **AudioRecorder.tsx:** Manages microphone access, recording, pausing, and processing
  - **AudioVisualizer.tsx:** Provides visual feedback during recording
  - **ConversationUI.tsx:** Handles the AI conversation interface with visual equalizer

### Context Providers

- **UserContext.tsx:** Manages user registration data and authentication state
- **VoiceContext.tsx:** Handles voice cloning operations and state
- **AssistantContext.tsx:** Manages AI assistant creation and conversation state

### API Routes

- **'/api/socket/route.ts':** Handles audio processing and transcription requests

## Data Flow & Functionality

### User Registration Flow

1. User enters first, middle, last name, email, and phone number
2. Data is validated using react-hook-form with zod schema validation
3. User information is stored in UserContext and persisted in localStorage
4. User is redirected to the interview page

### Interview Recording System

1. User is presented with questions one at a time
2. AudioRecorder component captures audio via browser's MediaRecorder API
3. Audio chunks are sent to the server via REST API calls
4. Mock transcription is returned and displayed in real-time
5. Session progress is tracked and can be paused/resumed
6. Completed recordings are stored with their transcripts

### Voice Cloning Integration (Eleven Labs)

1. After interview completion, recordings are processed
2. Audio is prepared for voice cloning (simulated in current implementation)
3. VoiceContext manages the API calls to Eleven Labs
4. Voice clone ID is stored for future text-to-speech conversion

### AI Assistant Creation (VAPI)

1. Interview transcripts are used to generate a prompt for the AI assistant
2. AssistantContext manages the API calls to VAPI
3. Assistant is created with the cloned voice ID and generated prompt
4. Conversation state is managed for interactive dialogue

### Real-time Audio Processing

1. Originally implemented with Socket.io for WebSockets
2. Refactored to use REST API with polling for compatibility
3. Audio visualization provides feedback during recording
4. Transcription is displayed in real-time during recording

## Technical Challenges & Solutions

### Socket.io Compatibility

- **Challenge:** Socket.io dependency on Node.js 'fs' module caused errors in Next.js
- **Solution:** Replaced WebSocket implementation with REST API endpoints and polling

### Next.js Module Loading

- **Challenge:** Build process error with missing module './869.js'
- **Solution:** Cleaned Next.js cache and restarted development server

### State Persistence

- **Challenge:** Maintaining user progress across the multi-step process
- **Solution:** Implemented Context API providers with localStorage persistence

### Deployment Configuration

- **Development Server:** Next.js development server on port 3001
- **Temporary URL:** https://3001-i93s4x1xltfunu9o0jwen-081efb81.manus.computer
- **Build Process:** Optimized production build with Next.js

### Production Requirements (Future Implementation)

- **API Keys:** Secure storage for Eleven Labs and VAPI credentials
- **Database:** Replace localStorage with proper database (MongoDB, PostgreSQL)
- **Authentication:** Implement secure user authentication system
- **Storage:** Cloud storage for audio recordings and processing
- **Domain:** Configure AliveHere.com domain with SSL
- **Monitoring:** Error tracking and performance monitoring
- **Security:** Implement proper security headers and CORS policies

This implementation provides a complete demonstration of the memorial service concept with all requested features while maintaining an elegant, compassionate tone with a tech-focused aesthetic.
