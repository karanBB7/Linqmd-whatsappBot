const { getUserToken} = require('../middleware/tokenMiddleware.js');
const { sendWhatsAppMessage} = require('../middleware/whatsappMiddleware.js');

const {  getUserState, clearUserState } = require('../services/stateManager.js');


const { handleInitialMessage,handleFindDoctor, handleFindDoctorExplicit} = require('../handllers/mainHandler.js');

const { handleCancelAppointment, handleDropStatus } = require('../handllers/cancelHandler.js');

const { handleViewAppointment } = require('../handllers/viewHandlers.js');

const {  captureFeedback, captureReasonForVisit, captureOvercome, captureRating } = require('../handllers/feedbackHandler.js');

const { sendQuestion, sendAskAnything } = require('../handllers/questionAnswerHandler.js');


const { handleSelection } = require('../handllers/selectionHandler.js');

const { sendYesOrNo, sendAllServices } = require('../utils/messageUtils.js');





const commandHandlers = {
  initial: (fromNumber, listid, description, messages) => 
    listid === null ? handleFindDoctor(fromNumber) : handleUnknownOption(fromNumber),
  
  questionAndAnswer: sendAskAnything,

  getQuestion: async (fromNumber, listid, description, messages) => {
    if (listid === null) {
      const token = getUserToken(fromNumber);
      await sendQuestion(fromNumber, messages, token);
    } else {
      return handleUnknownOption(fromNumber);
    }
  },

  awaitingSelection: handleSelection,
  viewingAppointment: handleViewAppointment,
  cancellingAppointment: handleCancelAppointment,
  
  giveusyourfeedback: (fromNumber, listid, description, messages) => {
    const token = getUserToken(fromNumber);
    return captureOvercome(fromNumber, token);
  },

  awaitingCancellationConfirmation: async (fromNumber, listid, description, messages) => {
    if (!listid) return handleUnknownOption(fromNumber);
    try {
      const token = getUserToken(fromNumber);
      await handleDropStatus(fromNumber, listid, token);
      return sendYesOrNo(fromNumber);
    } catch (error) {
      console.error('Error in handleDropStatus:', error);
      await sendWhatsAppMessage(fromNumber, "Sorry, there was an error cancelling your appointment. Please try again later.");
      return clearUserState(fromNumber);
    }
  },

  captureRating: async (fromNumber, listid, description, messages) => {
    if (!listid) return handleUnknownOption(fromNumber);
    await captureRating(fromNumber, listid);
  },

  captureFeedback: async (fromNumber, listid, description, messages) => {
    if (listid === null) {
      await captureFeedback(fromNumber, messages);
    } else {
      return handleUnknownOption(fromNumber);
    }
  },

  captureReasonForVisit: async (fromNumber, listid, description, messages) => {
    if (listid === null) {
      await captureReasonForVisit(fromNumber, messages);
      return sendYesOrNo(fromNumber);
    } else {
      return handleUnknownOption(fromNumber);
    }
  },

  awaitingDoctorSelection: async (fromNumber, listid, description, messages) => {
    if (description !== null) {
      await handleInitialMessage(fromNumber, listid);
      return;
    } else {
      return handleUnknownOption(fromNumber);
    }
  },

  awaitingYesNo: handleSelection
};





async function handleIncomingMessage(message) {
  const { fromNumber, messages, listid, description } = message;

  const currentState = getUserState(fromNumber);

  // console.log("states", currentState);

  if (messages && 
    messages.toLowerCase().startsWith("hello!") && 
    messages.length > "hello!".length && currentState === 'initial') 
    {
      const extrackedDoctor = messages.slice(7);  
      await handleFindDoctorExplicit(fromNumber, extrackedDoctor)
      return;
    }

  try {
    const handler = commandHandlers[currentState] || handleUnknownOption;
    await handler(fromNumber, listid, description, messages);
  } catch (error) {
    console.error(`Error processing message for ${fromNumber}:`, error);
    await sendWhatsAppMessage(fromNumber, "Sorry, an error occurred. Please try again.");
    clearUserState(fromNumber);
  }
}




async function handleUnknownOption(fromNumber) {
  await sendWhatsAppMessage(fromNumber, "Unknown option. Please try again.");
  await new Promise(resolve => setTimeout(resolve, 2000));
  await sendAllServices(fromNumber)
}



module.exports = { handleIncomingMessage, handleUnknownOption };