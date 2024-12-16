const axios = require('axios');
const https = require('https');


const API_DOMAIN = 'http://13.235.8.91/api';
const API_AUTH = 'Basic bGlucW1kOlNAaVBrSG1GU2FpOXo=';

const API_URL_records = `${API_DOMAIN}/getRecords`;
const API_URL_get_doctors = `${API_DOMAIN}/getDoctorData`;
const API_URL_give_feedback = `${API_DOMAIN}/giveFeedback`;
const API_URL_get_doctor_by_name = `${API_DOMAIN}/getUserByName`;
const API_URL_get_appointment = `${API_DOMAIN}/getAppointment`;
const API_URL_get_cancel_booking = `${API_DOMAIN}/getCancelBookings`;
const API_URL_get_cancel_booking_id = `${API_DOMAIN}/cancelBooking`;




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


async function giveFeedback(uid, phone) {
  try {

      const response = await axios.post(`${API_URL_give_feedback}/${uid}/${phone}`, 
        { uid: uid, phone:phone },
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

async function getDoctorByName(docname) {
  try {
    const response = await axios.get(`${API_URL_get_doctor_by_name}`, {
      params: {
        field_name: docname
      },
      headers: {
        'Authorization': 'Basic bGlucW1kOlNAaVBrSG1GU2FpOXo=',
        'Accept': 'application/json'
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    return response.data || { message: 'No records found' };
  } catch (error) {
    console.error('Error getting doctor records:', error.message);
    throw error;
  }
}

async function getAppointment(uid, phone) {
  try {
    const response = await axios.post(`${API_URL_get_appointment}/${uid}/${phone}`, 
      { uid: uid, phone:phone },
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


async function getCancelBookings(uid, phone) {
  try {
    const response = await axios.get(`${API_URL_get_cancel_booking}/${uid}/${phone}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_AUTH,
        'Accept': 'application/json'
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    return response.data || { message: 'No records found' };
  } catch (error) {
    console.error('Error getting appointment records:', error.message);
    throw error;
  }
}


async function cancelBooking(uid, phone, booking_id) {  
  try {
    const response = await axios.get(`${API_URL_get_cancel_booking_id}/${uid}/${phone}/${booking_id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_AUTH,
        'Accept': 'application/json'
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });

    return response.data || { message: 'No records found' };
  } catch (error) {
    console.error('Error cancelling appointment:', error.message);
    throw error;
  }
}




module.exports = { 
  getAppointmentRecords,
  getDoctorData,
  giveFeedback,
  getDoctorByName,
  getAppointment,
  getCancelBookings,
  cancelBooking
  };