// User Roles
export type UserRole = "admin" | "reseller" | "user"

// User Status
export type UserStatus = "active" | "inactive" | "suspended"

// Order Status
export type OrderStatus = "completed" | "failed" | "cancelled"

// Event Status
export type EventStatus = "draft" | "scheduled" | "live" | "completed" | "cancelled"

// Stream Type
export type StreamType = "rtmp" | "hls" | "youtube" | "embedded"

// Transaction Type
export type TransactionType = "credit" | "debit" | "transfer" | "purchase" | "refund"

// Payment Gateway
export type PaymentGateway = "razorpay" | "instamojo" | "cashfree" | "manual"

// DNS Status
export type DNSStatus = "pending" | "verified" | "failed"

// Base User
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: UserRole
  status: UserStatus
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

// Reseller extends User with branding
export interface Reseller extends User {
  role: "reseller"
  branding: ResellerBranding
  domain?: CustomDomain
  walletBalance: number
  totalEvents: number
}

// Admin extends User
export interface Admin extends User {
  role: "admin"
  permissions: string[]
}

// Regular User (managed by admin)
export interface EndUser extends User {
  role: "user"
  packageId?: string
  packageExpiresAt?: Date
  walletBalance: number
  totalEvents: number
  eventsUsed: number
}

// Reseller Branding
export interface ResellerBranding {
  id: string
  resellerId: string
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
}

// Custom Domain
export interface CustomDomain {
  id: string
  resellerId: string
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
  | "top_up"
  | "package_purchase"
  | "cascade_debit"
  | "order_refund"
  | "adjustment"
  | "commission"
  | "refund_reversal" // When reseller loses commission on refund
  | "manual_adjustment" // Admin adds/deducts funds manually
  | "payment_recovery" // Payment gateway success but wallet credit failed
  | "compensation" // Compensation for service issues
  | "correction" // Corrections for errors
  | "goodwill" // Goodwill credits

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
  cascadeLevel?: number // 0 = user, 1 = reseller, 2 = admin

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

// Cascade Transaction Result
export interface CascadeResult {
  userId: string
  userName: string
  userType: UserRole
  amount: number
  profit: number
  transactionId: string
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
  orderType: "package" | "validity" | "addon"
  status: OrderStatus
  unitPrice: number
  quantity: number
  totalPrice: number
  items?: OrderItem[]
  eventId?: string
  validityDays?: number
  paymentGateway?: PaymentGateway
  paymentId?: string
  failureReason?: string // Why the order failed
  insufficientFundsEntity?: string // Which entity lacked funds
  requiredAmount?: number // Amount required at failed entity
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  failedAt?: Date
}

// Live Event
export interface LiveEvent {
  id: string
  userId: string
  resellerId?: string
  title: string
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
  resellerId?: string
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
  maxEventsPerUser: number
  maxViewersPerEvent: number
  maintenanceMode: boolean
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
  user: User | Reseller | EndUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Dashboard Stats
export interface AdminStats {
  totalRevenue: number
  totalResellers: number
  totalUsers: number
  totalEvents: number
  activeEvents: number
  pendingOrders: number
  revenueGrowth: number
  userGrowth: number
}

export interface ResellerStats {
  walletBalance: number
  totalUsers: number
  activeUsers: number
  totalEvents: number
  activeEvents: number
  pendingOrders: number
  monthlyRevenue: number
  userGrowth: number
}

export interface UserStats {
  walletBalance: number
  totalEvents: number
  activeEvents: number
  totalViews: number
  packageName?: string
  packageExpiry?: Date
  eventsRemaining: number
}

// Package Interface Declaration
export interface Package {
  id: string
  name: string
  slug: string
  type: "event_pack" | "validity" | "addon" | "pay_per_event"
  pricingModel: PricingModel
  description: string
  price: number
  basePriceReseller: number
  basePriceUser: number
  duration: number
  maxEvents: number
  maxConcurrentViewers: number
  features: string[]
  isActive: boolean
  sortOrder: number
  minQty: number
  maxQty: number
  streamTypePricing?: StreamTypePricing
  simulcastPricing?: SimulcastPricing
  createdAt: Date
  updatedAt: Date
}

export interface StreamTypePricing {
  rtmp: StreamTypePriceLevel
  youtube_api: StreamTypePriceLevel
  youtube_embed: StreamTypePriceLevel
  third_party: StreamTypePriceLevel
}

  export interface StreamTypePriceLevel {
  adminCost: number // Platform cost (what admin pays)
  resellerPrice: number // What reseller pays to admin
  userPrice: number // What end user pays
  }

export interface SimulcastPricing {
  youtube: SimulcastPriceLevel
  facebook: SimulcastPriceLevel
  customRtmp: SimulcastPriceLevel
}

