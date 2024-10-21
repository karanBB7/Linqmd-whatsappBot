const { Receiver } = require('../../models');
const { handleIncomingMessage } = require('../controllers/appointmentController');
const sqs = require('../config/sqs');

let incomingQueueUrl;

async function processMessage(messageId) {
  try {
    const message = await Receiver.findOne({
      where: { id: messageId, status: 0 }
    });

    if (message) {
      await message.update({ status: 1 });

      await sqs.sendMessage(incomingQueueUrl, {
        id: message.id,
        fromNumber: message.fromNumber,
        messages: message.messages,
        listid: message.listid
      });

      console.log(`Message with id ${message.id} sent to queue`);

      await handleIncomingMessage(message);
      await message.update({ status: 3 });
      await message.destroy();
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

async function startMessageConsumer(queueUrl) {
  incomingQueueUrl = queueUrl;
  console.log('Starting message consumer...');
  consumeMessages();
}

async function consumeMessages() {
  try {
    const message = await sqs.receiveMessage(incomingQueueUrl);
    if (message) {
      console.log('Received message from queue:', message.content);
      await processMessage(message.content.id);
      await sqs.deleteMessage(incomingQueueUrl, message.receiptHandle);
      // console.log(`Message ${message.content.id} deleted from queue`);
    }
  } catch (error) {
    console.error('Error consuming message:', error);
  }
  
  setImmediate(consumeMessages);
}


module.exports = { processMessage, processAllPendingMessages, startMessageConsumer };