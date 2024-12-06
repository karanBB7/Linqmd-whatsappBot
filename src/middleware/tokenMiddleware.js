const jwt = require('jsonwebtoken');

const SECRET_KEY = 'your_secret_key';

// function createToken(username, fromNumber, docfullname, booking_id, doctor_user_id) {
//   return jwt.sign({ username, fromNumber, docfullname, booking_id, doctor_user_id }, SECRET_KEY, { expiresIn: '1h' });
// }


function createToken(fromNumber, uid, username, doctorname) {
  return jwt.sign({fromNumber, uid, username, doctorname }, SECRET_KEY, { expiresIn: '1h' });
}

function decodeToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return { 
      username: decoded.username, 
      fromNumber: decoded.fromNumber, 
      docfullname: decoded.docfullname, 
      booking_id: decoded.booking_id, 
      doctor_user_id: decoded.doctor_user_id, 
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}


const tokenStore = new Map();

function setUserToken(fromNumber, token) {
  tokenStore.set(fromNumber, token);
}

function getUserToken(fromNumber) {
  return tokenStore.get(fromNumber);
}


module.exports = { createToken, decodeToken, setUserToken, getUserToken };