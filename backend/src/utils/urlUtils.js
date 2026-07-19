const getFrontendUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.FRONTEND_URL_PROD || 'https://chocolate-mine-client-project.vercel.app';
  }
  return process.env.FRONTEND_URL || 'http://localhost:5173';
};

module.exports = { getFrontendUrl };
