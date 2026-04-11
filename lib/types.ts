// User Roles
export type UserRole = "admin" | "studio" | "streamer"

// User Status
export type UserStatus = "active" | "inactive" | "suspended"

// Order Status
export type OrderStatus = "completed" | "failed" | "cancelled"

// Event Status
export type EventStatus = "draft" | "scheduled" | "live" | "completed" | "cancelled" | "on_break" | "ended"

// Stream Type (`pending` = created as draft / encoder not chosen yet)
export type StreamType = "rtmp" | "hls" | "youtube_api" | "youtube_embed" | "third_party" | "pending"

// Transaction Type
export type TransactionType = "credit" | "debit" | "transfer" | "purchase" | "refund"

// Payment Gateway
export type PaymentGateway = "razorpay" | "instamojo" | "cashfree" | "manual"

// DNS Status
export type DNSStatus = "pending" | "verified" | "failed"

// Landing Themes
export type LandingTheme = "modern_emerald" | "midnight_royal" | "rosewood_elegance" | "nordic_slate" | "sunset_orchard"

// Base User
  export interface User {
  id: string
  email: string
  name: string
  phone?: string
  /** Indian state code (e.g. KA) for GST billing */
  billingState?: string | null
  role: UserRole
  status: UserStatus
  avatar?: string
  createdAt: Date
  updatedAt: Date
  mockDataCleared?: boolean
  }

// Studio extends User with branding
  export interface Studio extends User {
  role: "studio"
  branding: StudioBranding
  domain?: CustomDomain
  walletBalance: number
  credits: StreamTypeCredits
  totalEvents: number
  studioSubscriptionExpiresAt?: string | null
  }

// Admin extends User
export interface Admin extends User {
  role: "admin"
  permissions: string[]
}

// Streamer (managed by admin)
export interface Streamer extends User {
  role: "streamer"
  studioId?: string
  walletBalance: number
  credits: StreamTypeCredits
  totalEvents: number
  eventsUsed: number
}

// Studio Branding
export interface StudioBranding {
  id: string
  studioId: string
  platformName: string
  logo?: string
  favicon?: string
  primaryColor: string
  secondaryColor: string
  supportEmail?: string
  supportPhone?: string
  termsUrl?: string
  privacyUrl?: string
  customCss?: string
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPassword?: string
  smtpFromEmail?: string
  smtpFromName?: string
  smtpSecure?: boolean
}

// Custom Domain
export interface CustomDomain {
  id: string
  studioId: string
  domain: string
  dnsStatus: DNSStatus
  sslEnabled: boolean
  verificationToken: string
  verifiedAt?: Date
  createdAt: Date
}

// Wallet
export interface Wallet {
  id: string
  userId: string
  balance: number
  currency: string
  createdAt: Date
  updatedAt: Date
}

// Transaction Category
export type TransactionCategory =
  | "top_up" // Wallet recharge
  | "credit_purchase" // Buying stream type credits from wallet
  | "service_charge" // AI image gen, whitelabel, domain charges
  | "order_refund"
  | "adjustment"
  | "manual_adjustment" // Admin adds/deducts funds manually
  | "payment_recovery" // Payment gateway success but wallet credit failed
  | "compensation" // Compensation for service issues
  | "correction" // Corrections for errors
  | "goodwill" // Goodwill credits
  | "ai_image_generation" // AI image generation charge
  | "whitelabel_hosting" // Annual whitelabel & hosting charge
  | "domain_registration" // Domain registration/renewal charge

// Enhanced Wallet Transaction with cascade support
export interface WalletTransaction {
  id: string
  walletId: string
  userId: string
  type: TransactionType
  category: TransactionCategory
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string
  referenceId?: string
  referenceType?: string
  creditPurchaseId?: string // Link to credit purchase if this was a credit buy

  baseAmount?: number // Amount without GST
  gstAmount?: number // GST portion
  gstPercentage?: number // GST % applied
  totalAmount?: number // Total including GST
  invoiceNumber?: string // INV-2025-00123
  invoiceGenerated?: boolean
  invoiceUrl?: string // PDF storage URL

