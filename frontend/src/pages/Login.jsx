import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowRight, ChevronRight, Eye, EyeOff } from 'lucide-react';
import Button from '../components/ui/Button';

const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('error') === 'GoogleAuthFailed') {
      toast.error('Google Authentication Failed. Please try again.');
    }
  }, [searchParams]);

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login({ email, password });
      toast.success('Welcome back to the Mine!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-background overflow-hidden">
      
      {/* Left: Illustration (Desktop Only) */}
      <div className="hidden lg:flex w-1/2 bg-footer relative items-center justify-center p-20 overflow-hidden border-r border-border/10">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511381939415-e44015466834?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-footer via-footer/80 to-transparent"></div>
        
        <div className="relative z-10 text-footer-text max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-7xl font-black mb-8 leading-[0.9] tracking-tighter">
              Dive into the <span className="text-accent">Sweetest</span> Mine.
            </h1>
            <p className="text-xl font-medium opacity-80 mb-12 leading-relaxed italic">
              Every bite tells a story of craftsmanship and passion. Log in to continue your journey.
            </p>
            
            <div className="grid grid-cols-2 gap-8 pt-12 border-t border-footer-text/10">
               <div>
                  <p className="text-4xl font-black text-accent">50k+</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Happy Clients</p>
               </div>
               <div>
                  <p className="text-4xl font-black text-accent">100%</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Fresh Baked</p>
               </div>
            </div>
          </motion.div>
        </div>


        {/* Floating Elements */}
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-20 text-9xl opacity-20"
        >
          🧁
        </motion.div>
        <motion.div 
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-20 left-20 text-9xl opacity-20"
        >
          🍫
        </motion.div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-20 relative bg-card">
        <div className="max-w-md w-full mx-auto">
          
          <div className="mb-12">
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-black text-muted hover:text-primary uppercase tracking-widest transition-colors mb-8">
              <ArrowRight className="rotate-180" size={14} /> Back to Shop
            </Link>
            <h2 className="text-5xl font-black text-heading tracking-tighter mb-4 uppercase">Welcome Back</h2>
            <p className="text-muted font-black text-xs uppercase tracking-widest opacity-60">Log in to manage your orders and profile</p>
          </div>

          <div className="space-y-6">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-4 py-4 px-6 border-2 border-border rounded-2xl font-black text-heading hover:bg-surface/5 transition-all group"
            >
              <GoogleIcon />
              <span className="tracking-widest text-xs uppercase">CONTINUE WITH GOOGLE</span>
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/30"></div></div>
              <div className="relative flex justify-center text-[10px] font-black text-muted uppercase tracking-[0.3em]"><span className="bg-card px-4">Or use Email</span></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-2">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface/5 border border-border text-heading pl-16 pr-6 py-5 rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-black text-sm placeholder:text-muted/30"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between px-2">
                  <label className="text-[10px] font-black text-muted uppercase tracking-widest">Password</label>
                  <Link to="/forgot-password" title="Forgot Password" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline cursor-pointer">Forgot?</Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface/5 border border-border text-heading pl-16 pr-14 py-5 rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-black text-sm placeholder:text-muted/30"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full py-5 rounded-2xl shadow-premium mt-4 bg-primary text-button-text hover:brightness-110 font-black tracking-widest uppercase"
                size="lg"
                icon={LogIn}
              >
                SIGN IN TO ACCOUNT
              </Button>
            </form>

            <div className="text-center pt-8">
              <p className="text-muted font-black text-[10px] uppercase tracking-widest">
                New explorer?{' '}
                <Link to="/register" className="text-primary font-black hover:underline inline-flex items-center gap-1">
                  Create an account <ChevronRight size={14} />
                </Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
