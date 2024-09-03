const { Feedback } = require('../../models');

const feedbackInProgress = new Map();

function initializeFeedback(fromNumber, doctorName) {
  feedbackInProgress.set(fromNumber, { doctor: doctorName });
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

    const { doctor, ...jsonData } = feedbackData;

    const feedback = await Feedback.create({
      fromNumber,
      doctor,
      jsonData
    });

    feedbackInProgress.delete(fromNumber);

    return feedback;
  } catch (error) {
    console.error('Error saving complete feedback:', error);
    throw error;
  }
}

module.exports = { initializeFeedback, updateFeedbackInProgress, saveFeedback };