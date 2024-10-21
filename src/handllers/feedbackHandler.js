const { decodeToken } = require('../middleware/tokenMiddleware');
const { sendWhatsAppMessage, sendFeedbackRating } = require('../middleware/whatsappMiddleware');
const { setUserState, clearUserState, getUserState } = require('../services/stateManager');
const { initializeFeedback, updateFeedbackInProgress, getAllFeedbackForBooking } = require('../services/feedbackService');

const TIMEOUT_DURATION = 3600000; 

async function captureOvercome(fromNumber, token) {
  const decodedToken = decodeToken(token);
  const doctorName = decodedToken.docfullname;
  const username = decodedToken.username;
  const booking_id = decodedToken.booking_id;
  const doctor_user_id = decodedToken.doctor_user_id;

  initializeFeedback(fromNumber, username, booking_id, doctor_user_id);
  await updateFeedbackInProgress(fromNumber, 'doctorName', doctorName);

  const ratingOptions = {
    title: 'Your Experience',
    body: `Based on your experience, how likely are you to recommend ${doctorName} to others with conditions similar to yours:`,
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
  await updateFeedbackInProgress(fromNumber, 'rating', rating);

  await sendWhatsAppMessage(fromNumber, "Please provide few lines on the reason you visited the doctor.");
  setUserState(fromNumber, 'captureFeedback');
  
  setTimeout(async () => {
    if (getUserState(fromNumber) === 'captureFeedback') {
      await sendWhatsAppMessage(fromNumber, "You didn't provide feedback within the time limit. The feedback process has been cancelled.");
      clearUserState(fromNumber);
    }
  }, TIMEOUT_DURATION);
}

async function captureFeedback(fromNumber, message) {
  await updateFeedbackInProgress(fromNumber, 'feedback', message);
  await sendWhatsAppMessage(fromNumber, "Please provide feedback on how you are feeling now and how the doctor helped you get better.");
  setUserState(fromNumber, 'captureReasonForVisit');
  
  setTimeout(async () => {
    if (getUserState(fromNumber) === 'captureReasonForVisit') {
      await sendWhatsAppMessage(fromNumber, "You didn't provide a reason for visit within the time limit. The feedback process has been cancelled.");
      clearUserState(fromNumber);
    }
  }, TIMEOUT_DURATION);
}

async function captureReasonForVisit(fromNumber, message) {
  await updateFeedbackInProgress(fromNumber, 'reasonForVisit', message);

  await sendWhatsAppMessage(fromNumber, "Thank you for your feedback! Your input is valuable to us.");
  clearUserState(fromNumber);
}

module.exports = { captureOvercome, captureRating, captureFeedback, captureReasonForVisit };