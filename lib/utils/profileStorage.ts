/**
 * Stores user profile information in localStorage for use with the conversation API
 */
export function saveUserProfile(userId: string, profileData: any) {
  try {
    // Add metadata about profile document location in GCP
    const profileWithMetadata = {
      ...profileData,
      profileDocument: `${userId}/profile/profile.json`,
      lastUpdated: new Date().toISOString()
    };

    localStorage.setItem(`userProfile_${userId}`, JSON.stringify(profileWithMetadata));
    console.log(`Saved profile data for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error saving user profile data:', error);
    return false;
  }
}

/**
 * Stores voice ID information in localStorage
 */
export function saveVoiceId(userId: string, voiceId: string) {
  try {
    const voiceData = {
      voiceId,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(`voiceData_${userId}`, JSON.stringify(voiceData));

    // Also update the profile data with the voice ID if it exists
    const profileData = getUserProfile(userId);
    if (profileData) {
      profileData.voiceId = voiceId;
      saveUserProfile(userId, profileData);
    }

    return true;
  } catch (error) {
    console.error('Error saving voice ID:', error);
    return false;
  }
}

/**
 * Retrieves user profile information from localStorage
 */
export function getUserProfile(userId: string) {
  try {
    const profileData = localStorage.getItem(`userProfile_${userId}`);
    if (!profileData) return null;
    return JSON.parse(profileData);
  } catch (error) {
    console.error('Error retrieving user profile data:', error);
    return null;
  }
}

/**
 * Retrieves voice ID from localStorage
 */
export function getVoiceId(userId: string) {
  try {
    const voiceData = localStorage.getItem(`voiceData_${userId}`);
    if (!voiceData) return null;
    const parsed = JSON.parse(voiceData);
    return parsed.voiceId || null;
  } catch (error) {
    console.error('Error retrieving voice ID:', error);
    return null;
  }
}
