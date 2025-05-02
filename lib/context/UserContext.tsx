"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

export interface UserData {
  id?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  createdAt?: string;
  photoUrl?: string;
  photos?: string[];
  dateOfBirth?: string; // Added dateOfBirth property
}

interface UserContextType {
  user: UserData | null;
  setUser: React.Dispatch<React.SetStateAction<UserData | null>>;
  isLoading: boolean;
  registerUser: (userData: UserData) => Promise<void>;
  loginUser: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load user from local storage on initial load - but don't make API calls yet
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("aliveHereUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading user from local storage:", error);
      // If there's an error, clear the potentially corrupted storage
      localStorage.removeItem("aliveHereUser");
    }
  }, []);

  // Save user to local storage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("aliveHereUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("aliveHereUser");
    }
  }, [user]);

  const loginUser = async (username: string, password: string): Promise<boolean> => {
    try {
      // This should only be called explicitly during login, not automatically
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid username or password");
      }

      const data = await response.json();

      if (data.success && data.user) {
        setUser(data.user);
        return true;
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("aliveHereUser");
  };

  const registerUser = async (userData: UserData): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, loginUser, logout, registerUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
