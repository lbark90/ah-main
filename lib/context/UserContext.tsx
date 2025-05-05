'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the User type
export interface UserData {
  id: string;
  username?: string; // Add username field
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  phone?: string;
  dob?: string;
  photoUrl?: string;
}

// Define the context shape
interface UserContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  logout: () => void;
  isLoading: boolean;
  registerUser: (userData: UserData) => Promise<void>; // Add this line
}

// Create the context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Create provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from local storage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        // Check for user cookie first
        const userCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('userId='));

        if (userCookie) {
          const userId = userCookie.split('=')[1];
          console.log("Found user cookie with ID:", userId);
          // Fetch user data if we have a cookie
          fetch(`/api/user/login_credentials?userId=${userId}`)
            .then(res => res.json())
            .then(data => {
              if (!data.error) {
                const userData = {
                  id: data.userId,
                  username: data.userId,
                  firstName: data.firstName,
                  middleName: data.middleName || '',
                  lastName: data.lastName,
                  email: data.email,
                  phone: data.phoneNumber,
                  dob: data.dateOfBirth
                };
                setUserState(userData);
                localStorage.setItem('aliveHereUser', JSON.stringify(userData));
              }
              setIsLoading(false);
            })
            .catch(() => {
              setIsLoading(false);
            });
          return;
        }

        // Fall back to localStorage
        const storedUser = localStorage.getItem('aliveHereUser');
        if (storedUser) {
          console.log("Loading user from localStorage");
          setUserState(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Update user state and local storage
  const setUser = (newUser: UserData | null) => {
    // Log the incoming user data for debugging
    console.log('Setting user with ID:', newUser?.id);

    // Ensure username and id stay as the username/userId
    if (newUser) {
      // Don't build composite name - use exactly what's provided
      if (!newUser.id) {
        console.error('User object is missing ID field');
      }
    }

    setUserState(newUser);

    if (newUser) {
      localStorage.setItem('aliveHereUser', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('aliveHereUser');
    }
  };

  // Log out user
  const logout = async () => {
    try {
      // Call logout API
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      // Clear any auth cookies
      document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  };

  // Add registerUser function
  const registerUser = async (userData: UserData) => {
    try {
      // Set the user data
      setUser(userData);
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, isLoading, registerUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
