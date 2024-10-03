const { decodeToken } = require('../middleware/tokenMiddleware');
const { sendWhatsAppMessage, sendFeedbackRating } = require('../middleware/whatsappMiddleware');
const { setUserState, clearUserState, getUserState } = require('../services/stateManager');
const { initializeFeedback, updateFeedbackInProgress, saveFeedback, getFeedbackInProgress } = require('../services/feedbackService');

const TIMEOUT_DURATION = 3600; 

async function captureOvercome(fromNumber, token) {
  const decodedToken = decodeToken(token);
  const doctorName = decodedToken.docfullname;
  const username = decodedToken.username;
  const booking_id = decodedToken.booking_id;

  initializeFeedback(fromNumber, username);
  updateFeedbackInProgress(fromNumber, 'doctorName', doctorName);
  updateFeedbackInProgress(fromNumber, 'booking_id', booking_id);

  const ratingOptions = {
    title: 'Rate Experience',
    body: 'Please rate your overall experience',
    options: [
      { id: 'rating3', title: 'Definitely recommend', description: 'Definitely recommend' },
      { id: 'rating2', title: 'Maybe', description: 'Maybe' },
      { id: 'rating1', title: 'Never recommend', description: 'Never recommend' }
    ]
  };
  await sendFeedbackRating(fromNumber, ratingOptions);
  setUserState(fromNumber, 'captureRating');
  
  setTimeout(async () => {
    if (getUserState(fromNumber) === 'captureRating') {
      await sendWhatsAppMessage(fromNumber, "You didn't provide a rating within the time limit. The feedback process has been cancelled.");
      clearUserState(fromNumber);
    }
  }, TIMEOUT_DURATION);
}

async function captureRating(fromNumber, listid) {
  const ratingMap = {
    'rating1': 1, 'rating2': 2, 'rating3': 3
  };
  const rating = ratingMap[listid] || 0;
  updateFeedbackInProgress(fromNumber, 'rating', rating);

  await sendWhatsAppMessage(fromNumber, "Please provide few lines on the reason you visited the doctor.");
  setUserState(fromNumber, 'captureFeedback');
  
  // Set timeout for feedback capture
  setTimeout(async () => {
    if (getUserState(fromNumber) === 'captureFeedback') {
      await sendWhatsAppMessage(fromNumber, "You didn't provide feedback within the time limit. The feedback process has been cancelled.");
      clearUserState(fromNumber);
    }
  }, TIMEOUT_DURATION);
}

async function captureFeedback(fromNumber, message) {
  updateFeedbackInProgress(fromNumber, 'feedback', message);
  await sendWhatsAppMessage(fromNumber, "Please provide feedback on how you are feeling now and how the doctor helped you get better.");
  setUserState(fromNumber, 'captureReasonForVisit');
  
  // Set timeout for reason for visit capture
  setTimeout(async () => {
    if (getUserState(fromNumber) === 'captureReasonForVisit') {
      await sendWhatsAppMessage(fromNumber, "You didn't provide a reason for visit within the time limit. The feedback process has been cancelled.");
      clearUserState(fromNumber);
    }
  }, TIMEOUT_DURATION);
}

async function captureReasonForVisit(fromNumber, message) {
  updateFeedbackInProgress(fromNumber, 'reasonForVisit', message);

  await saveFeedback(fromNumber);

  await sendWhatsAppMessage(fromNumber, "Thank you for your feedback!");
  clearUserState(fromNumber);
}

module.exports = { captureOvercome, captureRating, captureFeedback, captureReasonForVisit };