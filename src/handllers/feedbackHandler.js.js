const { decodeToken } = require('../middleware/tokenMiddleware');
const { sendWhatsAppMessage, sendFeedbackRating } = require('../middleware/whatsappMiddleware');
const { setUserState } = require('../services/stateManager');
const { initializeFeedback, updateFeedbackInProgress, saveFeedback } = require('../services/feedbackService');

async function handleFeedback(fromNumber, token) {
  let doctorName = 'your doctor'; 
      const decodedToken = decodeToken(token);
      doctorName = decodedToken.username;
  initializeFeedback(fromNumber, doctorName);
  await sendWhatsAppMessage(fromNumber, `Please provide a detailed feedback on your experience with *${doctorName}* to help other patients like you. It will take less than a min`);
  setUserState(fromNumber, 'captureFeedback');
}



async function captureFeedback(fromNumber, message) {
  updateFeedbackInProgress(fromNumber, 'feedback', message);
  await sendWhatsAppMessage(fromNumber, "Please provide few lines on the reason you visited the doctor");
  setUserState(fromNumber, 'captureReasonForVisit');
}

async function captureReasonForVisit(fromNumber, message) {
  updateFeedbackInProgress(fromNumber, 'reasonForVisit', message);
  await sendWhatsAppMessage(fromNumber, "Please provide feedback on how you are feeling and how the doctor helped you get better");
  setUserState(fromNumber, 'captureOvercome');
}

async function captureOvercome(fromNumber, message) {
  updateFeedbackInProgress(fromNumber, 'overcome', message);
  const ratingOptions = {
    title: 'Rate Experience',
    body: 'Please rate your overall experience',
    options: [
      { id: 'rating1', title: 'Not better', description: 'Am not feeling better at all' },
      { id: 'rating2', title: 'Getting better', description: 'Am getting better' },
      { id: 'rating3', title: 'Feeling good', description: 'Feeling good' },
      { id: 'rating4', title: 'Have improvement', description: 'Have improvement' },
      { id: 'rating5', title: 'Feeling great', description: 'Feeling great' }
    ]
  };
  await sendFeedbackRating(fromNumber, ratingOptions);
  setUserState(fromNumber, 'captureRating');
}

async function captureRating(fromNumber, listid) {
  const ratingMap = {
    'rating1': 1, 'rating2': 2, 'rating3': 3, 'rating4': 4, 'rating5': 5
  };
  const rating = ratingMap[listid] || 0;
  updateFeedbackInProgress(fromNumber, 'rating', rating);

  await saveFeedback(fromNumber);

  await sendWhatsAppMessage(fromNumber, "Thank you for your feedback!");
  setUserState(fromNumber, 'initial');
}

module.exports = { handleFeedback, captureFeedback, captureReasonForVisit, captureOvercome, captureRating };