export interface ProfileData {
  profilePicture?: string;
  badges?: Record<string, any>;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType: 'player' | 'venue_owner' | 'admin';
  role?: string;
  profileData?: ProfileData;
  trustScore?: number;
  eloRating?: number;
  totalMatchesPlayed?: number;
  currentStreak?: number;
  longestStreak?: number;
  badges?: string[];
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    token: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType?: string;
}
