const { sendWhatsAppMessage } = require('../middleware/whatsappMiddleware');
const { getAnaswer } = require('../services/questionAnswerService');
const { setUserState } = require('../services/stateManager');
const { sendYesOrNo } = require('../handllers/mainHandler.js');
const { decodeToken } = require('../middleware/tokenMiddleware');

const { AiAnswer, AiQuestion } = require('../../models');


const TIMEOUT_DURATION = 600000; 
let timeoutId = null;

async function sendAskAnything(fromNumber) {
    try {
        await sendWhatsAppMessage(fromNumber, 'Ask any question');
        setUserState(fromNumber, 'getQuestion');
    } catch(error) {
        console.error('Error in handlesendQuestion:', error);
    }
}

async function sendQuestion(fromNumber, messages, token) {
    try {
        const decodedToken = decodeToken(token);
        const doctorusername = decodedToken.username;  
        const doc_id = decodedToken.doctor_user_id;  
        console.log("messages", messages);
        await AiQuestion.create({
            phoneNumber: fromNumber,
            question: messages,
            doc_user_id: doc_id
        });


        const answer = await getAnaswer(messages, doctorusername, fromNumber);
        console.log("answer", answer.data.answer);
        await AiAnswer.create({
            phoneNumber: fromNumber,
            answer: answer.data.answer,
            doc_user_id: doc_id
        });

        await sendWhatsAppMessage(fromNumber, answer.data.answer);
        
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(async () => {
            await sendYesOrNo(fromNumber);
            setUserState(fromNumber, 'awaitingSelection');
        }, TIMEOUT_DURATION);
        
        setUserState(fromNumber, 'getQuestion');
    } catch(error) {
        console.error('Error in handlesendQuestion:', error);
        await sendWhatsAppMessage(fromNumber, "An error occurred while processing your request. Please try again later.");
    }
}

module.exports = { sendQuestion, sendAskAnything }