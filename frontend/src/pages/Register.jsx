import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Check,
  Key,
  Send,
  RefreshCw
} from 'lucide-react';
import authService from '../services/authService';
import toast from 'react-hot-toast';
import LightLogo from '../assets/light logo.png';
import { signInWithGoogle } from '../firebase';
import api from '../utils/api';

const calculatePasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 6) score += 1;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score === 2 || score === 3) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
  return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
};

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Email status state
  const [emailStatus, setEmailStatus] = useState(null); // { available: boolean, message: string, code?: string }
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Inline OTP drawer state
  const [showOtpDrawer, setShowOtpDrawer] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [timer, setTimer] = useState(60);
  const [verifiedOtpCode, setVerifiedOtpCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const otpRefs = useRef([]);
  const emailCheckTimeout = useRef(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval;
    if (showOtpDrawer && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpDrawer, timer]);

  // Real-time debounced email existence check
  const checkEmailAvailability = async (emailToCheck) => {
    const trimmed = (emailToCheck || '').trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailStatus(null);
      return;
    }

    try {
      setCheckingEmail(true);
      const res = await authService.checkEmail(trimmed);
      if (res.data?.exists) {
        setEmailStatus({
          available: false,
          message: res.data.message,
          code: res.data.code,
        });
        setErrors((prev) => ({ ...prev, email: res.data.message }));
        setShowOtpDrawer(false);
        setIsEmailVerified(false);
      } else {
        setEmailStatus({
          available: true,
          message: 'Email ID is available',
        });
        setErrors((prev) => ({ ...prev, email: '' }));
      }
    } catch (err) {
      console.warn('Email check error:', err.message);
    } finally {
      setCheckingEmail(false);
    }
  };

  const validateField = (name, value, allValues = formData) => {
    let error = '';
    if (name === 'name') {
      if (!value.trim()) {
        error = 'Name is required.';
      } else if (value.trim().length < 2) {
        error = 'Name must be at least 2 characters.';
      }
    } else if (name === 'email') {
      if (!value.trim()) {
        error = 'Email ID is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        error = 'Please enter a valid email address.';
      } else if (emailStatus && !emailStatus.available) {
        error = emailStatus.message;
      }
    } else if (name === 'phone') {
      const cleanPhone = value.replace(/\D/g, '');
      if (!value.trim()) {
        error = 'Phone Number is required.';
      } else if (cleanPhone.length < 10) {
        error = 'Please enter a valid 10-digit phone number.';
      }
    } else if (name === 'password') {
      if (!value) {
        error = 'Password is required.';
      } else if (value.length < 6) {
        error = 'Password must be at least 6 characters.';
      }
    } else if (name === 'confirmPassword') {
      if (!value) {
        error = 'Please confirm your password.';
      } else if (value !== allValues.password) {
        error = 'Passwords do not match.';
      }
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextFormData = { ...formData, [name]: value };
    setFormData(nextFormData);

    // Live debounced check for email
    if (name === 'email') {
      setIsEmailVerified(false);
      setShowOtpDrawer(false);
      setEmailStatus(null);

      if (emailCheckTimeout.current) {
        clearTimeout(emailCheckTimeout.current);
      }

      if (value.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        emailCheckTimeout.current = setTimeout(() => {
          checkEmailAvailability(value);
        }, 400);
      }
    }

    // Live validation for all fields as user types
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value, nextFormData),
      ...(name === 'password' && touched.confirmPassword
        ? { confirmPassword: validateField('confirmPassword', formData.confirmPassword, nextFormData) }
        : {}),
      ...(name === 'confirmPassword'
        ? { confirmPassword: validateField('confirmPassword', value, nextFormData) }
        : {}),
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    if (name === 'email') {
      checkEmailAvailability(value);
    }

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const validateAll = () => {
    const newErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
    };

    if (emailStatus && !emailStatus.available) {
      newErrors.email = emailStatus.message;
    }

    setErrors(newErrors);
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });
    return !Object.values(newErrors).some(Boolean);
  };

  // Step 1: Send OTP to Email
  const handleSendEmailOtp = async () => {
    const emailErr = validateField('email', formData.email);
    if (emailErr || (emailStatus && !emailStatus.available)) {
      setErrors((prev) => ({ ...prev, email: emailErr || emailStatus?.message }));
      setTouched((prev) => ({ ...prev, email: true }));
      toast.error(emailErr || emailStatus?.message || 'Please enter a valid Email ID.');
      return;
    }

    try {
      setSendingOtp(true);
      const res = await authService.sendSignupOtp(formData.email.trim());
      setShowOtpDrawer(true);
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      toast.success(res.data?.message || 'Verification code sent to your email!');
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.code === 'GOOGLE_ACCOUNT_DETECTED') {
        setEmailStatus({ available: false, code: 'GOOGLE_ACCOUNT_DETECTED', message: 'Registered with Google' });
        setErrors((prev) => ({
          ...prev,
          email: 'This Email ID is already registered with Google. Please use Continue with Google.',
        }));
        toast.error('This Email ID is registered with Google. Please use Continue with Google.');
      } else if (errData?.code === 'ACCOUNT_EXISTS') {
        setEmailStatus({ available: false, code: 'ACCOUNT_EXISTS', message: 'Account exists' });
        setErrors((prev) => ({
          ...prev,
          email: 'An account with this Email ID already exists. Please Sign In.',
        }));
        toast.error('An account with this Email ID already exists. Please Sign In.');
      } else {
        toast.error(errData?.message || 'Could not send verification code. Please try again.');
      }
    } finally {
      setSendingOtp(false);
    }
  };

  // OTP Input handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const splitOtp = pasteData.split('');
      setOtp(splitOtp);
      otpRefs.current[5]?.focus();
    }
  };

  // Step 2: Confirm OTP directly inline
  const handleConfirmOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the 6-digit verification code.');
      otpRefs.current[0]?.focus();
      return;
    }

    try {
      setVerifyingOtp(true);
      const res = await authService.verifyEmailOtp({
        email: formData.email.trim(),
        otp: otpCode,
      });

      if (res.data?.verified || res.data?.status === 'success') {
        setIsEmailVerified(true);
        setVerifiedOtpCode(otpCode);
        setShowOtpDrawer(false);
        setErrors((prev) => ({ ...prev, email: '' }));
        toast.success('Email ID verified! Please fill in your details.');
      }
    } catch (err) {
      const errData = err.response?.data;
      toast.error(errData?.message || 'Invalid or expired code. Please check and try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Step 3: Complete Final Registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEmailVerified) {
      toast.error('Please verify your Email ID first.');
      if (!showOtpDrawer) {
        handleSendEmailOtp();
      } else {
        otpRefs.current[0]?.focus();
      }
      return;
    }

    if (!validateAll()) {
      toast.error('Please fill in all required fields properly.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await authService.signup({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        otp: verifiedOtpCode,
      });

      if (res.data?.token && res.data?.user) {
        updateUser(res.data.user, res.data.token);
        toast.success('Account created successfully! Welcome to The Chocolate Mine!');
        navigate('/', { replace: true });
      } else {
        toast.success('Account created! Please Sign In.');
        navigate('/login');
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.code === 'GOOGLE_ACCOUNT_DETECTED') {
        toast.error('This Email ID is registered with Google. Please use Continue with Google.');
      } else if (errData?.code === 'ACCOUNT_EXISTS') {
        toast.error('An account with this Email ID already exists. Please Sign In.');
      } else {
        toast.error(errData?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const pwdStrength = calculatePasswordStrength(formData.password);

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center bg-[#EDE4DB] dark:bg-[#0D0604] p-0 sm:p-6 lg:p-10 relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full min-h-[100dvh] sm:min-h-0 sm:h-auto sm:max-w-5xl bg-[#FAF5F0] dark:bg-[#1E110B] sm:rounded-3xl sm:shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10 border border-[#D9C4B2] dark:border-[#4A2B1C]/60"
      >
        {/* Left Side: Brand Panel (Hidden on Mobile) */}
        <div className="hidden md:flex md:w-1/2 relative flex-col justify-between items-center text-white overflow-hidden p-10 lg:p-12">
          <div className="absolute inset-0 bg-[url('/assets/auth-bg.png')] bg-cover bg-center scale-105"></div>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20"></div>

          {/* Top Logo Link */}
          <Link to="/" className="relative z-10 self-start flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/95 p-1.5 shadow-md group-hover:scale-105 transition-transform">
              <img src={LightLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-white text-base tracking-wide drop-shadow-md">The Chocolate Mine</span>
          </Link>

          {/* Center Content */}
          <div className="relative z-10 text-center w-full max-w-sm my-auto py-8">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#C89D5A]/30 text-[#F5D8A8] text-xs font-black tracking-widest uppercase mb-4 backdrop-blur-md border border-[#C89D5A]/40">
                <Sparkles size={13} /> Sweet Rewards Await
              </span>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight uppercase mb-4 text-white drop-shadow-lg">
                Taste The <br />
                <span className="text-[#E6B25A]">Magic</span>
              </h1>
              <p className="text-sm font-medium text-stone-200/90 leading-relaxed drop-shadow">
                Create your account to order artisanal cakes, unlock member offers, and track your orders in real-time.
              </p>
            </motion.div>
          </div>

          {/* Bottom Security Footer */}
          <div className="relative z-10 w-full flex justify-between items-center text-xs font-semibold text-stone-300/80 pt-4 border-t border-white/10">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-400" /> Instant Verified Signup
            </span>
            <span>&copy; {new Date().getFullYear()} The Chocolate Mine</span>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full md:w-1/2 flex flex-col justify-start md:justify-between p-0 sm:p-8 lg:p-10 bg-[#FAF5F0] dark:bg-[#1E110B] min-h-[100dvh] sm:min-h-0 md:min-h-[580px] overflow-y-auto">
          {/* Mobile Image Hero Banner (Flush top & sides with rounded bottom & full character visible) */}
          <div className="md:hidden relative w-full h-[280px] sm:h-[300px] rounded-b-[32px] overflow-hidden text-white shadow-xl shrink-0">
            <div className="absolute inset-0 bg-[url('/assets/auth-bg.png')] bg-cover bg-[center_top]"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10"></div>

            {/* Top Left Circular Back Button */}
            <Link
              to="/"
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

          <div className="max-w-md w-full mx-auto px-5 py-6 sm:px-0 sm:py-0 my-1 md:my-auto">
            <div className="text-center md:text-left mb-5">
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-[#F8F1E7] tracking-tight uppercase">
                Create Account
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-stone-500 dark:text-stone-400 mt-0.5">
                {isEmailVerified ? 'Enter your details to complete registration' : 'Enter Email ID to start'}
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* STEP 1: Email ID with Live Check & Inline OTP verification */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-0.5">
                  <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-800 dark:text-stone-200">
                    Email ID
                  </label>
                  {checkingEmail && (
                    <span className="text-xs font-bold text-stone-400 flex items-center gap-1">
                      <Loader2 size={12} className="animate-spin" /> Checking...
                    </span>
                  )}
                  {isEmailVerified && (
                    <span className="text-xs font-extrabold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Verified ✓
                    </span>
                  )}
                  {!isEmailVerified && emailStatus?.available && !errors.email && (
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Available
                    </span>
                  )}
                </div>

                <div className="relative flex items-center">
                  <Mail
                    className={`absolute left-4 pointer-events-none transition-colors ${
                      isEmailVerified
                        ? 'text-emerald-500'
                        : errors.email
                        ? 'text-red-500'
                        : 'text-stone-400 dark:text-stone-400'
                    }`}
                    size={20}
                  />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    readOnly={isEmailVerified}
                    placeholder="Enter your email ID"
                    disabled={submitting || googleLoading}
                    className={`w-full bg-[#FFFFFF] dark:bg-[#120805] text-stone-900 dark:text-[#FAF5F0] pl-12 pr-32 h-[54px] rounded-2xl outline-none font-semibold text-base transition-all shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-400/90 border ${
                      isEmailVerified
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200'
                        : errors.email
                        ? 'border-red-500/80 focus:border-red-500 focus:ring-4 focus:ring-red-500/15'
                        : 'border-stone-300 dark:border-[#4A2B1C] focus:border-[#C89D5A] dark:focus:border-[#E6B25A] focus:ring-4 focus:ring-[#C89D5A]/15'
                    }`}
                  />

                  {/* Inline Action on the right side of Email input */}
                  <div className="absolute right-2.5 flex items-center gap-1">
                    {isEmailVerified ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEmailVerified(false);
                          setShowOtpDrawer(false);
                          setEmailStatus(null);
                        }}
                        className="text-xs font-bold text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 underline px-2 py-1 cursor-pointer"
                      >
                        Change
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendEmailOtp}
                        disabled={
                          sendingOtp ||
                          submitting ||
                          checkingEmail ||
                          !formData.email.trim() ||
                          (emailStatus && !emailStatus.available)
                        }
                        className="h-[38px] px-3.5 rounded-xl bg-[#C89D5A] hover:bg-[#D9A35F] text-stone-950 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        {sendingOtp ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : showOtpDrawer ? (
                          <RefreshCw size={13} />
                        ) : (
                          <Send size={13} />
                        )}
                        <span>{showOtpDrawer ? 'Resend' : 'Verify'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Instant Email Existence Alert */}
                {errors.email && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-bold text-red-600 dark:text-red-400 flex items-start gap-2 mt-1"
                  >
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span>{errors.email}</span>
                      {emailStatus?.code === 'GOOGLE_ACCOUNT_DETECTED' && (
                        <p className="mt-1 text-[11px] text-stone-600 dark:text-stone-400">
                          Please use <strong>Continue with Google</strong> below to sign in.
                        </p>
                      )}
                      {emailStatus?.code === 'ACCOUNT_EXISTS' && (
                        <p className="mt-1">
                          <Link to="/login" className="underline font-black text-[#A67538] dark:text-[#E6B25A]">
                            Click here to Sign In &rarr;
                          </Link>
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* INLINE OTP SECTION - "botomly put otp not seperate page" */}
                <AnimatePresence>
                  {showOtpDrawer && !isEmailVerified && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden pt-1.5"
                    >
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border-2 border-[#C89D5A]/50 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                            <Key size={15} className="text-[#C89D5A]" />
                            <span>Enter 6-Digit Email OTP</span>
                          </div>
                          <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 truncate max-w-[150px]">
                            Sent to {formData.email}
                          </span>
                        </div>

                        {/* 6-Digit Input Boxes */}
                        <div className="flex justify-between gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
                          {otp.map((digit, index) => (
                            <input
                              key={index}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              ref={(el) => (otpRefs.current[index] = el)}
                              value={digit}
                              onChange={(e) => handleOtpChange(index, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(index, e)}
                              disabled={verifyingOtp}
                              className="w-10 h-11 sm:w-11 sm:h-12 text-center text-lg sm:text-xl font-black rounded-xl bg-white dark:bg-[#120805] text-stone-900 dark:text-[#FAF5F0] border-2 border-stone-300 dark:border-[#4A2B1C] focus:border-[#C89D5A] dark:focus:border-[#E6B25A] focus:ring-4 focus:ring-[#C89D5A]/15 outline-none shadow-sm transition-all"
                            />
                          ))}
                        </div>

                        {/* Verify OTP Button & Resend Timer */}
                        <div className="flex items-center justify-between pt-1 gap-2">
                          <div className="text-xs font-bold text-stone-500 dark:text-stone-400">
                            {timer > 0 ? (
                              <span>Resend in <strong className="text-stone-800 dark:text-stone-200">{timer}s</strong></span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleSendEmailOtp}
                                disabled={sendingOtp}
                                className="font-black text-[#A67538] dark:text-[#E6B25A] hover:underline cursor-pointer"
                              >
                                Resend Code
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={handleConfirmOtp}
                            disabled={verifyingOtp || otp.join('').length !== 6}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            {verifyingOtp ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Verifying...</span>
                              </>
                            ) : (
                              <>
                                <Check size={13} />
                                <span>Confirm OTP</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* STEP 2: Remaining Details UNLOCKED ONLY AFTER EMAIL VERIFICATION */}
              <AnimatePresence>
                {isEmailVerified && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: 10, height: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="space-y-3.5 overflow-hidden"
                  >
                    {/* Name */}
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-800 dark:text-stone-200 block ml-0.5">
                        Name
                      </label>
                      <div className="relative flex items-center">
                        <User
                          className={`absolute left-4 pointer-events-none transition-colors ${
                            errors.name ? 'text-red-500' : 'text-stone-400 dark:text-stone-400'
                          }`}
                          size={20}
                        />
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter your name"
                          disabled={submitting || googleLoading}
                          className={`w-full bg-[#FFFFFF] dark:bg-[#120805] text-stone-900 dark:text-[#FAF5F0] pl-12 pr-4 h-[54px] rounded-2xl outline-none font-semibold text-base transition-all shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-400/90 border ${
                            errors.name
                              ? 'border-red-500/80 focus:border-red-500 focus:ring-4 focus:ring-red-500/15'
                              : 'border-stone-300 dark:border-[#4A2B1C] focus:border-[#C89D5A] dark:focus:border-[#E6B25A] focus:ring-4 focus:ring-[#C89D5A]/15'
                          }`}
                        />
                      </div>
                      {errors.name && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-1.5 ml-1 mt-0.5"
                        >
                          <AlertCircle size={13} className="shrink-0" /> {errors.name}
                        </motion.p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-800 dark:text-stone-200 block ml-0.5">
                        Phone Number
                      </label>
                      <div className="relative flex items-center">
                        <Phone
                          className={`absolute left-4 pointer-events-none transition-colors ${
                            errors.phone ? 'text-red-500' : 'text-stone-400 dark:text-stone-400'
                          }`}
                          size={20}
                        />
                        <input
                          type="tel"
                          name="phone"
                          required
                          maxLength={10}
                          value={formData.phone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Enter 10-digit phone number"
                          disabled={submitting || googleLoading}
                          className={`w-full bg-[#FFFFFF] dark:bg-[#120805] text-stone-900 dark:text-[#FAF5F0] pl-12 pr-4 h-[54px] rounded-2xl outline-none font-semibold text-base transition-all shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-400/90 border ${
                            errors.phone
                              ? 'border-red-500/80 focus:border-red-500 focus:ring-4 focus:ring-red-500/15'
                              : 'border-stone-300 dark:border-[#4A2B1C] focus:border-[#C89D5A] dark:focus:border-[#E6B25A] focus:ring-4 focus:ring-[#C89D5A]/15'
                          }`}
                        />
                      </div>
                      {errors.phone && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-1.5 ml-1 mt-0.5"
                        >
                          <AlertCircle size={13} className="shrink-0" /> {errors.phone}
                        </motion.p>
                      )}
                    </div>

                    {/* Password & Confirm Password Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Password */}
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-800 dark:text-stone-200 block ml-0.5">
                          Password
                        </label>
                        <div className="relative flex items-center">
                          <Lock
                            className={`absolute left-4 pointer-events-none transition-colors ${
                              errors.password ? 'text-red-500' : 'text-stone-400 dark:text-stone-400'
                            }`}
                            size={20}
                          />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Enter password"
                            disabled={submitting || googleLoading}
                            className={`w-full bg-[#FFFFFF] dark:bg-[#120805] text-stone-900 dark:text-[#FAF5F0] pl-12 pr-11 h-[54px] rounded-2xl outline-none font-semibold text-base transition-all shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-400/90 border ${
                              errors.password
                                ? 'border-red-500/80 focus:border-red-500 focus:ring-4 focus:ring-red-500/15'
                                : 'border-stone-300 dark:border-[#4A2B1C] focus:border-[#C89D5A] dark:focus:border-[#E6B25A] focus:ring-4 focus:ring-[#C89D5A]/15'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                            className="absolute right-3.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1 cursor-pointer"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-800 dark:text-stone-200 block ml-0.5">
                          Confirm Password
                        </label>
                        <div className="relative flex items-center">
                          <Lock
                            className={`absolute left-4 pointer-events-none transition-colors ${
                              errors.confirmPassword ? 'text-red-500' : 'text-stone-400 dark:text-stone-400'
                            }`}
                            size={20}
                          />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Confirm password"
                            disabled={submitting || googleLoading}
                            className={`w-full bg-[#FFFFFF] dark:bg-[#120805] text-stone-900 dark:text-[#FAF5F0] pl-12 pr-11 h-[54px] rounded-2xl outline-none font-semibold text-base transition-all shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-400/90 border ${
                              errors.confirmPassword
                                ? 'border-red-500/80 focus:border-red-500 focus:ring-4 focus:ring-red-500/15'
                                : 'border-stone-300 dark:border-[#4A2B1C] focus:border-[#C89D5A] dark:focus:border-[#E6B25A] focus:ring-4 focus:ring-[#C89D5A]/15'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                            className="absolute right-3.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="pt-0.5 px-1">
                        <div className="flex justify-between items-center text-xs font-bold text-stone-500 dark:text-stone-400 mb-1">
                          <span>Password Strength:</span>
                          <span
                            className={
                              pwdStrength.score === 3
                                ? 'text-emerald-500 font-extrabold'
                                : pwdStrength.score === 2
                                ? 'text-amber-500 font-extrabold'
                                : 'text-red-500 font-extrabold'
                            }
                          >
                            {pwdStrength.label}
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden flex gap-1">
                          <div
                            className={`h-full flex-1 rounded-full transition-all duration-300 ${
                              pwdStrength.score >= 1 ? pwdStrength.color : 'bg-transparent'
                            }`}
                          />
                          <div
                            className={`h-full flex-1 rounded-full transition-all duration-300 ${
                              pwdStrength.score >= 2 ? pwdStrength.color : 'bg-transparent'
                            }`}
                          />
                          <div
                            className={`h-full flex-1 rounded-full transition-all duration-300 ${
                              pwdStrength.score >= 3 ? pwdStrength.color : 'bg-transparent'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-1.5 ml-1 mt-0.5"
                      >
                        <AlertCircle size={13} className="shrink-0" /> {errors.password}
                      </motion.p>
                    )}

                    {errors.confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-1.5 ml-1 mt-0.5"
                      >
                        <AlertCircle size={13} className="shrink-0" /> {errors.confirmPassword}
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Submit Button */}
              {isEmailVerified ? (
                <button
                  type="submit"
                  disabled={submitting || googleLoading}
                  className="w-full mt-3 h-[54px] sm:h-[56px] rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-[#D9A35F] to-[#C89D5A] hover:from-[#E6B25A] hover:to-[#D9A35F] text-stone-950 hover:shadow-[#C89D5A]/25 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={21} className="animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <Check size={20} />
                      <span>Complete Registration</span>
                      <ArrowRight size={19} />
                    </>
                  )}
                </button>
              ) : !showOtpDrawer ? (
                <button
                  type="button"
                  onClick={handleSendEmailOtp}
                  disabled={sendingOtp || checkingEmail || !formData.email.trim() || (emailStatus && !emailStatus.available)}
                  className="w-full mt-3 h-[54px] sm:h-[56px] rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-[#D9A35F] to-[#C89D5A] hover:from-[#E6B25A] hover:to-[#D9A35F] text-stone-950 hover:shadow-[#C89D5A]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingOtp ? (
                    <>
                      <Loader2 size={21} className="animate-spin" />
                      <span>Sending Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with Email</span>
                      <ArrowRight size={19} />
                    </>
                  )}
                </button>
              ) : null}

              {/* Divider */}
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-stone-300 dark:border-[#381F15]"></div>
                <span className="flex-shrink-0 mx-3 text-stone-400 dark:text-stone-400 text-xs font-black uppercase tracking-widest">
                  OR
                </span>
                <div className="flex-grow border-t border-stone-300 dark:border-[#381F15]"></div>
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    setGoogleLoading(true);
                    const googleUser = await signInWithGoogle();
                    if (!googleUser || !googleUser.email) {
                      throw new Error('Could not retrieve Google profile');
                    }
                    const response = await api.post('/auth/firebase-login', {
                      email: googleUser.email,
                      name: googleUser.displayName || 'Google User',
                      avatar: googleUser.photoURL || '',
                    });

                    if (response.data?.token && response.data?.user) {
                      updateUser(response.data.user, response.data.token);
                      toast.success(`Welcome, ${response.data.user.name || 'Chocolate Lover'}!`);
                      if (!response.data.user.phoneVerified) {
                        navigate('/verify-phone', { replace: true });
                      } else {
                        navigate('/', { replace: true });
                      }
                    }
                  } catch (error) {
                    toast.error(error.response?.data?.message || error.message || 'Google Sign-In failed.');
                  } finally {
                    setGoogleLoading(false);
                  }
                }}
                disabled={submitting || googleLoading}
                className="w-full h-[54px] sm:h-[56px] rounded-2xl bg-white dark:bg-[#120805] text-stone-900 dark:text-[#FAF5F0] border border-stone-300 dark:border-[#4A2B1C] font-extrabold text-sm sm:text-base hover:bg-stone-50 dark:hover:bg-[#1a0c08] transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow active:scale-[0.98] cursor-pointer disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2 size={18} className="animate-spin text-stone-500" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>
            </form>

            {/* Bottom Footer Switch to Login */}
            <div className="mt-5 text-center">
              <p className="text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-400">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-black text-[#A67538] dark:text-[#E6B25A] hover:underline ml-1"
                >
                  Sign In &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
