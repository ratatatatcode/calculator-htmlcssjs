const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// Simple rate limiter per user for /request-match
const requestTimestamps = {};

function authenticateJWT(req, res, next) {
  console.log("HEADERS:", req.headers);
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.id || decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

// Example: Only allow verified users to match
function requireVerifiedUser(req, res, next) {
  if (req.user && req.user.isVerified) {
    next();
  } else {
    return res.status(403).json({ error: 'User must be verified to use matching.' });
  }
}

// Rate limiting for matching requests
function rateLimitMatchingRequests(req, res, next) {
  // Temporarily disable rate limiting for testing
  console.log('Rate limiter bypassed for testing');
  return next();
  
  // Original rate limiting code (commented out for testing)
  /*
  const userId = req.user.id;
  const now = Date.now();

  // For development/testing, allow more frequent requests
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const timeLimit = isDevelopment ? 1 * 60 * 1000 : 60 * 60 * 1000; // 1 min in dev, 1 hour in prod

  if (!requestTimestamps[userId]) {
    requestTimestamps[userId] = now;
    return next();
  }

  const timeSinceLast = now - requestTimestamps[userId];

  if (timeSinceLast < timeLimit) {
    const minutesLeft = Math.ceil((timeLimit - timeSinceLast) / 60000);
    return res.status(429).json({
      error: `Please wait ${minutesLeft} minute(s) before trying again.`,
    });
  }

  requestTimestamps[userId] = now;
  next();
  */
}

module.exports = {
  authenticateJWT,
  requireVerifiedUser,
  rateLimitMatchingRequests,
};
