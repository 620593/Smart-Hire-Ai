export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  company_name: string | null;
  roles: string[];
  is_active: boolean;
  is_verified: boolean;
  is_approved: boolean;
  created_at?: string | null;
  last_login?: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}


export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
    request_id?: string;
  };
}
