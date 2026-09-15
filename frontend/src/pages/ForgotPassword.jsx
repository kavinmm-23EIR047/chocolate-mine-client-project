import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Key, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff, ArrowLeft, Sparkles } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';
import api from '../utils/api';
import toast from 'react-hot-toast';
import LightLogo from '../assets/light logo.png';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP + New Password
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // If redirected from AccountSettings with email pre-filled, skip to step 2
  useEffect(() => {
    if (location.state?.email) {
      setStep(2);
    }
  }, [location.state]);

  // Step 1: Request OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return toast.error('Please enter a valid email address.');
    }
    try {
      setLoading(true);
      await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success('A 6-digit code has been sent to your email!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'We could not send the reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      return toast.error('Please enter the complete 6-digit code.');
    }
    if (newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters.');
    }
    try {
      setLoading(true);
      await api.post('/auth/reset-password', { email: email.trim(), otp: otp.trim(), password: newPassword });
      toast.success('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-[#EDE4DB] dark:bg-[#0D0604] p-4 sm:p-6 lg:p-10">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#FAF5F0] dark:bg-[#1E110B] p-0 rounded-3xl shadow-2xl border border-[#D9C4B2] dark:border-[#4A2B1C]/60 overflow-hidden"
        >
          {/* Top Brand Banner (Flush top & sides with rounded bottom & full character visible) */}
          <div className="relative w-full h-[280px] sm:h-[300px] rounded-b-[32px] overflow-hidden text-white shadow-xl shrink-0">
            <div className="absolute inset-0 bg-[url('/assets/auth-bg.png')] bg-cover bg-[center_top]"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10"></div>

            {/* Top Left Circular Back Button */}
            <Link
              to="/login"
              className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all shadow-md"
            >
              <ArrowLeft size={20} />
            </Link>

            {/* Center Logo & Brand Title positioned over chest/cake */}
            <div className="relative z-10 h-full flex flex-col items-center justify-end pb-4 pt-3 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-2 sm:p-2.5 shadow-2xl mb-1.5 flex items-center justify-center">
                <img src={LightLogo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="font-black text-white text-xl sm:text-2xl tracking-tight drop-shadow-md">
                The Chocolate Mine
              </h2>
              <p className="text-xs sm:text-sm font-bold text-stone-100 drop-shadow">
                Join the family
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-14 h-14 bg-amber-500/10 text-[#C89D5A] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Mail size={28} />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-[#F8F1E7] tracking-tight uppercase">
                    Forgot Password?
                  </h2>
                  <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm font-semibold mt-1 leading-relaxed">
                    Enter your registered email and we'll send you a 6-digit code to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-800 dark:text-stone-200 block ml-0.5">
                      Email ID
                    </label>
                    <div className="relative flex items-center">
                      <Mail className="absolute left-4 text-stone-400 pointer-events-none" size={20} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white dark:bg-[#120805] border border-stone-300 dark:border-[#4A2B1C] text-stone-900 dark:text-[#FAF5F0] pl-12 pr-4 h-[54px] rounded-2xl outline-none focus:border-[#C89D5A] dark:focus:border-[#E6B25A] focus:ring-4 focus:ring-[#C89D5A]/15 transition-all font-semibold text-base shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-400/90"
                        placeholder="Enter your email ID"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[54px] sm:h-[56px] rounded-2xl bg-gradient-to-r from-[#D9A35F] to-[#C89D5A] hover:from-[#E6B25A] hover:to-[#D9A35F] text-stone-950 font-black text-sm sm:text-base uppercase tracking-wider shadow-lg hover:shadow-xl hover:shadow-[#C89D5A]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? 'Sending Code...' : 'Send Reset Code'}
                    {!loading && <ArrowRight size={19} />}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-black text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 uppercase tracking-widest transition-colors"
                  >
                    <ArrowLeft size={14} /> Back to Sign In
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck size={28} />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-[#F8F1E7] tracking-tight uppercase">
                    Reset Password
                  </h2>
                  <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm font-semibold mt-1">
                    Enter the 6-digit code sent to <strong className="text-stone-900 dark:text-stone-100">{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-800 dark:text-stone-200 block ml-0.5">
                      6-Digit Code
                    </label>
                    <div className="relative flex items-center">
                      <Key className="absolute left-4 text-stone-400 pointer-events-none" size={20} />
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white dark:bg-[#120805] border border-stone-300 dark:border-[#4A2B1C] text-stone-900 dark:text-[#FAF5F0] pl-12 pr-4 h-[54px] rounded-2xl outline-none focus:border-[#C89D5A] dark:focus:border-[#E6B25A] focus:ring-4 focus:ring-[#C89D5A]/15 transition-all font-black text-center tracking-[0.5em] text-xl shadow-sm placeholder:text-stone-400"
                        placeholder="000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-800 dark:text-stone-200 block ml-0.5">
                      New Password
                    </label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-4 text-stone-400 pointer-events-none" size={20} />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white dark:bg-[#120805] border border-stone-300 dark:border-[#4A2B1C] text-stone-900 dark:text-[#FAF5F0] pl-12 pr-12 h-[54px] rounded-2xl outline-none focus:border-[#C89D5A] dark:focus:border-[#E6B25A] focus:ring-4 focus:ring-[#C89D5A]/15 transition-all font-semibold text-base shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-400/90"
                        placeholder="Min. 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        className="absolute right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[54px] sm:h-[56px] rounded-2xl bg-gradient-to-r from-[#D9A35F] to-[#C89D5A] hover:from-[#E6B25A] hover:to-[#D9A35F] text-stone-950 font-black text-sm sm:text-base uppercase tracking-wider shadow-lg hover:shadow-xl hover:shadow-[#C89D5A]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? 'Updating Password...' : 'Save New Password'}
                    {!loading && <CheckCircle2 size={20} />}
                  </button>
                </form>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-black text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 uppercase tracking-widest transition-colors cursor-pointer"
                  >
                    Try another email
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
