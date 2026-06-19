// ─────────────────────────────────────────────────────────────
// Enums  (mirror prisma/schema.prisma)
// ─────────────────────────────────────────────────────────────

export type Role = 'BUSINESS_OWNER' | 'INVESTOR' | 'BUYER' | 'BUSINESS_EXPERT' | 'ADMIN'

export type BusinessStage = 'IDEA' | 'STARTUP' | 'GROWING' | 'EXPANDING' | 'MATURE'

export type BusinessStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED'

export type ListingType = 'INVESTMENT' | 'ACQUISITION' | 'PARTNERSHIP'

/** Mirrors Prisma `ConnectionRequestType` */
export type ConnectionRequestType = 'INVESTMENT' | 'BUYING'

/** @deprecated Use ConnectionRequestType */
export type ConnectionType = ConnectionRequestType

export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export type Industry =
  | 'TECHNOLOGY' | 'RETAIL' | 'MANUFACTURING' | 'FOOD_BEVERAGE'
  | 'REAL_ESTATE' | 'HEALTHCARE' | 'EDUCATION' | 'AGRICULTURE'
  | 'TEXTILE' | 'LOGISTICS' | 'HOSPITALITY' | 'FINANCE'
  | 'CONSTRUCTION' | 'MEDIA' | 'OTHER'

export type Province =
  | 'PUNJAB' | 'SINDH' | 'KPK' | 'BALOCHISTAN'
  | 'ISLAMABAD' | 'AJK' | 'GILGIT_BALTISTAN'

// ─────────────────────────────────────────────────────────────
// Core models
// ─────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  role: Role
  phone: string | null
  city: string | null
  province: Province | null
  bio: string | null
  avatarUrl: string | null
  verified: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

/** Safe public subset — never exposes password */
export type PublicUser = Omit<User, 'updatedAt'>

/** Minimal reference attached to related records */
export type UserRef = Pick<User, 'id' | 'name' | 'role' | 'verified' | 'city' | 'province'>

export interface Business {
  id: string
  title: string
  description: string
  stage: BusinessStage
  industry: Industry
  city: string
  province: Province
  listingType: ListingType
  askingPrice: number | null  // Decimal serialised as number in JSON
  revenue: number | null
  profit: number | null
  employees: number | null
  established: number | null
  highlights: string[]
  imageUrls: string[]
  videoUrl: string | null
  featured: boolean
  status: BusinessStatus
  isRegistered: boolean
  seekingOperator: boolean
  ownerId: string
  owner: UserRef
  createdAt: string
  updatedAt: string
  _count?: { connections: number; savedBy: number }
}

export interface InvestorProfile {
  id: string
  userId: string
  minInvestment: number | null
  maxInvestment: number | null
  preferredIndustries: Industry[]
  preferredProvinces: Province[]
  investmentThesis: string | null
  portfolioSize: number | null
  accredited: boolean
  createdAt: string
  updatedAt: string
}

export interface ConnectionRequest {
  id: string
  senderId: string
  receiverId: string
  businessId: string
  type: ConnectionRequestType
  status: ConnectionStatus
  message: string | null
  responseNote: string | null
  sender: UserRef
  receiver: UserRef
  business: Pick<Business, 'id' | 'title' | 'industry' | 'city'>
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  read: boolean
  sender: Pick<User, 'id' | 'name'>
  createdAt: string
  updatedAt: string
}

/** Conversation = all messages between two users, grouped client-side */
export interface Thread {
  partnerId: string
  partner: UserRef
  messages: Message[]
  unreadCount: number
  lastMessageAt: string
}

export interface SavedBusiness {
  id: string
  userId: string
  businessId: string
  note: string | null
  business: Business
  createdAt: string
}

// ─────────────────────────────────────────────────────────────
// Back-compat alias  (old pages used `Listing`, new schema calls it `Business`)
// ─────────────────────────────────────────────────────────────

export type Listing = Business

// ─────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pages: number
    limit: number
  }
}
