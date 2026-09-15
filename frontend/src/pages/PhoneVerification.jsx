import React, { useState } from 'react';
import { Phone, ArrowLeft, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import LightLogo from '../assets/light logo.png';

const PhoneVerification = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const handleSavePhone = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return toast.error('Please enter a valid 10-digit phone number.');
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/save-phone', { phone: cleanPhone });

      if (response.data?.user) {
        updateUser(response.data.user);
      } else {
        updateUser({ ...user, phone: cleanPhone, phoneVerified: true });
      }

      toast.success('Phone number saved successfully!');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save phone number. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-[#EDE4DB] dark:bg-[#0D0604] p-3 sm:p-6 lg:p-10">
      <section className="w-full max-w-md rounded-3xl border border-[#D9C4B2] dark:border-[#4A2B1C]/60 bg-[#FAF5F0] dark:bg-[#1E110B] p-0 shadow-2xl overflow-hidden">
        {/* Brand Banner (Flush top & sides with rounded bottom & full character visible) */}
        <div className="relative w-full h-[280px] sm:h-[300px] rounded-b-[32px] overflow-hidden text-white shadow-xl shrink-0">
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

        <div className="p-6 sm:p-8">
          {/* Instructions & User Email */}
          <div className="text-center mb-5">
            <h3 className="text-lg sm:text-xl font-black uppercase text-stone-900 dark:text-[#FAF5F0] tracking-tight">
              Add Phone Number
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-stone-600 dark:text-stone-300 mt-1">
              Please enter your 10-digit Phone Number to continue
            </p>
            {user?.email && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-200/80 dark:bg-stone-800/90 text-xs sm:text-sm font-bold text-stone-700 dark:text-stone-300">
                <span>Email ID:</span>
                <strong className="text-[#A67538] dark:text-[#E6B25A]">{user.email}</strong>
              </div>
            )}
          </div>

          {/* Simple Phone Input Form */}
          <form className="mt-6 space-y-5" onSubmit={handleSavePhone}>
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-black uppercase tracking-wider text-stone-800 dark:text-stone-200 block ml-0.5">
                Phone Number
              </label>
              <div className="flex gap-2.5">
                <span className="flex items-center justify-center rounded-2xl border border-stone-300 dark:border-[#4A2B1C] bg-white dark:bg-[#120805] px-4 font-black text-stone-800 dark:text-stone-200 text-base shadow-sm">
                  +91
                </span>
                <div className="relative flex-1">
                  <Phone className="pointer-events-none absolute left-4 top-4 text-stone-400" size={20} />
                  <input
                    autoFocus
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter 10-digit phone number"
                    disabled={loading}
                    className="w-full h-[54px] bg-white dark:bg-[#120805] border border-stone-300 dark:border-[#4A2B1C] text-stone-900 dark:text-[#FAF5F0] pl-12 pr-4 rounded-2xl outline-none focus:border-[#C89D5A] dark:focus:border-[#E6B25A] focus:ring-4 focus:ring-[#C89D5A]/15 transition-all font-bold text-base shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-400/90"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.replace(/\D/g, '').length !== 10}
              className="w-full mt-4 h-[54px] sm:h-[56px] rounded-2xl bg-gradient-to-r from-[#D9A35F] to-[#C89D5A] hover:from-[#E6B25A] hover:to-[#D9A35F] text-stone-950 font-black text-sm sm:text-base uppercase tracking-wider shadow-lg hover:shadow-xl hover:shadow-[#C89D5A]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={21} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save & Continue</span>
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default PhoneVerification;
