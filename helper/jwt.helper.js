const jwt = require('jsonwebtoken');

// Generate Access Token (Short Expiry)
const generateAccessToken = (user) => {
  return jwt.sign({ _id: user._id, walletAddress: user.walletAddress }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES, // 15m
  });
};

// Generate Refresh Token (Long Expiry)
const generateRefreshToken = (user) => {
  return jwt.sign({ _id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES, // 7d
  });
};

// Verify Access Token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Verify Refresh Token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };
