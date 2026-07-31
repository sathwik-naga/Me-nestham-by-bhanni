-- Migration: Add shipping and fulfillment fields for Shiprocket Integration
-- Run this SQL in your Supabase SQL editor to update the orders table.

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shipment_id TEXT,
ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT,
ADD COLUMN IF NOT EXISTS courier_company_id INTEGER,
ADD COLUMN IF NOT EXISTS shipping_status_code INTEGER,
ADD COLUMN IF NOT EXISTS awb_code TEXT,
ADD COLUMN IF NOT EXISTS courier_name TEXT,
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS tracking_url TEXT,
ADD COLUMN IF NOT EXISTS shipping_status TEXT,
ADD COLUMN IF NOT EXISTS pickup_status TEXT,
ADD COLUMN IF NOT EXISTS label_url TEXT,
ADD COLUMN IF NOT EXISTS invoice_url TEXT,
ADD COLUMN IF NOT EXISTS manifest_url TEXT,
ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tracking_events JSONB DEFAULT '[]'::jsonb;
