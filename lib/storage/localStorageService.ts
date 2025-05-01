import { Recording } from '../context/InterviewContext';

class LocalStorageService {
  private recordings: Recording[] = [];
  private readonly RECORDINGS_KEY = 'recordings';

  async saveRecording(recording: Recording): Promise<void> {
    try {
      this.recordings.push(recording);
    } catch (error: any) {
      console.error('Error saving recording:', error);
      throw new Error(error?.message || 'Failed to save recording');
    }
  }

  getSessionRecordings(): Recording[] {
    try {
      return this.recordings;
    } catch (error) {
      console.error('Error getting recordings:', error);
      return [];
    }
  }

  replaceRecording(index: number, recording: Recording): void {
    try {
      this.recordings[index] = recording;
    } catch (error: any) {
      console.error('Error replacing recording:', error);
      throw new Error(error?.message || 'Failed to replace recording');
    }
  }
}

export const localStorageService = new LocalStorageService();