  // NEW: For manual operations and refunds
  performedBy?: string
  performedByRole?: UserRole
  reason?: string
  notes?: string
  relatedRefundId?: string
  relatedEventId?: string
  relatedPaymentId?: string
  paymentGateway?: PaymentGateway
  supportTicketId?: string

  createdAt: Date
}

// Wallet Summary
export interface WalletSummary {
  balance: number
  totalCredits: number
  totalDebits: number
  lastTransaction?: WalletTransaction
  pendingAmount: number
}

// Order
export interface Order {
  id: string
  orderNumber: string
  userId: string
  user?: User
  orderType: "credit_purchase" | "validity_extension" | "wallet_recharge" | "service_charge"
  status: OrderStatus
  // For credit purchases
  streamType?: StreamTypeKey
  quantity: number
  unitPrice: number // Price per unit in paisa
  totalPrice: number // Total amount in paisa
  discountTierLabel?: string // Volume discount tier applied
  // For validity extensions
  eventId?: string
  validityDays?: number
  creditsCost?: number // Credits deducted (for validity extensions)
  // For service charges
  serviceType?: "ai_image" | "whitelabel_hosting" | "domain_registration" | "domain_renewal"
  // Payment info (for wallet recharges)
  paymentGateway?: PaymentGateway
  paymentId?: string
  // Failure tracking
  failureReason?: string
  insufficientFundsEntity?: string
  requiredAmount?: number
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  failedAt?: Date
}

// Live Event
export interface LiveEvent {
  id: string
  userId: string
  studioId?: string
  title: string
  /** Short optional line (e.g. hero tagline), shown above long description on watch pages */
  subtitle?: string
  description?: string
  thumbnail?: string
  streamType: StreamType
  streamKey?: string
  rtmpUrl?: string
  hlsUrl?: string
  youtubeUrl?: string
  youtubeChannelName?: string
  youtubeBroadcastId?: string
  youtubeStreamId?: string
  embedCode?: string
  status: EventStatus
  scheduledAt?: Date
  startedAt?: Date
  endedAt?: Date
  maxViewers: number
  currentViewers: number
  totalViews: number
  isPasswordProtected: boolean
  password?: string
  allowChat: boolean
  allowReactions: boolean
  createdAt: Date
  updatedAt: Date
  simulcastConfig?: SimulcastConfig
  /** Resolved for watch UI: platform → owning studio → default (set by /api/watch) */
  faviconHref?: string
  /** If true, this event should be shared via the studio's custom domain if available */
  useCustomDomain?: boolean
  /** The verified primary domain of the studio owning this event */
  primaryDomain?: string | null
  isMock?: boolean
  /** When true, public watch URL shows only the suspended notice (streamer/studio). */
  isSuspended?: boolean
  slug?: string
  publicUrl?: string
  crewPinHash?: string
  hasCrewPin?: boolean
}

// Event Analytics
export interface EventAnalytics {
  id: string
  eventId: string
  peakViewers: number
  totalViews: number
  uniqueViewers: number
  avgWatchTime: number // in seconds
  chatMessages: number
  reactions: number
  viewersByCountry: Record<string, number>
  viewersByDevice: Record<string, number>
}

// Payment Gateway Config
export interface PaymentGatewayConfig {
  id: string
  studioId?: string
  gateway: PaymentGateway
  isEnabled: boolean
  isDefault: boolean
  config: Record<string, string> // API keys, secrets, etc.
  createdAt: Date
  updatedAt: Date
}

