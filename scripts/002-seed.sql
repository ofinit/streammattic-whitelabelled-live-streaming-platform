-- StreamLivee Seed Data
-- Admin user password: Admin@123 (bcrypt hash below)
-- Hash generated with 12 salt rounds

-- ============================================================
-- ADMIN USER
-- ============================================================

INSERT INTO users (id, email, name, phone, password_hash, role, status, email_verified)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@streammattic.com',
  'Platform Admin',
  '+919999999999',
  '$2b$12$LJ3m4ys5RUCaGmKnUP7.aOGQH.JhGV8K8BQKZ3O8LvMvjq0p8qXa',
  'admin',
  'active',
  true
);

-- Admin wallet
INSERT INTO wallets (user_id, balance, currency)
VALUES ('00000000-0000-0000-0000-000000000001', 0, 'INR');

-- Admin credits row
INSERT INTO user_credits (user_id) 
VALUES ('00000000-0000-0000-0000-000000000001');

-- ============================================================
-- PLATFORM SETTINGS
-- ============================================================

-- Stream type pricing (base prices in paisa)
INSERT INTO platform_settings (key, value) VALUES
('stream_type_pricing', '{
  "rtmp": {
    "enabled": true,
    "basePrice": 1500,
    "label": "RTMP Server",
    "description": "Use OBS/Wirecast",
    "volumeDiscountTiers": [
      {"minQty": 5, "maxQty": 9, "pricePerCredit": 1350, "discountPercent": 10, "label": "5 Pack"},
      {"minQty": 10, "maxQty": 24, "pricePerCredit": 1200, "discountPercent": 20, "label": "10 Pack"},
      {"minQty": 25, "maxQty": 49, "pricePerCredit": 1050, "discountPercent": 30, "label": "25 Pack"},
      {"minQty": 50, "maxQty": null, "pricePerCredit": 900, "discountPercent": 40, "label": "50 Pack"}
    ]
  },
  "youtube_api": {
    "enabled": true,
    "basePrice": 1000,
    "label": "YouTube API",
    "description": "Direct broadcast",
    "volumeDiscountTiers": [
      {"minQty": 5, "maxQty": 9, "pricePerCredit": 900, "discountPercent": 10, "label": "5 Pack"},
      {"minQty": 10, "maxQty": 24, "pricePerCredit": 800, "discountPercent": 20, "label": "10 Pack"},
      {"minQty": 25, "maxQty": 49, "pricePerCredit": 700, "discountPercent": 30, "label": "25 Pack"},
      {"minQty": 50, "maxQty": null, "pricePerCredit": 600, "discountPercent": 40, "label": "50 Pack"}
    ]
  },
  "youtube_embed": {
    "enabled": true,
    "basePrice": 500,
    "label": "YouTube Embed",
    "description": "Embed existing",
    "volumeDiscountTiers": [
      {"minQty": 5, "maxQty": 9, "pricePerCredit": 450, "discountPercent": 10, "label": "5 Pack"},
      {"minQty": 10, "maxQty": 24, "pricePerCredit": 400, "discountPercent": 20, "label": "10 Pack"},
      {"minQty": 25, "maxQty": 49, "pricePerCredit": 350, "discountPercent": 30, "label": "25 Pack"},
      {"minQty": 50, "maxQty": null, "pricePerCredit": 300, "discountPercent": 40, "label": "50 Pack"}
    ]
  },
  "third_party": {
    "enabled": true,
    "basePrice": 400,
    "label": "Third Party",
    "description": "External embed",
    "volumeDiscountTiers": [
      {"minQty": 5, "maxQty": 9, "pricePerCredit": 360, "discountPercent": 10, "label": "5 Pack"},
      {"minQty": 10, "maxQty": 24, "pricePerCredit": 320, "discountPercent": 20, "label": "10 Pack"},
      {"minQty": 25, "maxQty": 49, "pricePerCredit": 280, "discountPercent": 30, "label": "25 Pack"},
      {"minQty": 50, "maxQty": null, "pricePerCredit": 240, "discountPercent": 40, "label": "50 Pack"}
    ]
  }
}'::jsonb);

-- Simulcast pricing (in paisa per event)
INSERT INTO platform_settings (key, value) VALUES
('simulcast_pricing', '{
  "youtube": {"enabled": true, "pricePerEvent": 75, "label": "YouTube"},
  "facebook": {"enabled": true, "pricePerEvent": 75, "label": "Facebook"},
  "custom_rtmp": {"enabled": true, "pricePerEvent": 100, "label": "Custom RTMP"}
}'::jsonb);

-- Validity extension settings (credit costs)
INSERT INTO platform_settings (key, value) VALUES
('validity_settings', '{
  "defaultDays": 30,
  "tiers": [
    {"days": 60, "creditCost": 1, "label": "60 Days (+1 credit)", "enabled": true},
    {"days": 90, "creditCost": 2, "label": "90 Days (+2 credits)", "enabled": true},
    {"days": 180, "creditCost": 5, "label": "180 Days (+5 credits)", "enabled": true},
    {"days": 365, "creditCost": 12, "label": "365 Days (+12 credits)", "enabled": true}
  ]
}'::jsonb);

-- Annual subscription settings
INSERT INTO platform_settings (key, value) VALUES
('annual_subscription', '{
  "enabled": true,
  "price": 1800000,
  "label": "Studio Annual Subscription",
  "description": "Charged annually to each studio for white-label platform access and hosting"
}'::jsonb);

-- Studio upgrade pricing
INSERT INTO platform_settings (key, value) VALUES
('studio_upgrade', '{
  "enabled": true,
  "price": 1800000,
  "label": "Upgrade to Studio",
  "description": "One-time upgrade fee for whitelabel platform + hosting. Includes annual subscription."
}'::jsonb);

-- GST defaults
INSERT INTO platform_settings (key, value) VALUES
('gst_defaults', '{
  "enabled": true,
  "percentage": 18.00,
  "platformGstNumber": "",
  "platformPanNumber": "",
  "platformBusinessName": "StreamLivee",
  "platformBusinessAddress": ""
}'::jsonb);

-- ============================================================
-- DEFAULT EVENT TEMPLATES
-- ============================================================

INSERT INTO event_templates (name, thumbnail, category, is_active, sort_order, fields) VALUES
('Wedding Ceremony', '/placeholder.svg?height=200&width=300', 'wedding', true, 1, '{"defaultTitle": "Wedding Ceremony Live Stream", "defaultDescription": "Join us to celebrate this special occasion"}'),
('Corporate Event', '/placeholder.svg?height=200&width=300', 'corporate', true, 2, '{"defaultTitle": "Corporate Live Event", "defaultDescription": "Professional corporate live streaming"}'),
('Birthday Party', '/placeholder.svg?height=200&width=300', 'celebration', true, 3, '{"defaultTitle": "Birthday Celebration Live", "defaultDescription": "Celebrate with us from anywhere"}'),
('Religious Ceremony', '/placeholder.svg?height=200&width=300', 'religious', true, 4, '{"defaultTitle": "Religious Ceremony Live Stream", "defaultDescription": "Join the ceremony virtually"}'),
('Concert / Music', '/placeholder.svg?height=200&width=300', 'entertainment', true, 5, '{"defaultTitle": "Live Concert Stream", "defaultDescription": "Experience the music live from anywhere"}'),
('Custom Event', '/placeholder.svg?height=200&width=300', 'custom', true, 6, '{"defaultTitle": "Live Stream Event", "defaultDescription": "Watch the event live"}');
