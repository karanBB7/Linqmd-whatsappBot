const { createToken, decodeToken } = require('../middleware/tokenMiddleware');
const { sendWhatsAppMessage, sendListMessage } = require('../middleware/whatsappMiddleware');
const { checkAppointment } = require('../services/viewService');
const { DateTime } = require('luxon');
const { handleCancelAppointment, handleDropStatus } = require('../handllers/cancelHandler');
const { handleViewAppointment } = require('../handllers/viewHandlers');
const { setUserState, getUserState, clearUserState } = require('../services/stateManager');

async function handleIncomingMessage(message) {
  const { fromNumber, messages, listid } = message;
  const currentState = getUserState(fromNumber);

  console.log(`${fromNumber}. Current state: ${currentState}, listid: ${listid}`);

  try {
    switch (currentState) {
      case 'initial':
        await handleInitialMessage(fromNumber);
        break;
      case 'awaitingSelection':
        await handleSelection(fromNumber, listid);
        break;
      case 'viewingAppointment':
        await handleViewAppointment(fromNumber);
        break;
      case 'cancellingAppointment':
        await handleCancelAppointment(fromNumber);
        break;
      case 'awaitingCancellationConfirmation':
        if (listid) {
          await handleDropStatus(fromNumber, listid);
        } else {
          await handleUnknownOption(fromNumber);
        }
        break;
      default:
        await handleUnknownOption(fromNumber);
    }
  } catch (error) {
    console.error(`Error processing message for ${fromNumber}:`, error);
    await sendWhatsAppMessage(fromNumber, "Sorry, an error occurred. Please try again.");
    clearUserState(fromNumber);
  }
}

async function handleInitialMessage(fromNumber) {
  const appointmentData = await checkAppointment(fromNumber);
  
  if (appointmentData.success === 'true') {
    const token = createToken(appointmentData.Username, fromNumber);
    console.log("token", token);

    const date = DateTime.fromISO(appointmentData.date);
    const formattedDate = date.toFormat('cccc d LLLL');

    if (appointmentData.appointment_tense === 'future') {
      const message = `Dear ${appointmentData.patient_name}, You have an appointment with ${appointmentData.Docfullname} at ${appointmentData.clinic_name} on ${new Date(appointmentData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${appointmentData.slotTime}.`;
      await sendWhatsAppMessage(fromNumber, message);

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
  }
  
  } else {
    await sendWhatsAppMessage(fromNumber, "Sorry, we couldn't find any appointments for you.");
    clearUserState(fromNumber);
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
  } else {
    await handleUnknownOption(fromNumber);
  }
}

async function handleUnknownOption(fromNumber) {
  await sendWhatsAppMessage(fromNumber, "Unknown option. Please try again.");
  clearUserState(fromNumber);
  // await handleInitialMessage(fromNumber);
}

module.exports = { handleIncomingMessage };