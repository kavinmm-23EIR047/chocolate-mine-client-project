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