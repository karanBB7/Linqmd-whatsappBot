const { setUserState} = require('../services/stateManager');

const { sendListMessage, generalList } = require('../middleware/whatsappMiddleware');

async function sendYesOrNo(fromNumber){
    await new Promise(resolve => setTimeout(resolve, 2000));
      const listMessage = {
        title: 'Do you have anything else?',
        body: 'Please select the respective activity.',
        options: ['Yes', 'No']
    };
    await sendListMessage(fromNumber, listMessage);
    setUserState(fromNumber, 'awaitingSelection');
  }


  async function sendAllServices(fromNumber){
    await new Promise(resolve => setTimeout(resolve, 2000));
    const listMessage = {
      title: "Do you want to?",
      body: "Please select the respective activity.",
      options: [
        {
          id: "askquestion",
          title: "Ask doctor questions",
          description: "Get answers about your doctor's medical expertise and specializations"
        },
        {
          id: "manageapp",
          title: "Manage appointment",
          description: "View or modify your scheduled appointments" 
        },
        {
          id: "giveusyourfeedback",
          title: "Give feedback",
          description: "Share your experience with us"
        }
      ]
    };
    
    await generalList(fromNumber, listMessage);
    setUserState(fromNumber, 'awaitingSelection');
  }


module.exports.sendYesOrNo = sendYesOrNo;
module.exports.sendAllServices = sendAllServices;