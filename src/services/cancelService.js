const axios = require('axios');

const API_URL = 'https://www.linqmd.com/webhook-appointment';
const API_AUTH = 'Basic bGlucW1kOlNAaVBrSG1GU2FpOXo=';

async function makeApiRequestCancel(payload, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.post(API_URL, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': API_AUTH
        },
        timeout: 30000 // Increase timeout to 30 seconds
      });
      return response.data;
    } catch (error) {
      console.error(`API Request Error (Attempt ${attempt}/${retries}):`, error.message);
      if (attempt === retries) {
        throw error;
      }
      // Wait for 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function getDatesToDrop(phonenumber) {
  const payload = {
    mobilenumber: phonenumber,
    type: "3"
  };
  return makeApiRequestCancel(payload);
}

async function dropDates(phonenumber, bookingDateID) {
  const payload = {
    mobilenumber: phonenumber,
    type: "3",
    booking_date: bookingDateID
  };
  try {
    const response = await makeApiRequestCancel(payload);
    console.log('Drop Dates API Response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('Error in dropDates:', error.message);
    return { status: "error", message: "Failed to cancel appointment. Please try again later." };
  }
}
module.exports = { getDatesToDrop, dropDates };