// Platform Settings (Admin)
export interface PlatformSettings {
  id: string
  platformName: string
  logo?: string
  favicon?: string
  primaryColor: string
  defaultCurrency: string
  rtmpServerUrl: string
  hlsServerUrl: string
  maxEventsPerStreamer: number
  maxViewersPerEvent: number
  maintenanceMode: boolean
  imageGenerationPrice: number // in paisa, e.g. 500 = 5 INR
  platformDomain: string // admin's primary platform domain, e.g. "myplatform.io"
  studioCnameTarget: string // CNAME target for studio www records (set via NEXT_PUBLIC_PLATFORM_CNAME_TARGET or admin settings)
  studioAnnualSubscription: {
    price: number // Annual price in paisa for white-label + hosting
    enabled: boolean
  }
  createdAt: Date
  updatedAt: Date
  }

// Notification
export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  isRead: boolean
  readAt?: Date
  link?: string
  data?: Record<string, unknown>
  createdAt: Date
}

// Auth Context Types
export interface AuthState {
  user: User | Studio | Streamer | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Dashboard Stats
export interface AdminStats {
  totalRevenue: number
  totalStudios: number
  totalStreamers: number
  totalEvents: number
  activeEvents: number
  activeStudios: number
  revenueGrowth: number
  streamerGrowth: number
}

export interface StudioStats {
  walletBalance: number
  totalEvents: number
  activeEvents: number
  activeStreamers: number
  monthlyRevenue: number
}

export interface StreamerStats {
  walletBalance: number
  credits: StreamTypeCredits
  totalEvents: number
  activeEvents: number
  totalViews: number
  totalCreditsRemaining: number // Sum of all stream type credits
}

// ===== STREAM TYPE PRICING (Admin-set, single price) =====

export interface StreamTypePricing {
  rtmp: StreamTypePriceConfig
  youtube_api: StreamTypePriceConfig
  youtube_embed: StreamTypePriceConfig
  third_party: StreamTypePriceConfig
}

export interface StreamTypePriceConfig {
  basePrice: number // Price per event in paisa (single price, no cascade)
  enabled: boolean // Whether this stream type is available
  volumeDiscountTiers: VolumeDiscountTier[] // Quantity-based discounts
}

export interface VolumeDiscountTier {
  minQty: number // Minimum quantity to unlock this tier
  pricePerEvent: number // Discounted price per event in paisa
  label?: string // e.g. "Starter Pack", "Bulk Deal"
}

// Simulcast destination pricing (flat per-destination fee)
export interface SimulcastPricing {
  youtube: SimulcastPriceConfig
  facebook: SimulcastPriceConfig
  customRtmp: SimulcastPriceConfig
}

export interface SimulcastPriceConfig {
  price: number // Price per simulcast per event in paisa
  enabled: boolean
}

// ===== STREAM TYPE CREDITS (User balance per stream type) =====

export interface StreamTypeCredits {
  rtmp: number
  youtube_api: number
  youtube_embed: number
  third_party: number
}

// Credit purchase record (wallet -> credits)
export interface CreditPurchase {
  id: string
  userId: string
  streamType: StreamTypeKey
  quantity: number
  pricePerEvent: number // Price paid per credit in paisa
  totalPrice: number // Total wallet deduction in paisa
  discountTierApplied?: string // Label of the volume tier
  createdAt: Date
}

// Credit deduction record (credits -> event/validity)
export interface CreditDeduction {
  id: string
  userId: string
  streamType: StreamTypeKey
  amount: number // Number of credits deducted
  reason: "event_creation" | "validity_extension"
  eventId?: string
  validityDays?: number // For validity extensions
  createdAt: Date
}

// ===== EVENT VALIDITY (costs credits, not wallet) =====

export interface ValidityTier {
  days: number
  creditCost: number // Number of credits of that stream type to extend
  enabled: boolean
  label?: string // e.g. "60 Days (+1 credit)"
}

export interface EventValiditySettings {
  defaultDays: 30 // Always 30, free with event creation
  extendedTiers: ValidityTier[] // 60, 90, 180, 365
}

// ===== STREAMER CREDIT INVENTORY =====

export interface StreamerInventory {
  id: string
  userId: string
  credits: StreamTypeCredits
  totalPurchased: StreamTypeCredits // Lifetime purchased
  totalUsed: StreamTypeCredits // Lifetime used
  createdAt: Date
  updatedAt: Date
}

// Order line item
export interface OrderItem {
  id: string
  orderId: string
  streamType?: StreamTypeKey
  quantity: number
  unitPrice: number
  totalPrice: number
  description?: string
}

// Event Template
export interface EventTemplate {
  id: string
  name: string
  thumbnail: string
  /** Primary bucket for card gradient + default grouping */
  category: string
  /** Also list this template when the picker filters by these categories (e.g. faith weddings under Wedding + Religious) */
  extraCategories?: string[]
  isActive: boolean
  sortOrder: number
}

// TemplateData type for storing template-specific field values
export type TemplateData = Record<string, string | number | boolean | null>

// LiveEvent with templateData field
export interface LiveEventWithTemplate extends LiveEvent {
  templateData?: TemplateData
}

// Event Gallery
export interface EventGallery {
  id: string
  eventId: string
  imageUrl: string
  caption?: string
  sortOrder: number
}

// Event Comment
export interface EventComment {
  id: string
  eventId: string
  guestName: string
  message: string
  isApproved: boolean
  createdAt: Date
}

// Event Statistics
export interface EventStatistics {
  id: string
  eventId: string
  totalViews: number
  uniqueViewers: number
  peakConcurrent: number
  avgWatchTime: number
  chatMessages: number
  reactions: number
}

// Domain
export interface Domain {
  id: string
  userId: string
  domain: string
  verificationToken: string
  verificationStatus: "pending" | "verified" | "failed"
  sslStatus: "pending" | "active" | "failed"
  isPrimary: boolean
  dnsConfiguredVia?: "cloudflare" | "manual"
  cfRecordIds?: string[]
  verifiedAt?: Date
  createdAt: Date
}

// DNS Record Instructions
export interface DNSRecord {
  type: "A" | "CNAME" | "TXT"
  host: string
  value: string
  ttl: number
}

// Payment
export interface Payment {
  id: string
  userId: string
  orderNumber: string
  amount: number
  gstAmount: number
  totalAmount: number
  gateway: PaymentGateway
  status: "pending" | "success" | "failed"
  gatewayOrderId?: string
  gatewayPaymentId?: string
  failureReason?: string
  paidAt?: Date
  createdAt: Date
}

// Payment Gateway Option
export interface GatewayOption {
  id: PaymentGateway
  name: string
  logo: string
  description: string
  isEnabled: boolean
}

// Branding interface with all white-label fields
export interface Branding {
  id: string
  userId: string
  brandName: string
  companyLogo?: string
  companyLogoDark?: string
  favicon?: string
  themeColor: string
  accentColor: string
  email?: string
  phone?: string
  whatsapp?: string
  address?: string
  facebookUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  youtubeUrl?: string
  linkedinUrl?: string
  metaTitle?: string
  metaDescription?: string
  googleAnalyticsId?: string
  aboutUs?: string
  termsConditions?: string
  privacyPolicy?: string
  refundPolicy?: string
  preferredGateway?: PaymentGateway
  hasGatewayConfig: boolean
  // Landing page fields
  heroImage?: string
  aboutImage?: string
  services?: BrandingService[]
  eventTypes?: BrandingEventType[]
  stats?: BrandingStat[]
  testimonials?: BrandingTestimonial[]
  galleryImages?: BrandingGalleryImage[]
  selectedTheme?: LandingTheme
  smtpHost?: string
  smtpPort?: number
  smtpUser?: string
  smtpPassword?: string
  smtpFromEmail?: string
  smtpFromName?: string
  smtpSecure?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface BrandingService {
  id: string
  title: string
  description: string
  icon: string // lucide icon name
  enabled: boolean
}

export interface BrandingEventType {
  id: string
  title: string
  image?: string
  enabled: boolean
}

export interface BrandingStat {
  id: string
  value: string
  label: string
}

export interface BrandingTestimonial {
  id: string
  quote: string
  name: string
  eventType: string
  location: string
}

export interface BrandingGalleryImage {
  id: string
  src: string
  title: string
  category: string
}

// Email Template Type
export type EmailTemplateType =
  | "welcome"
  | "order_confirmation"
  | "payment_success"
  | "approval_request"
  | "event_created"
  | "event_live"
  | "password_reset"
  | "order_approved"
  | "order_rejected"
  | "low_balance"
  | "event_expiring"

// Email Template
export interface EmailTemplate {
  id: string
  type: EmailTemplateType
  name: string
  subject: string
  description: string
  variables: string[]
}

// YouTube Channel types for API integration
export interface YouTubeChannel {
  id: string
  ownerId: string
  ownerType: "admin" | "studio" | "streamer"
  channelId: string
  channelTitle: string
  channelThumbnail?: string
  subscriberCount?: number
  videoCount?: number
  /** Token status from API -- never exposes actual tokens to client */
  tokenStatus: "valid" | "expired"
  tokenExpiresAt?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// YouTube Broadcast linked to an event
export interface YouTubeBroadcast {
  id: string
  eventId: string
  youtubeChannelId: string
  broadcastId: string
  streamId: string
  rtmpUrl: string
  streamKey: string
  broadcastStatus: "created" | "ready" | "testing" | "live" | "complete" | "revoked"
  privacyStatus: "public" | "unlisted" | "private"
  enableDvr: boolean
  enableAutoStart: boolean
  enableAutoStop: boolean
  createdAt: Date
}

// YouTube API stream health
export interface YouTubeStreamHealth {
  status: "good" | "ok" | "bad" | "noData"
  lastUpdateTime: Date
  configurationIssues?: string[]
}

// Facebook Page/Channel for streaming
export interface FacebookPage {
  id: string
  ownerId: string
  ownerType: "admin" | "studio" | "streamer"
  pageId: string
  pageName: string
  pageThumbnail?: string
  accessToken: string
  tokenExpiresAt: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Custom RTMP destination
export interface CustomRtmpDestination {
  id: string
  name: string
  rtmpUrl: string
  streamKey: string
  platform?: "twitch" | "twitter" | "linkedin" | "other"
}

// Simulcast configuration for an event
export interface SimulcastConfig {
  enabled: boolean
  youtubeChannelId?: string
  youtubeSettings?: {
    privacyStatus: "public" | "unlisted" | "private"
    enableDvr: boolean
    enableAutoStart: boolean
    enableAutoStop: boolean
  }
  facebookPageId?: string
  facebookSettings?: {
    privacyStatus: "public" | "friends" | "only_me"
    title?: string
    description?: string
  }
  customDestinations: CustomRtmpDestination[]
}

export type StreamTypeKey = "rtmp" | "youtube_api" | "youtube_embed" | "third_party"

export type PricingModel = "pay_per_event" | "credits"

export interface SimulcastDestination {
  type: "youtube" | "facebook" | "custom_rtmp"
  name: string
  price: number
}

export interface PriceBreakdown {
  desiredWalletAmount: number // What user wants in wallet
  gstEnabled: boolean
  gstPercentage: number
  baseAmount: number // Amount that goes to wallet
  gstAmount: number // GST added on top
  totalPayable: number // Total user pays
  walletCreditAmount: number // Amount credited to wallet
}



export interface ValidityExtensionRequest {
  eventId: string
  extensionDays: number
  price: number
}

export interface DateChangeRequest {
  eventId: string
  newDate: Date
  reason?: string
  price: number
}

export interface DateChangePricing {
  withinSchedule: number // Before scheduled time
  afterScheduleLive: number // After scheduled but before going live
  afterLive: number // After going live (most expensive)
}

// Nimble Streamer Types
export interface NimbleStream {
  id: string
  eventId: string
  applicationName: string
  streamName: string
  rtmpUrl: string
  streamKey: string
  hlsPlaybackUrl: string
  dashPlaybackUrl: string
  status: "created" | "pending" | "live" | "stopped" | "error"
  isRecording: boolean
  publishCredentials?: {
    username: string
    password: string
  }
  transcodingEnabled: boolean
  transcodingProfiles?: string[]
  createdAt: Date
  startedAt?: Date
  stoppedAt?: Date
}

export interface NimbleRecording {
  id: string
  eventId: string
  streamId: string
  filename: string
  downloadUrl: string
  previewUrl?: string
  size: number // bytes
  duration: number // seconds
  format: "mp4" | "ts" | "flv"
  status: "recording" | "processing" | "ready" | "failed"
  createdAt: Date
  completedAt?: Date
}

export interface NimbleStreamStats {
  streamId: string
  isLive: boolean
  uptime: number // seconds
  bitrate: number // kbps
  resolution: string
  fps: number
  codec: {
    video: string
    audio: string
  }
  bytesIn: number
  bytesOut: number
  currentViewers: number
  peakViewers: number
  totalViews: number
  health: StreamHealth
}

export interface StreamHealth {
  status: "excellent" | "good" | "fair" | "poor" | "critical"
  score: number // 0-100
  issues: StreamHealthIssue[]
  lastCheck: Date
}

export interface StreamHealthIssue {
  type: "bitrate" | "fps" | "keyframe" | "connection" | "audio" | "video"
  severity: "warning" | "error"
  message: string
}

export type StreamingBackendType = "nimble" | "srs" | "nginx_rtmp" | "mediamtx"

export interface NimbleServerConfig {
  id: string
  name: string
  host: string
  rtmpPort: number
  httpPort: number
  apiPort: number
  isActive: boolean
  isPrimary: boolean
  maxStreams: number
  currentStreams: number
  region?: string
  backendType?: StreamingBackendType
  // Real-time health metrics
  uptime?: number // seconds
  activeStreams?: number
  totalClients?: number
  bandwidthIn?: number // Mbps
  bandwidthOut?: number // Mbps
  cpuUsage?: number // %
  memoryUsage?: number // %
  diskUsage?: number // %
}

export interface StreamPublishAuth {
  type: "none" | "basic" | "token"
  username?: string
  password?: string
  token?: string
  expiresAt?: Date
}

export interface StreamPlaybackAuth {
  type: "none" | "token" | "geo" | "referer"
  allowedDomains?: string[]
  allowedCountries?: string[]
  tokenSecret?: string
  tokenExpiry?: number // seconds
}

export interface TranscodingProfile {
  id: string
  name: string
  resolution: string
  bitrate: number
  fps: number
  codec: string
  isDefault: boolean
}



// Event Cancellation
export interface EventCancellation {
  id: string
  eventId: string
  cancelledBy: string
  cancelledByRole: UserRole
  reason: string
  reasonCategory: "streamer_request" | "technical_failure" | "admin_action" | "no_show" | "other"
  cancellationDate: Date
  eligibleForRefund: boolean
  refundPercentage: number // 0-100
  refundWindowExpiry: Date | null
  createdAt: Date
}

// Refund Request
export interface RefundRequest {
  id: string
  type: "event_cancellation" | "credit_refund" | "order_refund"

