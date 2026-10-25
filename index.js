// Compatibility handler for Vercel's /api/index route. All API requests use the shared Express app.
module.exports = require('../server').app;
