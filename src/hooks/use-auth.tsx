'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { mockUsers, mockFreelancerProfiles, mockClientProfiles } from '@/lib/mock-data';
import type { User, FreelancerProfile, ClientProfile } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string, role: 'client' | 'freelancer') => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (userId: string, userData: Partial<User>, profileData?: Partial<FreelancerProfile | ClientProfile>) => Promise<boolean>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    try {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        const loggedInUser = mockUsers.find((u) => u.id === storedUserId);
        if (loggedInUser) {
          setUser(loggedInUser);
        }
      }
    } catch (error) {
        console.error("Could not access local storage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    const foundUser = mockUsers.find(
      (u) => u.email === email && u.password === pass
    );
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('userId', foundUser.id);
      return true;
    }
    return false;
  };

  const signup = async (name: string, email: string, pass: string, role: 'client' | 'freelancer'): Promise<boolean> => {
    const existingUser = mockUsers.find((u) => u.email === email);
    if (existingUser) {
      return false; // User already exists
    }
    const newId = `user-${Date.now()}`;
    const newUser: User = {
      id: newId,
      name,
      email,
      password: pass,
      role,
      avatarUrl: `https://placehold.co/100x100.png?text=${name.charAt(0)}`,
    };
    mockUsers.push(newUser); 
    
    if (role === 'freelancer') {
        mockFreelancerProfiles.push({
            userId: newId,
            skills: ['Please add your skills'],
            bio: 'Please add your bio',
            hourlyRate: 0,
            portfolio: [],
        });
    } else {
        mockClientProfiles.push({
            userId: newId,
            companyName: name,
            projectsPosted: [],
        });
    }

    setUser(newUser);
    localStorage.setItem('userId', newUser.id);
    return true;
  };

  const updateUserProfile = async (userId: string, userData: Partial<User>, profileData?: Partial<FreelancerProfile | ClientProfile>): Promise<boolean> => {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) return false;

    // Update user object
    const updatedUser = { ...mockUsers[userIndex], ...userData };
    mockUsers[userIndex] = updatedUser;
    setUser(updatedUser);

    // Update role-specific profile
    if (profileData) {
        if (updatedUser.role === 'freelancer') {
            const profileIndex = mockFreelancerProfiles.findIndex(p => p.userId === userId);
            if (profileIndex !== -1) {
                mockFreelancerProfiles[profileIndex] = { ...mockFreelancerProfiles[profileIndex], ...(profileData as Partial<FreelancerProfile>) };
            }
        } else {
            const profileIndex = mockClientProfiles.findIndex(p => p.userId === userId);
            if (profileIndex !== -1) {
                mockClientProfiles[profileIndex] = { ...mockClientProfiles[profileIndex], ...(profileData as Partial<ClientProfile>) };
            }
        }
    }
    
    return true;
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('userId');
    router.push('/login');
  };

  const value = { user, isLoading, login, logout, signup, updateUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