  // Reference tracking
  eventId?: string
  orderId?: string
  creditPurchaseId?: string

  // Financial details
  originalAmount: number
  refundAmount: number
  gstAmount: number
  totalRefundAmount: number

  // Transaction tracking
  relatedTransactionIds: string[]

  // Workflow
  status: "pending" | "approved" | "rejected" | "processing" | "completed" | "failed"
  requestedBy: string
  requestedByRole: UserRole
  requestedAt: Date

  approvedBy?: string
  approvedAt?: Date

  rejectedBy?: string
  rejectedAt?: Date
  rejectionReason?: string

  // Refund method
  refundMethod: "wallet" | "payment_gateway" | "manual"
  paymentGateway?: PaymentGateway
  originalPaymentId?: string
  refundTransactionId?: string

  // Completion
  completedAt?: Date
  failureReason?: string

  createdAt: Date
  updatedAt: Date
}



// Wallet Adjustment (Admin)
export interface WalletAdjustment {
  id: string
  targetUserId: string
  targetUserType: UserRole
  type: "credit" | "debit"
  amount: number
  reason: string
  category: "payment_recovery" | "compensation" | "correction" | "goodwill" | "manual_topup" | "other"

  initiatedBy: string
  initiatedAt: Date
  approvalRequired: boolean
  approvedBy?: string
  approvedAt?: Date

