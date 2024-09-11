const { getUserToken} = require('../middleware/tokenMiddleware');
const { sendWhatsAppMessage} = require('../middleware/whatsappMiddleware');
const { setUserState, getUserState, clearUserState } = require('../services/stateManager');


const { handleInitialMessage, sendListAgain } = require('../handllers/mainHandler.js');
const { handleCancelAppointment, handleDropStatus } = require('../handllers/cancelHandler');
const { handleViewAppointment } = require('../handllers/viewHandlers');
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
  await sendListAgain(fromNumber)
}

module.exports = { handleIncomingMessage };