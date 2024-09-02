const { Receiver } = require('../../models');
const { handleIncomingMessage } = require('../controllers/appointmentController');

async function processMessage(messageId) {
  try {
    const message = await Receiver.findOne({
      where: { id: messageId, status: 0 }
    });

    if (message) {
      console.log(`Processing message: ${message.id}`);
      await message.update({ status: 1 }); 
      await handleIncomingMessage(message);
      await message.update({ status: 3 }); // Mark as processed
      console.log(`Message ${message.id} processed successfully`);
    } else {
      console.log(`No message found with id ${messageId} and status 0`);
    }
  } catch (error) {
    console.error('Error processing message:', error);
    await Receiver.update({ status: 4 }, { where: { id: messageId } });
  }
}

async function processAllPendingMessages() {
  try {
    const pendingMessages = await Receiver.findAll({
      where: { status: 0 },
      order: [['createdAt', 'ASC']]
    });


    for (const message of pendingMessages) {
      await processMessage(message.id);
    }
  } catch (error) {
    console.error('Error processing pending messages:', error);
  }
}

module.exports = { processMessage, processAllPendingMessages };