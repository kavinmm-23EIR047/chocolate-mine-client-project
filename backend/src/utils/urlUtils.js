const getFrontendUrl = () => {
  const url = process.env.NODE_ENV === 'production'
    ? (process.env.FRONTEND_URL_PROD || 'https://thechocolatemine.in')
    : (process.env.FRONTEND_URL || 'http://localhost:5173');
  return url.replace(/\/$/, '');
};

module.exports = { getFrontendUrl };
