const { getUserToken} = require('../middleware/tokenMiddleware');
const { sendWhatsAppMessage} = require('../middleware/whatsappMiddleware');
const { setUserState, getUserState, clearUserState } = require('../services/stateManager');


const { handleInitialMessage, sendListAgain, sendYesOrNo } = require('../handllers/mainHandler.js');
const { handleCancelAppointment, handleDropStatus } = require('../handllers/cancelHandler');
const { handleViewAppointment } = require('../handllers/viewHandlers');
const { handleFeedback, captureFeedback, captureReasonForVisit, captureOvercome, captureRating } = require('../handllers/feedbackHandler.js');

const commandHandlers = {
  initial: (fromNumber, listid) => 
    listid === null ? handleInitialMessage(fromNumber) : handleUnknownOption(fromNumber),
  
  awaitingSelection: handleSelection,
  viewingAppointment: handleViewAppointment,
  cancellingAppointment: handleCancelAppointment,
  giveusyourfeedback: handleFeedback,

  awaitingCancellationConfirmation: async (fromNumber, listid) => {
    if (!listid) return handleUnknownOption(fromNumber);
    try {
      await handleDropStatus(fromNumber, listid);
      return handleOther(fromNumber);
    } catch (error) {
      console.error('Error in handleDropStatus:', error);
      await sendWhatsAppMessage(fromNumber, "Sorry, there was an error cancelling your appointment. Please try again later.");
      return clearUserState(fromNumber);
    }
  },

  captureFeedback: (fromNumber, listid, messages) => 
    listid === null ? captureFeedback(fromNumber, messages) : handleUnknownOption(fromNumber),

  captureReasonForVisit: (fromNumber, listid, messages) => 
    listid === null ? captureReasonForVisit(fromNumber, messages) : handleUnknownOption(fromNumber),

  captureOvercome: (fromNumber, listid, messages) => {
    const token = getUserToken(fromNumber);
    return listid === null ? captureOvercome(fromNumber, messages, token) : handleUnknownOption(fromNumber);
  },

  captureRating: async (fromNumber, listid) => {
    if (!listid) return handleUnknownOption(fromNumber);
    await captureRating(fromNumber, listid);
    return handleOther(fromNumber);
  },

  awaitingYesNo: handleSelection
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
    await handleOther(fromNumber);
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
  } else if(listid === 'yes'){
    await sendListAgain(fromNumber);
  } else if(listid === 'no'){
    await sendWhatsAppMessage(fromNumber, "Thank you for using our service. Have a great day!");
    clearUserState(fromNumber);
  } else {
    await handleUnknownOption(fromNumber);
  }
}

async function handleUnknownOption(fromNumber) {
  await sendWhatsAppMessage(fromNumber, "Unknown option. Please try again.");
  await new Promise(resolve => setTimeout(resolve, 2000));
  await sendListAgain(fromNumber)
}

async function handleOther(fromNumber) {
  await new Promise(resolve => setTimeout(resolve, 3000));
  await sendYesOrNo(fromNumber);
  setUserState(fromNumber, 'awaitingYesNo');
}


module.exports = { handleIncomingMessage };