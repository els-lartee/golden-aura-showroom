import { apiClient } from "@/lib/api";

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
};

export type UserProfile = {
  id: number;
  user: number;
  role: "admin" | "customer";
  phone?: string;
  avatar_url?: string;
};

export type MeResponse = {
  user: AuthUser;
  profile: UserProfile;
};

export const authApi = {
  register: (payload: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => apiClient.post<AuthUser>("/auth/register", payload),
  login: (payload: { username: string; password: string }) =>
    apiClient.post<AuthUser>("/auth/login", payload),
  logout: () => apiClient.post<void>("/auth/logout"),
  me: () => apiClient.get<MeResponse>("/me"),
  updateMe: (payload: Partial<MeResponse>) =>
    apiClient.put<MeResponse>("/me", payload),
};
