const { Feedback } = require('../../models');

const feedbackInProgress = new Map();

function initializeFeedback(fromNumber, username) {
  if (!feedbackInProgress.has(fromNumber)) {
    feedbackInProgress.set(fromNumber, { doctor: username });
  }
}

function updateFeedbackInProgress(fromNumber, field, value) {
  const currentFeedback = feedbackInProgress.get(fromNumber) || {};
  currentFeedback[field] = value;
  feedbackInProgress.set(fromNumber, currentFeedback);
}

async function saveFeedback(fromNumber) {
  try {
    const feedbackData = feedbackInProgress.get(fromNumber);
    if (!feedbackData) {
      throw new Error('No feedback data found');
    }

    const { doctor, booking_id, rating, feedback, reasonForVisit, ...jsonData } = feedbackData;

    const feedbackRecord = await Feedback.create({
      fromNumber,
      booking_id,
      doctor,
      rating,
      feedback,
      reasonForVisit,
      jsonData
    });

    feedbackInProgress.delete(fromNumber);

    return feedbackRecord;
  } catch (error) {
    console.error('Error saving complete feedback:', error);
    throw error;
  }
}

function getFeedbackInProgress(fromNumber) {
  return feedbackInProgress.get(fromNumber) || {};
}

module.exports = { initializeFeedback, updateFeedbackInProgress, saveFeedback, getFeedbackInProgress };