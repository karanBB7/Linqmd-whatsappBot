const { decodeToken } = require('../middleware/tokenMiddleware');
const { sendWhatsAppMessage, sendFeedbackRating } = require('../middleware/whatsappMiddleware');
const { setUserState, clearUserState } = require('../services/stateManager');
const { initializeFeedback, updateFeedbackInProgress, saveFeedback, getFeedbackInProgress } = require('../services/feedbackService');

async function handleFeedback(fromNumber, token) {
  const decodedToken = decodeToken(token);
  const doctorName = decodedToken.docfullname;
  const username = decodedToken.username;
  const booking_id = decodedToken.booking_id;

  
  initializeFeedback(fromNumber, username);
  updateFeedbackInProgress(fromNumber, 'doctorName', doctorName);
  updateFeedbackInProgress(fromNumber, 'booking_id', booking_id);

  await sendWhatsAppMessage(fromNumber, `Please provide a detailed feedback on your experience with *${doctorName}* to help other patients like you. It will take less than a min`);
  setUserState(fromNumber, 'captureFeedback');
}

async function captureFeedback(fromNumber, message) {
  updateFeedbackInProgress(fromNumber, 'feedback', message);
  await sendWhatsAppMessage(fromNumber, "Please provide few lines on the reason you visited the doctor.");
  setUserState(fromNumber, 'captureReasonForVisit');
}

async function captureReasonForVisit(fromNumber, message) {
  updateFeedbackInProgress(fromNumber, 'reasonForVisit', message);
  await sendWhatsAppMessage(fromNumber, "Please provide feedback on how you are feeling now and how the doctor helped you get better.");
  setUserState(fromNumber, 'captureOvercome');
}

async function captureOvercome(fromNumber, message) {
  updateFeedbackInProgress(fromNumber, 'overcome', message);

  const feedbackData = getFeedbackInProgress(fromNumber);
  const doctorName = feedbackData.doctorName || 'your doctor';

  await sendWhatsAppMessage(fromNumber, `Based on your experience, how likely are you to recommend *${doctorName}* to others with conditions similar to yours`);

  const ratingOptions = {
    title: 'Rate Experience',
    body: 'Please rate your overall experience',
    options: [
      { id: 'rating3', title: 'Definitely recommend', description: 'Definitely recommend' },
      { id: 'rating2', title: 'Maybe', description: 'Maybe' },
      { id: 'rating1', title: 'Never recommend', description: 'Never recommend' }
    ]
  };
  await new Promise(resolve => setTimeout(resolve, 2000));
  await sendFeedbackRating(fromNumber, ratingOptions);
  setUserState(fromNumber, 'captureRating');
}

async function captureRating(fromNumber, listid) {
  const ratingMap = {
    'rating1': 1, 'rating2': 2, 'rating3': 3
  };
  const rating = ratingMap[listid] || 0;
  updateFeedbackInProgress(fromNumber, 'rating', rating);

  await saveFeedback(fromNumber);

  await sendWhatsAppMessage(fromNumber, "Thank you for your feedback!");
  clearUserState(fromNumber);
}

module.exports = { handleFeedback, captureFeedback, captureReasonForVisit, captureOvercome, captureRating };