  export interface SimulcastPriceLevel {
  adminCost: number
  resellerPrice: number
  userPrice: number
  }

// Custom pricing per user
export interface CustomPrice {
  id: string
  packageId: string
  ownerId: string
  setById: string
  price: number
  createdAt: Date
  updatedAt: Date
}

// User package inventory
export interface UserInventory {
  id: string
  userId: string
  packageId: string
  package?: Package
  totalQty: number
  availableQty: number
  usedQty: number
  createdAt: Date
  updatedAt: Date
}

// Validity pricing tiers
export interface ValidityPrice {
  id: string
  packageId: string
  days: number
  priceReseller: number
  priceUser: number
  isActive: boolean
}

// Order line item
export interface OrderItem {
  id: string
  orderId: string
  packageId: string
  package?: Package
  quantity: number
  unitPrice: number
  totalPrice: number
}

// Event Template
export interface EventTemplate {
  id: string
  name: string
  thumbnail: string
  category: string
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
  createdAt: Date
  updatedAt: Date
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
  ownerType: "admin" | "reseller" | "user"
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
  ownerType: "admin" | "reseller" | "user"
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

export type PricingModel = "monthly" | "pay_per_event" | "credits" | "hybrid"

export interface EventPricing {
  streamType: StreamTypeKey
  streamTypePrice: number
  simulcastDestinations: SimulcastDestination[]
  simulcastTotal: number
  validityExtensionPrice: number
  dateChangePrice: number
  totalPrice: number
  breakdown: PriceBreakdown[]
}

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

export interface CascadeValidation {
  isValid: boolean
  totalRequired: number
  levels: CascadeLevel[]
  failedAt?: string
  failureReason?: string
}

export interface CascadeLevel {
  level: number
  entityId: string
  entityName: string
  entityType: UserRole
  currentBalance: number
  requiredAmount: number
  profitAmount: number
  hasEnough: boolean
}

export interface CascadeDebitRequest {
  userId: string
  eventId?: string
  orderId?: string
  streamType: StreamTypeKey
  simulcastDestinations: string[]
  description: string
}

export interface CascadeDebitResult {
  success: boolean
  totalDebited: number
  transactions: CascadeTransactionResult[]
  error?: string
}

export interface CascadeTransactionResult {
  transactionId: string
  entityId: string
  entityName: string
  entityType: UserRole
  amount: number
  profit: number
  balanceBefore: number
  balanceAfter: number
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

export interface BlockedSale {
  id: string
  userId: string
  userName: string
  userEmail: string
  packageId?: string
  packageName?: string
  streamType?: StreamTypeKey
  orderType: "package" | "pay_per_event"
  userPrice: number
  insufficientEntityId: string
  insufficientEntityName: string
  insufficientEntityType: UserRole
  requiredAmount: number
  currentBalance: number
  shortfall: number
  potentialProfit: number // Profit the entity would have made
  blockedAt: Date
  notified: boolean
}

export interface InsufficientFundsNotification extends Notification {
  type: "error"
  data: {
    userId: string
    userName: string
    packageName?: string
    streamType?: string
    shortfall: number
    requiredAmount: number
    currentBalance: number
    potentialProfit: number
    suggestedTopUp: number
  }
}

// Event Cancellation
export interface EventCancellation {
  id: string
  eventId: string
  cancelledBy: string
  cancelledByRole: UserRole
  reason: string
  reasonCategory: "user_request" | "technical_failure" | "admin_action" | "no_show" | "other"
  cancellationDate: Date
  eligibleForRefund: boolean
  refundPercentage: number // 0-100
  refundWindowExpiry: Date | null
  createdAt: Date
}

// Refund Request
export interface RefundRequest {
  id: string
  type: "event_cancellation" | "package_refund" | "order_refund"

  // Reference tracking
  eventId?: string
  orderId?: string
  packageId?: string

  // Financial details
  originalAmount: number
  refundAmount: number
  gstAmount: number
  totalRefundAmount: number

  // Cascade tracking
  cascadeTransactionIds: string[]

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

// Cascade Reversal
export interface CascadeReversal {
  id: string
  refundRequestId: string
  originalCascadeTransactionIds: string[]

  reversalTransactions: CascadeReversalTransaction[]

  status: "pending" | "in_progress" | "completed" | "failed" | "rolled_back"
  startedAt?: Date
  completedAt?: Date
  failureReason?: string
  createdAt: Date
}

// Individual reversal transaction
export interface CascadeReversalTransaction {
  id: string
  cascadeReversalId: string
  level: number
  entityId: string
  entityType: UserRole
  originalDebitAmount: number
  creditAmount: number
  originalProfit: number
  transactionId?: string
  status: "pending" | "completed" | "failed"
  createdAt: Date
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
  entityId: string // userId, resellerId, or adminId
  entityType: UserRole
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
