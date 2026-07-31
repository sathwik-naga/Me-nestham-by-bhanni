-- Migration: Add payment fields for Razorpay Integration
-- Run this SQL in your Supabase SQL editor to update the orders table.

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
