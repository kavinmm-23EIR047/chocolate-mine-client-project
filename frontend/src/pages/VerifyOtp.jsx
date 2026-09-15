import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, ShieldCheck, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import LightLogo from '../assets/light logo.png';

const VerifyOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const email = location.state?.email || new URLSearchParams(location.search).get('email') || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!email) navigate('/login', { replace: true });
  }, [email, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      toast.error('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifySignup({ email, otp });
      const { user, token } = response.data;
      if (!user?.isVerified || !token) {
        throw new Error('Verification response was incomplete');
      }
      updateUser(user, token);
      toast.success('Account verified successfully! Welcome!');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await authService.resendSignupOtp(email);
      toast.success('A new 6-digit code was sent to your email.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-[#EDE4DB] dark:bg-[#0D0604] p-3 sm:p-6 lg:p-10">
      <div className="w-full max-w-md rounded-3xl bg-[#FAF5F0] dark:bg-[#1E110B] border border-[#D9C4B2] dark:border-[#4A2B1C]/60 p-0 shadow-2xl overflow-hidden">
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

        <div className="p-6 sm:p-8">
          <div className="text-center">
            <h1 className="text-2xl font-black text-stone-900 dark:text-[#F8F1E7] uppercase tracking-tight">
              Verify your email
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm font-semibold text-stone-500 dark:text-stone-400 leading-relaxed">
              Enter the 6-digit code sent to <br />
              <strong className="text-stone-900 dark:text-stone-100">{email}</strong>
            </p>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-5">
            <input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full h-[60px] rounded-2xl border-2 border-stone-300 dark:border-[#4A2B1C] bg-white dark:bg-[#120805] text-stone-900 dark:text-[#FAF5F0] text-center text-3xl font-black tracking-[0.4em] outline-none focus:border-[#C89D5A] dark:focus:border-[#E6B25A] focus:ring-4 focus:ring-[#C89D5A]/15 transition-all shadow-sm placeholder:text-stone-300 dark:placeholder:text-stone-600"
              aria-label="Verification OTP"
            />
            <button
              type="submit"
              disabled={loading || resending || otp.length !== 6}
              className="w-full h-[54px] sm:h-[56px] rounded-2xl bg-gradient-to-r from-[#D9A35F] to-[#C89D5A] hover:from-[#E6B25A] hover:to-[#D9A35F] text-stone-950 font-black text-sm sm:text-base uppercase tracking-wider shadow-lg hover:shadow-xl hover:shadow-[#C89D5A]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={21} className="animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Check size={20} />
                  <span>Verify & Continue</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={resend}
              disabled={loading || resending}
              className="text-xs sm:text-sm font-black text-[#A67538] dark:text-[#E6B25A] hover:underline uppercase tracking-wider disabled:opacity-50 cursor-pointer"
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
