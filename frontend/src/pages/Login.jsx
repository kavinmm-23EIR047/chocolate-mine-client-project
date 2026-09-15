import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import LightLogo from '../assets/light logo.png';
import { signInWithGoogle } from '../firebase';
import api from '../utils/api';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, updateUser } = useAuth();
  const navigate = useNavigate();

  // Validate single field
  const validateField = (name, value) => {
    let error = '';
    if (name === 'email') {
      if (!value.trim()) {
        error = 'Email address is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        error = 'Please enter a valid email address.';
      }
    } else if (name === 'password') {
      if (!value) {
        error = 'Password is required.';
      } else if (value.length < 6) {
        error = 'Password must be at least 6 characters.';
      }
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateAll = () => {
    const newErrors = {
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
    };
    setErrors(newErrors);
    setTouched({ email: true, password: true });
    return !newErrors.email && !newErrors.password;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error('Please fix the errors in the form.');
      return;
    }

    try {
      setLoading(true);
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      toast.success('Welcome back to The Chocolate Mine!');
      navigate('/');
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.requiresOtp) {
        toast.error(errData.message || 'Please verify your email first.');
        navigate('/verify-otp', {
          replace: true,
          state: { email: errData.email || formData.email.trim().toLowerCase() },
        });
      } else if (errData?.code === 'GOOGLE_ACCOUNT_DETECTED') {
        setErrors((prev) => ({
          ...prev,
          password: 'This account was created with Google. Please use Continue with Google.',
        }));
        toast.error('This account uses Google Sign-In. Please click Continue with Google.');
      } else if (errData?.errors && Array.isArray(errData.errors) && errData.errors.length > 0) {
        const fieldErrors = {};
        errData.errors.forEach((item) => {
          if (item.field) fieldErrors[item.field] = item.message;
          toast.error(item.message);
        });
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
      } else {
        toast.error(errData?.message || 'Incorrect email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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
          {/* Background Image & Overlays */}
          <div className="absolute inset-0 bg-[url('/assets/auth-bg.png')] bg-cover bg-center scale-105"></div>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20"></div>

          {/* Top Logo link */}
          <Link to="/" className="relative z-10 self-start flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/95 p-1.5 shadow-md group-hover:scale-105 transition-transform">
              <img src={LightLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-black text-white text-base tracking-wide drop-shadow-md">The Chocolate Mine</span>
          </Link>

          {/* Center Title */}
          <div className="relative z-10 text-center w-full max-w-sm my-auto py-8">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
              <span className="inline-block px-3.5 py-1 rounded-full bg-[#C89D5A]/30 text-[#F5D8A8] text-xs font-black tracking-widest uppercase mb-4 backdrop-blur-md border border-[#C89D5A]/40">
                Member Portal
              </span>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight uppercase mb-4 text-white drop-shadow-lg">
                Welcome <br />
                <span className="text-[#E6B25A]">Back</span>
              </h1>
              <p className="text-sm font-medium text-stone-200/90 leading-relaxed drop-shadow">
                Sign in to manage your custom cake bookings, dessert orders, and unlock member-only treats.
              </p>
            </motion.div>
          </div>

          {/* Bottom Security Badge */}
          <div className="relative z-10 w-full flex justify-between items-center text-xs font-semibold text-stone-300/80 pt-4 border-t border-white/10">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-emerald-400" /> 256-Bit Encrypted
            </span>
            <span>&copy; {new Date().getFullYear()} The Chocolate Mine</span>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full md:w-1/2 flex flex-col justify-start md:justify-between p-0 sm:p-8 lg:p-12 bg-[#FAF5F0] dark:bg-[#1E110B] min-h-[100dvh] sm:min-h-0 md:min-h-[580px] overflow-y-auto">
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

          <div className="max-w-sm w-full mx-auto px-5 py-6 sm:px-0 sm:py-0 my-1 md:my-auto">
            <div className="mb-5 text-center md:text-left">
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-[#F8F1E7] tracking-tight uppercase">
                Sign In
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-stone-500 dark:text-stone-400 mt-0.5">
                Sign in to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-800 dark:text-stone-200 block ml-0.5">
                  Email ID
                </label>
                <div className="relative flex items-center">
                  <Mail
                    className={`absolute left-4 pointer-events-none transition-colors ${
                      errors.email ? 'text-red-500' : 'text-stone-400 dark:text-stone-400'
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
                    placeholder="Enter your email ID"
                    disabled={loading || googleLoading}
                    className={`w-full bg-[#FFFFFF] dark:bg-[#120805] text-stone-900 dark:text-[#FAF5F0] pl-12 pr-4 h-[54px] rounded-2xl outline-none font-semibold text-base transition-all shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-400/90 border ${
                      errors.email
                        ? 'border-red-500/80 focus:border-red-500 focus:ring-4 focus:ring-red-500/15'
                        : 'border-stone-300 dark:border-[#4A2B1C] focus:border-[#C89D5A] dark:focus:border-[#E6B25A] focus:ring-4 focus:ring-[#C89D5A]/15'
                    }`}
                  />
                </div>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-1.5 ml-1 mt-1"
                  >
                    <AlertCircle size={13} className="shrink-0" /> {errors.email}
                  </motion.p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-800 dark:text-stone-200">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs sm:text-sm font-bold text-[#A67538] dark:text-[#E6B25A] hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
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
                    placeholder="Enter your password"
                    disabled={loading || googleLoading}
                    className={`w-full bg-[#FFFFFF] dark:bg-[#120805] text-stone-900 dark:text-[#FAF5F0] pl-12 pr-12 h-[54px] rounded-2xl outline-none font-semibold text-base transition-all shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-400/90 border ${
                      errors.password
                        ? 'border-red-500/80 focus:border-red-500 focus:ring-4 focus:ring-red-500/15'
                        : 'border-stone-300 dark:border-[#4A2B1C] focus:border-[#C89D5A] dark:focus:border-[#E6B25A] focus:ring-4 focus:ring-[#C89D5A]/15'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-semibold text-red-500 dark:text-red-400 flex items-center gap-1.5 ml-1 mt-1"
                  >
                    <AlertCircle size={13} className="shrink-0" /> {errors.password}
                  </motion.p>
                )}
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full mt-3 h-[54px] sm:h-[56px] rounded-2xl bg-gradient-to-r from-[#D9A35F] to-[#C89D5A] hover:from-[#E6B25A] hover:to-[#D9A35F] text-stone-950 font-black text-sm sm:text-base uppercase tracking-wider shadow-lg hover:shadow-xl hover:shadow-[#C89D5A]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={21} className="animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={19} />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-stone-300 dark:border-[#381F15]"></div>
                <span className="flex-shrink-0 mx-3 text-stone-400 dark:text-stone-400 text-xs font-black uppercase tracking-widest">
                  OR
                </span>
                <div className="flex-grow border-t border-stone-300 dark:border-[#381F15]"></div>
              </div>

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={async () => {
                  try {
                    setGoogleLoading(true);
                    const googleUser = await signInWithGoogle();
                    if (!googleUser || !googleUser.email) {
                      throw new Error('Could not retrieve Google user profile.');
                    }

                    const response = await api.post('/auth/firebase-login', {
                      email: googleUser.email,
                      name: googleUser.displayName,
                      avatar: googleUser.photoURL,
                    });

                    if (response.data?.user && response.data?.token) {
                      updateUser(response.data.user, response.data.token);
                      if (response.data.user.phoneVerified) {
                        toast.success('Welcome back to The Chocolate Mine!');
                        navigate('/');
                      } else {
                        toast.success('Welcome! Please add your mobile number for delivery updates.');
                        navigate('/verify-phone');
                      }
                    }
                  } catch (err) {
                    console.error('Google Sign-In failed:', err);
                    toast.error(err.response?.data?.message || 'Google Sign-In failed. Please try again.');
                  } finally {
                    setGoogleLoading(false);
                  }
                }}
                disabled={googleLoading || loading}
                className="w-full h-[54px] sm:h-[56px] rounded-2xl bg-white dark:bg-[#150B07] border border-stone-300 dark:border-[#4A2B1C] text-stone-800 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-[#20110B] font-bold text-sm sm:text-base tracking-wide shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <>
                    <Loader2 size={21} className="animate-spin text-[#C89D5A]" />
                    <span>Connecting Google...</span>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom Register Link */}
            <div className="text-center pt-6 pb-2">
              <p className="text-sm font-semibold text-stone-600 dark:text-stone-400">
                New explorer?{' '}
                <Link
                  to="/register"
                  className="font-black text-[#A67538] dark:text-[#E6B25A] hover:underline ml-1 inline-flex items-center gap-1"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>

          <div className="hidden md:block text-center text-xs text-stone-400 dark:text-stone-400/80 pt-4">
            Protected by reCAPTCHA & Privacy Policy
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
