import { useEffect } from 'react'  // Remove StrictMode import
import { createRoot } from 'react-dom/client'
import { Provider, useDispatch } from 'react-redux'
import { store } from './redux/store'
import { initSocket } from './sockets/socketManager'
import './index.css'
import App from './App.jsx'

const RootApp = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    initSocket(dispatch);

    // Register Service Worker for Firebase Messaging
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('🔥 FCM Service Worker registered with scope:', registration.scope);
        })
        .catch((err) => {
          console.error('❌ FCM Service Worker registration failed:', err);
        });
    }
  }, [dispatch]);

  return <App />;
};

createRoot(document.getElementById('root')).render(
  // <StrictMode>  // COMMENT THIS OUT OR REMOVE IT
  <Provider store={store}>
    <RootApp />
  </Provider>
  // </StrictMode>
)