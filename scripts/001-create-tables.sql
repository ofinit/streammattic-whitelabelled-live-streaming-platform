-- StreamLivee Phase 1: Core Tables
-- 12 tables for PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM Types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'reseller', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('completed', 'failed', 'cancelled', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_status AS ENUM ('draft', 'scheduled', 'live', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE stream_type AS ENUM ('rtmp', 'hls', 'youtube', 'embedded', 'youtube_api', 'youtube_embed', 'third_party');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('credit', 'debit', 'transfer', 'purchase', 'refund');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_category AS ENUM (
    'top_up', 'package_purchase', 'cascade_debit', 'order_refund',
    'adjustment', 'commission', 'refund_reversal', 'manual_adjustment',
    'payment_recovery', 'compensation', 'correction', 'goodwill'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_gateway AS ENUM ('razorpay', 'instamojo', 'cashfree', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE dns_status AS ENUM ('pending', 'verified', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE package_type AS ENUM ('event_pack', 'validity', 'addon', 'pay_per_event');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pricing_model AS ENUM ('fixed', 'tiered', 'per_event', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_type AS ENUM ('package', 'validity', 'addon');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recording_format AS ENUM ('mp4', 'flv', 'ts');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===== TABLE 1: users =====
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role user_role NOT NULL DEFAULT 'user',
  status user_status NOT NULL DEFAULT 'active',
  avatar TEXT,
  password_hash TEXT,
  parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reseller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  package_id UUID,
  package_expires_at TIMESTAMPTZ,
  wallet_balance DECIMAL(12,2) DEFAULT 0,
  total_events INT DEFAULT 0,
  events_used INT DEFAULT 0,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_reseller_id ON users(reseller_id);
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ===== TABLE 2: reseller_branding =====
CREATE TABLE IF NOT EXISTS reseller_branding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reseller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform_name VARCHAR(255) NOT NULL DEFAULT 'StreamMattic',
  logo TEXT,
  favicon TEXT,
  primary_color VARCHAR(20) DEFAULT '#10b981',
  secondary_color VARCHAR(20) DEFAULT '#059669',
  support_email VARCHAR(255),
  support_phone VARCHAR(50),
  terms_url TEXT,
  privacy_url TEXT,
  custom_css TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reseller_id)
);

CREATE INDEX IF NOT EXISTS idx_reseller_branding_reseller ON reseller_branding(reseller_id);

-- ===== TABLE 3: custom_domains =====
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reseller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain VARCHAR(255) UNIQUE NOT NULL,
  dns_status dns_status DEFAULT 'pending',
  ssl_enabled BOOLEAN DEFAULT false,
  verification_token VARCHAR(255),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_domains_reseller ON custom_domains(reseller_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);

-- ===== TABLE 4: wallets =====
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);

-- ===== TABLE 5: wallet_transactions =====
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  category transaction_category NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  balance_before DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance_after DECIMAL(12,2) NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  reference_id VARCHAR(255),
  reference_type VARCHAR(100),
  cascade_level INT DEFAULT 0,
  base_amount DECIMAL(12,2),
  gst_amount DECIMAL(12,2),
  gst_percentage DECIMAL(5,2),
  total_amount DECIMAL(12,2),
  invoice_number VARCHAR(100),
  invoice_generated BOOLEAN DEFAULT false,
  invoice_url TEXT,
  performed_by UUID REFERENCES users(id),
  performed_by_role user_role,
  reason TEXT,
  notes TEXT,
  related_refund_id UUID,
  related_event_id UUID,
  related_payment_id UUID,
  payment_gateway payment_gateway,
  support_ticket_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_category ON wallet_transactions(category);

-- ===== TABLE 6: packages =====
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  type package_type NOT NULL DEFAULT 'event_pack',
  pricing_model pricing_model NOT NULL DEFAULT 'fixed',
  description TEXT DEFAULT '',
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  base_price_reseller DECIMAL(12,2) DEFAULT 0,
  base_price_user DECIMAL(12,2) DEFAULT 0,
  duration INT DEFAULT 30,
  max_events INT DEFAULT 1,
  max_concurrent_viewers INT DEFAULT 100,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  min_qty INT DEFAULT 1,
  max_qty INT DEFAULT 100,
  stream_type_pricing JSONB,
  simulcast_pricing JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packages_slug ON packages(slug);
CREATE INDEX IF NOT EXISTS idx_packages_active ON packages(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_type ON packages(type);

-- ===== TABLE 7: orders =====
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_type order_type NOT NULL DEFAULT 'package',
  status order_status NOT NULL DEFAULT 'pending',
  unit_price DECIMAL(12,2) DEFAULT 0,
  quantity INT DEFAULT 1,
  total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  event_id UUID,
  validity_days INT,
  payment_gateway payment_gateway,
  payment_id VARCHAR(255),
  failure_reason TEXT,
  insufficient_funds_entity VARCHAR(255),
  required_amount DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- ===== TABLE 8: order_items =====
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0,
  total_price DECIMAL(12,2) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ===== TABLE 9: events =====
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reseller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  thumbnail TEXT,
  stream_type stream_type NOT NULL DEFAULT 'rtmp',
  stream_key VARCHAR(255),
  rtmp_url TEXT,
  hls_url TEXT,
  youtube_url TEXT,
  youtube_channel_name VARCHAR(255),
  youtube_broadcast_id VARCHAR(255),
  youtube_stream_id VARCHAR(255),
  embed_code TEXT,
  status event_status NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  max_viewers INT DEFAULT 0,
  current_viewers INT DEFAULT 0,
  total_views INT DEFAULT 0,
  is_password_protected BOOLEAN DEFAULT false,
  password VARCHAR(255),
  allow_chat BOOLEAN DEFAULT true,
  allow_reactions BOOLEAN DEFAULT true,
  simulcast_config JSONB,
  template_id VARCHAR(255),
  template_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_reseller ON events(reseller_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_scheduled ON events(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_events_stream_type ON events(stream_type);

-- ===== TABLE 10: notifications =====
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  type notification_type DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  link TEXT,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- ===== TABLE 11: payments =====
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_number VARCHAR(50),
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  gst_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  gateway payment_gateway,
  status VARCHAR(50) DEFAULT 'pending',
  gateway_order_id VARCHAR(255),
  gateway_payment_id VARCHAR(255),
  failure_reason TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_order ON payments(gateway_order_id);

-- ===== TABLE 12: platform_settings =====
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_name VARCHAR(255) DEFAULT 'StreamLivee',
  logo TEXT,
  favicon TEXT,
  primary_color VARCHAR(20) DEFAULT '#10b981',
  default_currency VARCHAR(10) DEFAULT 'INR',
  rtmp_server_url TEXT DEFAULT 'rtmp://stream.streamlivee.com/live',
  hls_server_url TEXT DEFAULT 'https://cdn.streamlivee.com',
  max_events_per_user INT DEFAULT 50,
  max_viewers_per_event INT DEFAULT 1000,
  maintenance_mode BOOLEAN DEFAULT false,
  streaming_backend VARCHAR(50) DEFAULT 'nimble',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
