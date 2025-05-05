/**
 * Helper functions for managing user sessions and authentication
 */

import { cookies } from 'next/headers';

/**
 * Check if a user session exists by examining cookies
 */
export function checkUserSession() {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId');

  return {
    isAuthenticated: !!userId,
    userId: userId?.value
  };
}

/**
 * Get persistent debug information to help troubleshoot auth issues
 */
export function getAuthDebugInfo() {
  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    platform: process.platform,
    nodeVersion: process.version
  };
}

/**
 * Create consistent user object structure from different sources
 */
export function normalizeUserData(userData: any) {
  if (!userData) return null;

  return {
    id: userData.id || userData.userId || userData.username,
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    email: userData.email || '',
    // Add other fields as needed
  };
}
