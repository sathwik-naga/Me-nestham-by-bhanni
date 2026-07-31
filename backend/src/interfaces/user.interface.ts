export interface Profile {
  id: string;
  full_name?: string | null;
  role: 'customer' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'customer' | 'admin';
}
