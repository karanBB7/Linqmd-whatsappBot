const axios = require('axios');

const API_URL = 'https://www.linqmd.com/webhook-appointment';
const API_AUTH = 'Basic bGlucW1kOlNAaVBrSG1GU2FpOXo=';

async function checkAppointment(mobileNumber) {
  try {
    const response = await axios.post(API_URL, { mobilenumber: mobileNumber }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_AUTH
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error checking appointment:', error);
    throw error;
  }
}

async function viewAppointment(mobileNumber, username) {
  try {
    const response = await axios.post(API_URL, {
      mobilenumber: mobileNumber,
      type: "4"
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_AUTH
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error viewing appointment:', error);
    throw error;
  }
}

module.exports = { checkAppointment, viewAppointment };