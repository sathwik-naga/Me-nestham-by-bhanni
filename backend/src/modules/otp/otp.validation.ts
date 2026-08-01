import { z } from 'zod';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[1-9]\d{7,14}$/; // E.164 phone format recommendation
const otpRegex = /^\d{6}$/;

export const sendEmailOTPSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .regex(emailRegex, 'Please provide a valid email address'),
    userId: z.string().uuid('Invalid userId format').optional(),
  }),
});

export const verifyEmailOTPSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .regex(emailRegex, 'Please provide a valid email address'),
    otp: z
      .string({ required_error: 'OTP is required' })
      .trim()
      .regex(otpRegex, 'OTP must be exactly 6 numeric digits'),
    userId: z.string().uuid('Invalid userId format').optional(),
  }),
});

export const resendEmailOTPSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .regex(emailRegex, 'Please provide a valid email address'),
    userId: z.string().uuid('Invalid userId format').optional(),
  }),
});

export const sendPhoneOTPSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .regex(phoneRegex, 'Please provide a valid phone number (E.164 format, e.g. +919876543210)'),
    userId: z.string().uuid('Invalid userId format').optional(),
  }),
});

export const verifyPhoneOTPSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .regex(phoneRegex, 'Please provide a valid phone number'),
    otp: z
      .string({ required_error: 'OTP is required' })
      .trim()
      .regex(otpRegex, 'OTP must be exactly 6 numeric digits'),
    userId: z.string().uuid('Invalid userId format').optional(),
  }),
});

export const resendPhoneOTPSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: 'Phone number is required' })
      .trim()
      .regex(phoneRegex, 'Please provide a valid phone number'),
    userId: z.string().uuid('Invalid userId format').optional(),
  }),
});
