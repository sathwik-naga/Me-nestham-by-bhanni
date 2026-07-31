export type ContactStatus = 'new' | 'read' | 'replied' | 'archived' | 'deleted';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: ContactStatus;
  is_deleted: boolean;
  ip_address?: string | null;
  user_agent?: string | null;
  read_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateContactDto {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  ip_address?: string;
  user_agent?: string;
}

export interface ContactFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}
