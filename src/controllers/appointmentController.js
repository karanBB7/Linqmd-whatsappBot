const { createToken, getUserToken, setUserToken } = require('../middleware/tokenMiddleware');
const { sendWhatsAppMessage, sendListMessage } = require('../middleware/whatsappMiddleware');
const { checkAppointment } = require('../services/viewService');
const { DateTime } = require('luxon');
const { setUserState, getUserState, clearUserState } = require('../services/stateManager');



const { handleCancelAppointment, handleDropStatus } = require('../handllers/cancelHandler');
const { handleViewAppointment, otherAppointments } = require('../handllers/viewHandlers');
const { handleFeedback, captureFeedback, captureReasonForVisit, captureOvercome, captureRating } = require('../handllers/feedbackHandler.js');

const commandHandlers = {
  initial: async (fromNumber, listid) => {
    return listid === null ? handleInitialMessage(fromNumber) : handleUnknownOption(fromNumber);
  },
  awaitingSelection: handleSelection,
  viewingAppointment: handleViewAppointment,
  cancellingAppointment: handleCancelAppointment,
  awaitingCancellationConfirmation: async (fromNumber, listid) => {
    return listid ? handleDropStatus(fromNumber, listid) : handleUnknownOption(fromNumber);
  },
  giveusyourfeedback: async (fromNumber) => {
    const token = getUserToken(fromNumber);
    return handleFeedback(fromNumber, token);
  },
  captureFeedback: async (fromNumber, listid, messages) => {
    return listid === null ? captureFeedback(fromNumber, messages) : handleUnknownOption(fromNumber);
  },
  captureReasonForVisit: async (fromNumber, listid, messages) => {
    return listid === null ? captureReasonForVisit(fromNumber, messages) : handleUnknownOption(fromNumber);
  },
  captureOvercome: async (fromNumber, listid, messages) => {
    return listid === null ? captureOvercome(fromNumber, messages) : handleUnknownOption(fromNumber);
  },
  captureRating: async (fromNumber, listid) => {
    return listid ? captureRating(fromNumber, listid) : handleUnknownOption(fromNumber);
  }
};

async function handleIncomingMessage(message) {
  const { fromNumber, messages, listid } = message;
  const currentState = getUserState(fromNumber);

  console.log(`${fromNumber}. Current state: ${currentState}, listid: ${listid}`);

  try {
    const handler = commandHandlers[currentState] || handleUnknownOption;
    await handler(fromNumber, listid, messages);
  } catch (error) {
    console.error(`Error processing message for ${fromNumber}:`, error);
    await sendWhatsAppMessage(fromNumber, "Sorry, an error occurred. Please try again.");
    clearUserState(fromNumber);
  }
}


async function handleInitialMessage(fromNumber) {
  try {
    const appointmentData = await checkAppointment(fromNumber);
    
    if (appointmentData.success === 'true') {
      const token = createToken(appointmentData.Username, fromNumber);
      setUserToken(fromNumber, token);
      // console.log("token", token);

      const date = DateTime.fromISO(appointmentData.date);
      const formattedDate = date.toFormat('cccc d LLLL');

      if (appointmentData.appointment_tense === 'future') {
        const message = `Dear ${appointmentData.patient_name}, You have an appointment with ${appointmentData.Docfullname} at ${appointmentData.clinic_name} on ${new Date(appointmentData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${appointmentData.slotTime}.`;
        
        await sendWhatsAppMessage(fromNumber, message);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const listMessage = {
          title: 'Do you want to?',
          body: 'Please select the respective activity.',
          options: ['View Appointment', 'Cancel Appointment']
        };
        await sendListMessage(fromNumber, listMessage);
        
        setUserState(fromNumber, 'awaitingSelection');

      } else {
        const message = `Dear ${appointmentData.patient_name}, You previously visited ${appointmentData.Docfullname} on ${new Date(appointmentData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${appointmentData.slotTime}.`;
        await sendWhatsAppMessage(fromNumber, message);
        await handleOtherAppointments(fromNumber);
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



async function handleSelection(fromNumber, listid) {
  console.log(`Handling selection for ${fromNumber}. Selected option: ${listid}`);
  if (listid === 'viewappointment') {
    setUserState(fromNumber, 'viewingAppointment');
    await handleViewAppointment(fromNumber);
  } else if (listid === 'cancelappointment') {
    setUserState(fromNumber, 'cancellingAppointment');
    await handleCancelAppointment(fromNumber);
  } else if (listid === 'giveusyourfeedback') {
    setUserState(fromNumber, 'giveusyourfeedback');
    const token = getUserToken(fromNumber);
    if(token){
      await handleFeedback(fromNumber, token);
    }else{
      await handleUnknownOption(fromNumber);
    }
     
  } else {
    await handleUnknownOption(fromNumber);
  }
}


async function handleUnknownOption(fromNumber) {
  await sendWhatsAppMessage(fromNumber, "Unknown option. Please try again.");
  clearUserState(fromNumber);
}

module.exports = { handleIncomingMessage };