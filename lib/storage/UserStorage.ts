
import fs from 'fs';
import path from 'path';

export interface UserData {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface UserSession {
  recordings: Array<{
    question: string;
    audioUrl: string;
    transcript: string;
  }>;
}

export class UserStorage {
  private static BASE_DIR = 'storage/users';

  static initialize(): void {
    if (!fs.existsSync(this.BASE_DIR)) {
      fs.mkdirSync(this.BASE_DIR, { recursive: true });
    }
  }

  static generateUserId(): string {
    const existingDirs = fs.readdirSync(this.BASE_DIR);
    const lastId = Math.max(...existingDirs.map(dir => parseInt(dir) || 0), 0);
    return (lastId + 1).toString().padStart(6, '0');
  }

  static saveUser(userData: UserData): string {
    const userId = this.generateUserId();
    const userDir = path.join(this.BASE_DIR, userId);
    
    // Create user directory
    fs.mkdirSync(userDir);
    
    // Save user info
    fs.writeFileSync(
      path.join(userDir, 'user.json'),
      JSON.stringify(userData, null, 2)
    );
    
    return userId;
  }

  static saveSession(userId: string, session: UserSession): void {
    const userDir = path.join(this.BASE_DIR, userId);
    
    // Save session data
    fs.writeFileSync(
      path.join(userDir, 'session.json'),
      JSON.stringify(session, null, 2)
    );
    
    // Create recordings directory
    const recordingsDir = path.join(userDir, 'recordings');
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir);
    }
  }

  static saveRecording(userId: string, index: number, audioBlob: Blob, transcript: string): void {
    const recordingsDir = path.join(this.BASE_DIR, userId, 'recordings');
    
    // Save audio file
    fs.writeFileSync(
      path.join(recordingsDir, `${userId}_question${index + 1}_${new Date().toISOString().replace(/[:.]/g, '-')}.wav`),
      Buffer.from(audioBlob)
    );
    
    // Save transcript
    fs.writeFileSync(
      path.join(recordingsDir, `transcript_${index}.txt`),
      transcript
    );
  }
}
