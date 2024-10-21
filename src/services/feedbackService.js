const { Feedback } = require('../../models');

const feedbackInProgress = new Map();

function initializeFeedback(fromNumber, username, booking_id, doctor_user_id) {
  const sessionId = Date.now().toString() + Math.random().toString(36).substring(2, 15);
  feedbackInProgress.set(fromNumber, { doctor: username, booking_id, doctor_user_id, sessionId });
}

async function updateFeedbackInProgress(fromNumber, field, value) {
  const currentFeedback = feedbackInProgress.get(fromNumber) || {};
  currentFeedback[field] = value;
  feedbackInProgress.set(fromNumber, currentFeedback);

  await saveFeedback(fromNumber);
}

async function saveFeedback(fromNumber) {
  try {
    const feedbackData = feedbackInProgress.get(fromNumber);
    if (!feedbackData) {
      throw new Error('No feedback data found');
    }

    const { doctor, booking_id, doctor_user_id, sessionId, rating, feedback, reasonForVisit, ...jsonData } = feedbackData;

    const feedbackRecord = await Feedback.create({
      fromNumber,
      booking_id,
      doctor_user_id, 
      doctor,
      rating: rating || null,
      feedback: feedback || null,
      reasonForVisit: reasonForVisit || null,
      jsonData: { ...jsonData, sessionId }
    });

    return feedbackRecord;
  } catch (error) {
    console.error('Error saving feedback:', error);
    throw error;
  }
}

async function getAllFeedbackForBooking(booking_id) {
  try {
    const feedbacks = await Feedback.findAll({
      where: { booking_id },
      order: [['createdAt', 'DESC']]
    });
    return feedbacks;
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    throw error;
  }
}
function getFeedbackInProgress(fromNumber) {
  return feedbackInProgress.get(fromNumber) || {};
}

module.exports = { 
  initializeFeedback, 
  updateFeedbackInProgress, 
  saveFeedback, 
  getFeedbackInProgress,
  getAllFeedbackForBooking
};