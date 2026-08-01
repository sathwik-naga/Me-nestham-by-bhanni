import { z } from 'zod';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
