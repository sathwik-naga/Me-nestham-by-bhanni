import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ShieldCheck, AlertCircle, RefreshCw, X } from 'lucide-react';
import logo from '../../assets/logo.jpeg';

export default function OTP2FAModal({ email, pendingToken, onVerifySuccess, onCancel, onResendOTP }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 minutes validity
  const [resendCooldown, setResendCooldown] = useState(60); // 60s resend cooldown
  const inputRefs = useRef([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer for 5-minute OTP expiry
  useEffect(() => {
    if (timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerSeconds]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    // Auto-advance to next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split('');
    setOtp(digits);
    inputRefs.current[5]?.focus();
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 numeric digits of your verification code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onVerifySuccess(otpCode);
    } catch (err) {
      setError(err?.message || 'Invalid or expired OTP code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      setOtp(['', '', '', '', '', '']);
      setError('');
      setTimerSeconds(300);
      setResendCooldown(60);
      await onResendOTP();
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err?.message || 'Failed to resend OTP. Please try again later.');
    }
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200 font-accent">
      <div className="relative w-full max-w-md bg-brand-surface border border-brand-primary/20 rounded-3xl p-6 sm:p-8 shadow-2xl text-brand-text">
        {/* Cancel / Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-brand-text-muted hover:text-brand-text rounded-full hover:bg-brand-primary/10 transition-colors"
          title="Cancel login"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="relative flex items-center justify-center mb-2">
            <div className="absolute inset-0 rounded-full bg-brand-primary/20 animate-pulse"></div>
            <img src={logo} alt="Me Nestham By Bhanni" className="w-16 h-16 rounded-full object-cover shadow-lg relative z-10" />
          </div>

          <div className="flex items-center gap-2 text-brand-primary font-bold tracking-wide uppercase text-xs">
            <ShieldCheck size={18} />
            <span>Two-Factor Security Verification</span>
          </div>

          <h3 className="text-xl font-bold font-serif text-brand-primary">Enter Verification Code</h3>
          <p className="text-xs text-brand-text-muted max-w-xs">
            A 6-digit verification passcode was sent to{' '}
            <strong className="text-brand-text font-semibold">{email}</strong>.
          </p>

          {/* Error Banner */}
          {error && (
            <div className="w-full flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-xs font-medium text-left">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 6-Digit Box Input */}
          <form onSubmit={handleVerify} className="w-full flex flex-col gap-6 mt-2">
            <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-extrabold rounded-xl border transition-all ${
                    digit
                      ? 'border-brand-primary bg-brand-primary/10 text-brand-primary shadow-sm'
                      : 'border-brand-border bg-brand-bg/50 text-brand-text hover:border-brand-primary/40'
                  } focus:outline-none focus:ring-2 focus:ring-brand-primary/50`}
                />
              ))}
            </div>

            {/* Timer & Resend */}
            <div className="flex items-center justify-between text-xs text-brand-text-muted px-1">
              <span>
                Code expires in:{' '}
                <strong className={timerSeconds < 60 ? 'text-red-500' : 'text-brand-primary'}>
                  {formatTimer(timerSeconds)}
                </strong>
              </span>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="flex items-center gap-1.5 font-semibold text-brand-primary hover:underline disabled:opacity-50 disabled:no-underline"
              >
                <RefreshCw size={13} className={resendCooldown > 0 ? '' : 'animate-spin-once'} />
                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
              </button>
            </div>

            {/* Verification Action */}
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6 || timerSeconds <= 0}
                className="w-full py-3.5 px-4 bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold text-sm rounded-xl shadow-lg hover:shadow-brand-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify & Sign In</span>
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full py-2 text-xs text-brand-text-muted hover:text-brand-text transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
