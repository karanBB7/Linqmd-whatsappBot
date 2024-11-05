const { getUserToken} = require('../middleware/tokenMiddleware');
const { sendWhatsAppMessage} = require('../middleware/whatsappMiddleware');
const { setUserState, getUserState, clearUserState } = require('../services/stateManager');


const { handleInitialMessage, sendListAgain, sendYesOrNo } = require('../handllers/mainHandler.js');
const { handleCancelAppointment, handleDropStatus } = require('../handllers/cancelHandler');
const { handleViewAppointment } = require('../handllers/viewHandlers');
const {  captureFeedback, captureReasonForVisit, captureOvercome, captureRating } = require('../handllers/feedbackHandler.js');
const { sendQuestion, sendAskAnything } = require('../handllers/questionAnswerHandler.js');



const commandHandlers = {
  initial: (fromNumber, listid) => 
    listid === null ? handleInitialMessage(fromNumber) : handleUnknownOption(fromNumber),
  
  questionAndAnswer: sendAskAnything,


  getQuestion: async (fromNumber, listid, messages) => {
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
  giveusyourfeedback: (fromNumber) => {
    const token = getUserToken(fromNumber);
    return captureOvercome(fromNumber, token);
  },

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

  captureRating: async (fromNumber, listid) => {
    if (!listid) return handleUnknownOption(fromNumber);
    await captureRating(fromNumber, listid);
  },

  captureFeedback: async (fromNumber, listid, messages) => {
    if (listid === null) {
      await captureFeedback(fromNumber, messages);
    } else {
      return handleUnknownOption(fromNumber);
    }
  },

  captureReasonForVisit: async (fromNumber, listid, messages) => {
    if (listid === null) {
      await captureReasonForVisit(fromNumber, messages);
      return handleOther(fromNumber);
    } else {
      return handleUnknownOption(fromNumber);
    }
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
      await captureOvercome(fromNumber, token);
    }else{
      await handleUnknownOption(fromNumber);
    }
  } else if(listid === 'yes'){
    await sendListAgain(fromNumber);
  } else if(listid === 'no'){
    await sendWhatsAppMessage(fromNumber, "Thank you for using our service. Have a great day!");
    clearUserState(fromNumber);
  } 
  

  else if (listid === 'askquestion'){
    setUserState(fromNumber, 'questionAndAnswer');
    await sendAskAnything(fromNumber);
  } 
  
  
  
  else {
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