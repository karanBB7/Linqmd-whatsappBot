const jwt = require('jsonwebtoken');

const SECRET_KEY = 'your_secret_key';

function createToken(username, fromNumber) {
  return jwt.sign({ username, fromNumber }, SECRET_KEY, { expiresIn: '1h' });
}

function decodeToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return { username: decoded.username, fromNumber: decoded.fromNumber };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

module.exports = { createToken, decodeToken };
