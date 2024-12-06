const axios = require('axios');
const sqs = require('../config/sqs');

const { insertMessageIntoDashboard, insertListMessageIntoDashboard } = require('../handllers/dashboardHandler.js');

const WHATSAPP_API_URL = 'https://whatsappapi-79t7.onrender.com/send-text-message';
const WHATSAPP_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJPd25lck5hbWUiOiJCaXp0ZWNobm9zeXMtbWlkd2FyZSIsInBob25lTnVtYmVySWQiOiIyNDg4OTg2NDQ5NzI0MDQiLCJ3aGF0c2FwcE1ldGFUb2tlbiI6IkVBQXhWMWc0dDI0UUJPd2ZBOGw1Q3d6Tm1qNUlvaHlWUkdaQWNKemRpTW9xb3hMWDZ1a3h3cVEzSDlGZVRHZUVuVmxaQkRhMXc0dUYxUzczUUk0OVkwTEpPQ1hJU0tTd2dBZkJnZ1N6dzNyUWlWSmtLRWt0Q0lMaTlqdzNRbUhXMmxnWFpBaXlwdXdaQ3FhSmRRaXBsb0M1SEtyYUx0ODZiSnVtSEt3RUFXNGthMGRaQlRPNWl4dWV1R1Ztb0daQ2JLbkZBUEEwVzkwWkNVR2dSZ29oIiwiaWF0IjoxNzA5MjAwMTEwfQ.ZMy9wpBxphJbpEOYI3bBchlywwKCIN23GJiYrDlvXyc';


// const WHATSAPP_API_URL = 'https://midware.onrender.com/send-text-message';
// const WHATSAPP_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJPd25lck5hbWUiOiJBYWR5YS1saW5xbWQiLCJwaG9uZU51bWJlcklkIjoiMzQ5MDI4MjY0OTYxMjM2Iiwid2hhdHNhcHBNZXRhVG9rZW4iOiJFQUFMdlNXakVKUjBCT3hHZEJna09lRFNhUXowdm1RQ2RDbnFUb3VTZmMwSzBPU2VFSnhQV2hxNGc4Tk1aQ2s1SGZuSnR2eXFrSlU4MU1LaUY0RGJOOHVURzlaQk83alFReThRYVZoT2M2SGNLYnhUQnRWWkJ6Um5rOEpPMm1JZTAxNHZFYW5VYktKaU8zMFFrS0hSV3Z4RWo1VnpqWkNJeFJXMjcyQlZlWTExdkpuOVdQbUxSRUtUUDh2MjJKS1pBQyIsImlhdCI6MTcyMTcyNzg1MX0.iCvT0K5QyHk-HvfHHHtcboH0bL3LPyZZLNV_pvcxO2Q';


let outgoingQueueUrl;

async function sendWhatsAppMessage(phone, message) {
  try {
    await sqs.sendMessage(outgoingQueueUrl, { phone, message, type: 'text' });
  } catch (error) {
    console.error('Error queueing WhatsApp message:', error);
    throw error;
  }
  await insertMessageIntoDashboard(phone, message);
  
}

async function sendListMessage(phone, listMessage) {
  try {
    const formattedListMessage = {
      type: "interactive",
      interactive: {
        type: "list",
        header: {
          type: "text",
          text: listMessage.title
        },
        body: {
          text: listMessage.body
        },
        action: {
          button: "Select",
          sections: [
            {
              title: "Options",
              rows: listMessage.options.map((option, index) => ({
                id: option.toLowerCase().replace(/\s+/g, ''),
                title: option
              }))
            }
          ]
        }
      }
    };
    await sqs.sendMessage(outgoingQueueUrl, { phone, message: formattedListMessage, type: 'list' });

    await insertListMessageIntoDashboard(phone,formattedListMessage)

  } catch (error) {
    console.error('Error queueing WhatsApp list message:', error);
    throw error;
  }
}

