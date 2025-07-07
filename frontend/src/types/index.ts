// User types
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  bio?: string;
  timezone?: string;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  is_online: boolean;
  last_seen?: string;
  created_at: string;
  updated_at: string;
}

// Team types
export interface Team {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  is_public: boolean;
  slug: string;
  avatar_url?: string;
  website?: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
  members?: TeamMember[];  // 添加成员字段
}

export interface TeamMember {
  id: number;
  user: User;  // 修改：直接包含用户信息，而不是user_id
  role: 'owner' | 'admin' | 'member' | 'guest';
  joined_at: string;
}

// Channel types
export interface Channel {
  id: number;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  is_active: boolean;
  is_archived: boolean;
  topic?: string;
  team_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  members?: ChannelMember[];
}

export interface ChannelMember {
  id: number;
  user: User;
  role: 'admin' | 'member';
  joined_at: string;
}

// Message types
export interface Message {
  id: number;
  content: string;
  is_edited: boolean;
  is_deleted: boolean;
  author_id: number;
  channel_id: number;
  parent_id?: number;
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  attachment_size?: number;
  created_at: string;
  updated_at: string;
  author: User;  // 必需的User对象，与后端MessageResponse匹配
  replies?: Message[];
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  full_name: string;
  password: string;
}

export interface UpdateUserRequest {
  full_name?: string;
  bio?: string;
  timezone?: string;
  avatar_url?: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

// Form types
export interface CreateTeamRequest {
  name: string;
  description: string;
  slug: string;
}

export interface CreateChannelRequest {
  name: string;
  description?: string;
  type: 'public' | 'private';
  topic?: string;
  team_id: number;
}

export interface SendMessageRequest {
  content: string;
  parent_id?: number;
}

// UI state types
export interface UIState {
  isLoading: boolean;
  error: string | null;
  activeTeam: number | null;
  activeChannel: number | null;
  sidebarOpen: boolean;
} 