  transactionId?: string
  notes?: string

  // Links
  supportTicketId?: string
  paymentGatewayId?: string
  paymentGateway?: PaymentGateway

  createdAt: Date
  updatedAt: Date
}

// Payment Reconciliation Issue
export interface PaymentReconciliationIssue {
  id: string
  paymentId: string
  paymentGateway: PaymentGateway
  userId: string
  amount: number
  gstAmount: number
  totalAmount: number
  paymentStatus: "success" | "captured"
  paymentTimestamp: Date

  walletTransactionFound: boolean
  walletTransactionId?: string

  status: "unresolved" | "resolved" | "false_positive"
  resolvedBy?: string
  resolvedAt?: Date
  resolutionNotes?: string

  notificationSent: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PaymentGatewayTransaction {
  id: string
  paymentId: string // Gateway transaction ID
  gateway: PaymentGateway
  userId: string
  userName: string
  userEmail: string
  amount: number
  gstAmount: number
  totalAmount: number
  status: "success" | "failed" | "pending" | "captured"
  walletTransactionId?: string // Link to wallet transaction if credited
  createdAt: Date
  paidAt?: Date
  failureReason?: string
}

export interface UnmatchedPayment {
  id: string
  paymentId: string
  gateway: PaymentGateway
  userId: string
  userName: string
  userEmail: string
  amount: number
  status: "success" | "captured"
  issue: string
  reason: string
  detectedAt: Date
  resolved: boolean
}

export interface GSTConfiguration {
  id: string
  entityId: string // userId, studioId, or adminId
  entityType: UserRole
  gstType?: "individual" | "business_registered" | "business_unregistered"
  gstEnabled: boolean
  gstPercentage: number // 18, 12, 5, 28, etc.
  gstNumber?: string // GSTIN (15 characters)
  panNumber?: string // PAN card
  businessName: string
  businessAddress: string
  city: string
  state: string
  pincode: string
  createdAt: Date
  updatedAt: Date
}

export type InvoiceType = "gst_invoice" | "regular_invoice" | "credit_note"
export type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled"

export interface Invoice {
  id: string
  invoiceNumber: string // INV-2025-00123
  invoiceType: InvoiceType

  // Issuer (who generates invoice)
  issuerId: string
  issuerType: UserRole
  issuerBusinessName: string
  issuerGstNumber?: string
  issuerAddress: string

  // Recipient (who receives invoice)
  recipientId: string
  recipientType: UserRole
  recipientName: string
  recipientEmail: string
  recipientGstNumber?: string
  recipientAddress?: string

  // Financial details (all in paise)
  baseAmount: number // Amount without GST
  gstPercentage: number
  cgstAmount: number // Central GST (half of total for intrastate)
  sgstAmount: number // State GST (half of total for intrastate)
  igstAmount: number // Integrated GST (for interstate)
  totalGstAmount: number
  totalAmount: number // Total including GST

  // Transaction reference
  transactionId?: string
  paymentId?: string // Razorpay payment ID
  paymentMethod?: string
  paymentDate?: Date

  // Invoice metadata
  invoiceDate: Date
  dueDate?: Date
  status: InvoiceStatus
  notes?: string

  // File storage
  pdfUrl?: string // Generated PDF storage URL
  generatedAt?: Date

  createdAt: Date
  updatedAt: Date
}
