export type UserType = 'cliente' | 'worker'

export interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  user_type: UserType
  city: string | null
  state: string | null
  bio: string | null
  phone_number: string | null
  rating: number
  rating_count: number
  is_verified: boolean
  is_public: boolean
  cancellation_count: number
  has_warning: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  emoji: string
  description: string | null
}

export interface WorkerCategory {
  id: string
  worker_id: string
  category_id: string
  categories?: Category
}

export type ShiftStatus = 'open' | 'assigned' | 'completed' | 'cancelled'

export interface Shift {
  id: string
  client_id: string
  category_id: string
  title: string
  description: string | null
  location_address: string
  city: string
  state: string | null
  pay_amount: number
  pay_currency: string
  shift_date: string
  shift_start: string
  shift_end: string
  slots: number
  status: ShiftStatus
  latitude: number | null
  longitude: number | null
  expires_at: string | null
  created_at: string
  categories?: Category
  profiles?: Profile
}

export interface WorkerLocation {
  id: string
  worker_id: string
  latitude: number
  longitude: number
  is_available: boolean
  updated_at: string
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected'

export interface Application {
  id: string
  shift_id: string
  worker_id: string
  status: ApplicationStatus
  proposed_pay: number | null
  message: string | null
  created_at: string
  shifts?: Shift
  profiles?: Profile
}

export interface Review {
  id: string
  shift_id: string
  reviewer_id: string
  reviewed_id: string
  rating: number
  comment: string | null
  created_at: string
  profiles?: Profile
}

export interface Group {
  id: string
  name: string
  leader_id: string
  category_id: string
  city: string
  member_count: number
  created_at: string
  categories?: Category
  profiles?: Profile
}

export interface GroupMember {
  id: string
  group_id: string
  worker_id: string
  joined_at: string
  profiles?: Profile
}

export interface PortfolioPhoto {
  id: string
  worker_id: string
  photo_url: string
  caption: string | null
  created_at: string
}
