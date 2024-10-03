const { createToken, setUserToken } = require('../middleware/tokenMiddleware');
const { sendWhatsAppMessage, sendListMessage } = require('../middleware/whatsappMiddleware');
const { checkAppointment } = require('../services/viewService');
const { setUserState} = require('../services/stateManager');
const { otherAppointments } = require('../handllers/viewHandlers');
const { captureOvercome } = require('../handllers/feedbackHandler');

    async function handleInitialMessage(fromNumber) {
        try {
            const appointmentData = await checkAppointment(fromNumber);
            if (appointmentData.success === 'true') {
                const token = createToken(appointmentData.Username, fromNumber, appointmentData.Docfullname, appointmentData.booking_id);                
                setUserToken(fromNumber, token);        
                if (appointmentData.appointment_tense === 'future') {
                const message = `Dear ${appointmentData.patient_name}, You have an appointment with ${appointmentData.Docfullname} at ${appointmentData.clinic_name} on ${new Date(appointmentData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${appointmentData.slotTime}.`;
                
                await sendWhatsAppMessage(fromNumber, message);
                await new Promise(resolve => setTimeout(resolve, 1000));
                const listMessage = {
                    title: 'Do you want to?',
                    body: 'Please select the respective activity.',
                    options: ['View Appointment', 'Cancel Appointment']
                };

                await new Promise(resolve => setTimeout(resolve, 2000));
                await sendListMessage(fromNumber, listMessage);
                
                setUserState(fromNumber, 'awaitingSelection');
        
                } else {
                const message = `Hello, ${appointmentData.patient_name}, thank you for consulting, ${appointmentData.Docfullname}. on ${new Date(appointmentData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${appointmentData.slotTime}. Please help other patients like you, by providing a detailed feedback on your experience.`;
                await sendWhatsAppMessage(fromNumber, message);
                await new Promise(resolve => setTimeout(resolve, 2000));
                await captureOvercome(fromNumber, token);
                }
            } else {
                await sendWhatsAppMessage(fromNumber, "Sorry, we couldn't find any appointments for you.");
            }

        } catch (error) {
        console.error('Error in handleInitialMessage:', error);
        await sendWhatsAppMessage(fromNumber, "An error occurred while processing your request. Please try again later.");
        }
    }
  
  async function handleOtherAppointments(fromNumber) {
    try {
      const checkforotherappointments = await otherAppointments(fromNumber);
  
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      const listMessage = checkforotherappointments ? {
        title: 'Do you want to?',
        body: 'Please select the respective activity.',
        options: ['Give us your feedback', 'View Appointment', 'Cancel Appointment']
      } : {
        title: 'Do you want to?',
        body: 'Please select the respective activity.',
        options: ['Give us your feedback']
      };
  
      await sendListMessage(fromNumber, listMessage);
      setUserState(fromNumber, 'awaitingSelection');
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }


  async function sendListAgain(fromNumber){
    const appointmentData = await checkAppointment(fromNumber);
    if (appointmentData.appointment_tense === 'future') {
      const listMessage = {
        title: 'Do you want to?',
        body: 'Please select the respective activity.',
        options: ['View Appointment', 'Cancel Appointment']
    };
    await sendListMessage(fromNumber, listMessage);
    setUserState(fromNumber, 'awaitingSelection');
    }else{
      await handleOtherAppointments(fromNumber);
    }
  }

  async function sendYesOrNo(fromNumber){
      const listMessage = {
        title: 'Do you have anything else?',
        body: 'Please select the respective activity.',
        options: ['Yes', 'No']
    };
    await sendListMessage(fromNumber, listMessage);
    setUserState(fromNumber, 'awaitingSelection');
    
  }

  
  module.exports = {handleInitialMessage , sendListAgain, sendYesOrNo};
  