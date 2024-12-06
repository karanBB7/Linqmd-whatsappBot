require('dotenv').config(); 
const WebSocket = require('ws');
const { handleIncomingMessage } = require('../controllers/appointmentController');
const sqs = require('../config/sqs');

let incomingQueueUrl;
let ws;
function setupWebSocket() {
  const WS_SERVER_URL = process.env.WS_SERVER_URL;
  
  ws = new WebSocket(WS_SERVER_URL, {
    headers: {
      'auth-token': process.env.WS_AUTH_TOKEN
    }
  });

  ws.on('open', () => {
    console.log('WebSocket connected');
  });

  ws.on('close', () => {
    setTimeout(setupWebSocket, 5000);
  });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      if (message.type === 'new_message' && message.data) {
        await sqs.sendMessage(incomingQueueUrl, {
          id: message.data.id,
          fromNumber: message.data.fromNumber,
          messages: message.data.messages,
          buttonText: message.data.buttonText,
          listid: message.data.listid,
          title: message.data.title,
          description: message.data.description,
          status: 0 
        });

        console.log('Received WebSocket data:', message);

      }
    } catch (error) {
      console.error('Error sending to SQS:', error);
    }
  });



}

async function processMessage(messageContent) {
  try {
    const message = {
      ...messageContent,
      status: 1
    };

    await handleIncomingMessage(message);
    
    console.log(`Successfully processed message for ${message.fromNumber}`);
    return true;
  } catch (error) {
    console.error('Process message error:', error);
    return false;
  }
}

async function startMessageConsumer(queueUrl) {
  incomingQueueUrl = queueUrl;
  setupWebSocket();
  consumeMessages();
}

async function consumeMessages() {
  try {
    const message = await sqs.receiveMessage(incomingQueueUrl);
    if (message) {
      if (message.content) {
        const success = await processMessage(message.content);
        if (success) {
          await sqs.deleteMessage(incomingQueueUrl, message.receiptHandle);
        }
      }
    }
  } catch (error) {
    console.error('SQS consume error:', error);
  }
  
  setImmediate(consumeMessages);
}

module.exports = { startMessageConsumer };