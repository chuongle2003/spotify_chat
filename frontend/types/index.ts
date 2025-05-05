// Define types based on the API schemas

export interface User {
  id: string
  username: string
  email: string
  first_name?: string
  last_name?: string
  profile_image?: string
  bio?: string
  is_admin?: boolean
  is_active?: boolean
  created_at?: string
  last_login?: string
  followers_count?: number
  following_count?: number
}

export interface PublicUser {
  id: string
  username: string
  profile_image?: string
  email?: string
}

export interface Album {
  id: string
  title: string
  artist: string
  release_date: string
  cover_image?: string
  description?: string
  created_at: string
}

export interface Song {
  id: string
  title: string
  artist: string
  album?: string
  genre?: string
  duration: number
  lyrics?: string
  audio_url?: string | null | undefined
  cover_image?: string | null | undefined
  play_count?: number
  likes_count?: number
}

export interface Playlist {
  id: string
  title: string
  description?: string
  cover_image?: string
  created_by: string
  created_at: string
  is_public: boolean
  songs?: Song[]
  followers_count?: number
}

export interface Genre {
  id: string
  name: string
  description?: string
}

export enum RatingEnum {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
}

export interface Rating {
  id: string
  user: string
  song?: string
  album?: string
  playlist?: string
  rating: RatingEnum
  created_at: string
}

export interface Comment {
  id: string
  user: string
  song?: string
  album?: string
  playlist?: string
  text: string
  created_at: string
}

export enum MessageTypeEnum {
  TEXT = "text",
  IMAGE = "image",
  AUDIO = "audio",
  MUSIC = "music",
}

export interface Message {
  id: string
  sender: string
  receiver: string
  content: string
  type: MessageTypeEnum
  created_at: string
  is_read: boolean
  shared_song?: Song 
}

export interface Conversation {
  id: string
  participants: User[]
  last_message?: Message
  created_at: string
  updated_at: string
}
