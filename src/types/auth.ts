export interface User {
  id: string;
  email: string;
  role: string;
  metadata?: {
    full_name?: string;
    avatar_url?: string;
    phone_number?: string;
    bio?: string;
    country?: string;
    gender?: string;
    credentials?: string;
  };
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
} 