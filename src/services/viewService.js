const axios = require('axios');
const https = require('https');


const API_URL = 'https://www.linqmd.com/webhook-appointment';
const API_AUTH = 'Basic bGlucW1kOlNAaVBrSG1GU2FpOXo=';

const API_URL_records = 'https://localhost/linqmd/api/getRecords';
const API_URL_get_doctors = 'https://localhost/linqmd/api/getDoctorData';

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

async function getAppointmentRecords(mobileNumber) {
  try {
      if (!mobileNumber) {
          throw new Error('Mobile number is required');
      }

      const response = await axios.post(`${API_URL_records}/${mobileNumber}`, 
          { phone: mobileNumber },
          {
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': API_AUTH,
                  'Accept': 'application/json'
              },
              httpsAgent: new https.Agent({
                  rejectUnauthorized: false
              })
          }
      );

      return response.data || { message: 'No records found' };
  } catch (error) {
      console.error('Error getting appointment records:', error.message);
      throw error;
  }
}

async function getDoctorData(uid) {
  try {

      const response = await axios.post(`${API_URL_get_doctors}/${uid}`, 
        { uid: uid },
          {
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': API_AUTH,
                  'Accept': 'application/json'
              },
              httpsAgent: new https.Agent({
                  rejectUnauthorized: false
              })
          }
      );

      return response.data || { message: 'No records found' };
  } catch (error) {
      console.error('Error getting appointment records:', error.message);
      throw error;
  }
}


module.exports = { 
  checkAppointment,
  viewAppointment,
  getAppointmentRecords,
  getDoctorData
  };