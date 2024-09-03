const { DateTime } = require('luxon');
const { sendWhatsAppMessage, sendListMessage } = require('../middleware/whatsappMiddleware');
const { viewAppointment } = require('../services/viewService');
const { clearUserState } = require('../services/stateManager');

async function handleViewAppointment(fromNumber) {
    try {
      const appointmentData = await viewAppointment(fromNumber);
      // console.log('View Appointment Response:', appointmentData);
  
      let message = '';
  
      if (appointmentData.booking_data && Array.isArray(appointmentData.booking_data) && appointmentData.booking_data.length > 0) {
        const patientName = appointmentData.booking_data[0].patient_name ? 
          appointmentData.booking_data[0].patient_name.charAt(0).toUpperCase() + appointmentData.booking_data[0].patient_name.slice(1) : 
          'Patient';
  
        message = `*Dear ${patientName}*, Your appointment details:\n\n`;
  
        if (appointmentData.booking_data.length > 1) {
          appointmentData.booking_data.forEach((appointment, index) => {
            const clinicName = appointment.clinic_name || 'N/A';
            const time = appointment.Time || 'N/A';
            const bookingDate = appointment.booking_date ? 
              new Date(appointment.booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 
              'N/A';
            const doctorName = appointment.fullname || 'your doctor';
            const appointmentNumber = index + 1;
  
            message += `*Appointment ${appointmentNumber}:*\n`;
            message += `Your appointment with *${doctorName}* at *${clinicName}* on *${bookingDate}* at *${time}* is accepted. `;
            message += '\n\n';
          });
        } else {
          const appointment = appointmentData.booking_data[0];
          const clinicName = appointment.clinic_name || 'N/A';
          const time = appointment.Time || 'N/A';
          const bookingDate = appointment.booking_date ? 
            new Date(appointment.booking_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 
            'N/A';
          const doctorName = appointment.fullname || 'your doctor';
  
          message += `Your appointment with *${doctorName}* at *${clinicName}* on *${bookingDate}* at *${time}* is accepted. `;
          message += '\n\n';
        }
  
        message += 'Thank you for choosing our services. We look forward to seeing you.';
      } else {
        message = 'No appointments found.';
      }
  
      await sendWhatsAppMessage(fromNumber, message);
    } catch (error) {
      console.error('Error handling view appointment:', error);
      await sendWhatsAppMessage(fromNumber, "Sorry, we encountered an error while fetching your appointment details.");
    }finally {
      clearUserState(fromNumber);
    }
  }


  async function otherAppointments(fromNumber) {
    const appointmentData = await viewAppointment(fromNumber);
    if (appointmentData && appointmentData.booking_data.length > 0) {
        return true; 
    } else {
        return false;
    }
  }



  module.exports = { handleViewAppointment, otherAppointments };