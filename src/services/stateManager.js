// services/stateManager.js

const userStates = new Map();

function setUserState(phoneNumber, state) {
  userStates.set(phoneNumber, state);
}

function getUserState(phoneNumber) {
  return userStates.get(phoneNumber) || 'initial';
}

function clearUserState(phoneNumber) {
  userStates.delete(phoneNumber);
}

module.exports = { setUserState, getUserState, clearUserState };