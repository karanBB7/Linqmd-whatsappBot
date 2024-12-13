const { getUserToken} = require('../middleware/tokenMiddleware');
const { sendWhatsAppMessage} = require('../middleware/whatsappMiddleware');
const { setUserState, clearUserState } = require('../services/stateManager');
const { sendYesOrNo, sendAllServices } = require('../utils/messageUtils');
const { handleUnknownOption } = require('../controllers/botController');

const { manageAppointment } = require('../handllers/mainHandler')
const { handleCancelAppointment } = require('../handllers/cancelHandler.js');

const { handleViewAppointment } = require('../handllers/viewHandlers.js');

const {  captureOvercome } = require('../handllers/feedbackHandler.js');

const { sendAskAnything } = require('../handllers/questionAnswerHandler.js');
;


async function handleSelection(fromNumber, listid, description) {
    console.log(`Handling selection for ${fromNumber}. Selected option: ${listid}`);
    if (listid === 'viewappointment')
      {
        setUserState(fromNumber, 'viewingAppointment');
        const token = getUserToken(fromNumber);
        await handleViewAppointment(fromNumber, token);
        await sendYesOrNo(fromNumber);
      } 
  
      else if (listid === 'cancelappointment') 
      {
        setUserState(fromNumber, 'cancellingAppointment');
        const token = getUserToken(fromNumber);
        await handleCancelAppointment(fromNumber, token);
      }
  
      else if (listid === 'giveusyourfeedback') 
      {
        setUserState(fromNumber, 'giveusyourfeedback');
        const token = getUserToken(fromNumber);
        if(token){
          await captureOvercome(fromNumber, token);
        }else{
          await handleUnknownOption(fromNumber);
        }
      } 
  
      else if(listid === 'yes')
      {
        await sendAllServices(fromNumber);
      } 
  
  
      else if(listid === 'no')
      {
        await sendWhatsAppMessage(fromNumber, "Thank you for using our service. Have a great day!");
        clearUserState(fromNumber);
      } 
    
      else if (listid === 'askquestion')
        {
  
          console.log("at ask question");
          setUserState(fromNumber, 'questionAndAnswer');
          await sendAskAnything(fromNumber);
        } 
  
      else if(description === 'Select Doctor')
      {
        // console.log("success");
        
      }
  
      else if (listid === 'manageapp')
        {
          const token = getUserToken(fromNumber);
          manageAppointment(fromNumber, token);
        } 
    
    
    
    else {
      await handleUnknownOption(fromNumber);
    }
  }

module.exports = {handleSelection}