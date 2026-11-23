import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ScooterLoader from '../components/ScooterLoader';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    console.log('🍭 OAuthCallback: Received token?', !!token);
    
    const finishGoogleSignIn = async () => {
      if (!token) {
        const error = searchParams.get('error');
        console.error('🍭 OAuthCallback: No token found. Error:', error);
        navigate(`/login?error=${error || 'InvalidToken'}`);
        return;
      }

      console.log('🍭 OAuthCallback: Google login successful, storing token...');
      try {
        sessionStorage.setItem('token', token);
        localStorage.setItem('token', token);
      } catch (storageError) {
        console.warn('OAuth token storage unavailable; continuing with session cookie.', storageError);
      }

      try {
        const response = await api.get('/auth/me');
        const { user, requiresDetails } = response.data || {};
        if (user) updateUser(user, token);

        if (user?.role === 'staff') {
          navigate('/staff/dashboard', { replace: true });
          return;
        }

        if (user?.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
          return;
        }

        if (requiresDetails || !user?.phoneVerified) {
          navigate('/verify-phone', { replace: true });
          return;
        }

        navigate('/', { replace: true });
      } catch (error) {
        console.error('🍭 OAuthCallback: Could not load Google account details.', error);
        navigate('/login?error=GoogleAuthFailed', { replace: true });
      }
    };

    finishGoogleSignIn();
  }, [searchParams, navigate, updateUser]);

  return (
    <div className="min-h-[70vh]">
      <ScooterLoader isVisible={true} text="Verifying your sweet identity..." />
    </div>
  );
};

export default OAuthCallback;