async function sendFeedbackRating(phone, listMessage) {
  try {
    const formattedListMessage = {
      type: "interactive",
      interactive: {
        type: "list",
        header: {
          type: "text",
          text: listMessage.title
        },
        body: {
          text: listMessage.body
        },
        action: {
          button: "Select",
          sections: [
            {
              title: "Options",
              rows: listMessage.options.map((option) => ({
                id: option.id,
                title: option.title,
                description: option.description
              }))
            }
          ]
        }
      }
    };
    await sqs.sendMessage(outgoingQueueUrl, { phone, message: formattedListMessage, type: 'list' });

    await insertListMessageIntoDashboard(phone,formattedListMessage)

  } catch (error) {
    console.error('Error queueing WhatsApp list message:', error);
    throw error;
  }
}


async function generalList(phone, listMessage) {
  try {
    const formattedListMessage = {
      type: "interactive",
      interactive: {
        type: "list",
        header: {
          type: "text",
          text: listMessage.title
        },
        body: {
          text: listMessage.body
        },
        action: {
          button: "Select",
          sections: [
            {
              title: "Options",
              rows: listMessage.options.map((option) => ({
                id: option.id,
                title: option.title,
                description: option.description
              }))
            }
          ]
        }
      }
    };
    await sqs.sendMessage(outgoingQueueUrl, { phone, message: formattedListMessage, type: 'list' });

    await insertListMessageIntoDashboard(phone,formattedListMessage)

  } catch (error) {
    console.error('Error queueing WhatsApp list message:', error);
    throw error;
  }
}

async function sendCancellationDatesList(phone, listMessage) {
  try {
    // console.log(`Queueing WhatsApp cancellation dates list for ${phone}`);
    const formattedListMessage = {
      type: "interactive",
      interactive: {
        type: "list",
        header: {
          type: "text",
          text: listMessage.title
        },
        body: {
          text: listMessage.body
        },
        action: {
          button: "Select",
          sections: [
            {
              title: "Appointments",
              rows: listMessage.options.map(option => ({
                id: option.id,
                title: option.title,
                description: option.description
              }))
            }
          ]
        }
      }
    };
    await sqs.sendMessage(outgoingQueueUrl, { phone, message: formattedListMessage, type: 'cancellation_list' });

    await insertListMessageIntoDashboard(phone,formattedListMessage)

    // console.log(`Cancellation dates list queued for sending to ${phone}`);
  } catch (error) {
    console.error('Error queueing WhatsApp cancellation dates list:', error);
    throw error;
  }
}

async function processOutgoingMessage(messageData) {
  const { phone, message, type } = messageData;
  const interactiveUrl = 'https://whatsappapi-79t7.onrender.com/interact-messages';

  try {
    if (type === 'text') {
      await axios.post(WHATSAPP_API_URL, {
        messaging_product: "whatsapp",
        to: phone,
        text: { body: message }
      }, {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    } else if (type === 'list' || type === 'cancellation_list') {
      await axios.post(interactiveUrl, {
        messaging_product: "whatsapp",
        to: phone,
        ...message
      }, {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`Message sent successfully to ${phone}`);
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

async function startOutgoingMessageConsumer(queueUrl) {
  outgoingQueueUrl = queueUrl;
  console.log('Starting outgoing message consumer...');
  consumeOutgoingMessages();
}

async function consumeOutgoingMessages() {
  try {
    const message = await sqs.receiveMessage(outgoingQueueUrl);
    if (message) {

      // console.log('Received outgoing message:', message.content);

      await processOutgoingMessage(message.content);
      await sqs.deleteMessage(outgoingQueueUrl, message.receiptHandle);
    }
  } catch (error) {
    console.error('Error consuming outgoing message:', error);
  }
  
  // Continue polling for messages
  setImmediate(consumeOutgoingMessages);
}

module.exports = { 
  sendWhatsAppMessage, 
  sendListMessage, 
  sendFeedbackRating,
  sendCancellationDatesList,
  generalList,
  startOutgoingMessageConsumer 
};