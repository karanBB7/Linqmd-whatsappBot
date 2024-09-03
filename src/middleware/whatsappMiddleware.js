const axios = require('axios');
const rabbitmq = require('../config/rabbitmq');

const WHATSAPP_API_URL = 'https://whatsappapi-79t7.onrender.com/send-text-message';
const WHATSAPP_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJPd25lck5hbWUiOiJCaXp0ZWNobm9zeXMtbWlkd2FyZSIsInBob25lTnVtYmVySWQiOiIyNDg4OTg2NDQ5NzI0MDQiLCJ3aGF0c2FwcE1ldGFUb2tlbiI6IkVBQXhWMWc0dDI0UUJPd2ZBOGw1Q3d6Tm1qNUlvaHlWUkdaQWNKemRpTW9xb3hMWDZ1a3h3cVEzSDlGZVRHZUVuVmxaQkRhMXc0dUYxUzczUUk0OVkwTEpPQ1hJU0tTd2dBZkJnZ1N6dzNyUWlWSmtLRWt0Q0lMaTlqdzNRbUhXMmxnWFpBaXlwdXdaQ3FhSmRRaXBsb0M1SEtyYUx0ODZiSnVtSEt3RUFXNGthMGRaQlRPNWl4dWV1R1Ztb0daQ2JLbkZBUEEwVzkwWkNVR2dSZ29oIiwiaWF0IjoxNzA5MjAwMTEwfQ.ZMy9wpBxphJbpEOYI3bBchlywwKCIN23GJiYrDlvXyc';

async function sendWhatsAppMessage(phone, message) {
  try {
    console.log(`Queueing WhatsApp message for ${phone}`);
    await rabbitmq.sendToQueue('outgoing_messages', { phone, message, type: 'text' });
    console.log(`Message queued for sending to ${phone}`);
  } catch (error) {
    console.error('Error queueing WhatsApp message:', error);
    throw error;
  }
}

async function sendListMessage(phone, listMessage) {
  try {
    console.log(`Queueing WhatsApp list message for ${phone}`);
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
    await rabbitmq.sendToQueue('outgoing_messages', { phone, message: formattedListMessage, type: 'list' });
    console.log(`Interactive message queued for sending to ${phone}`);
  } catch (error) {
    console.error('Error queueing WhatsApp list message:', error);
    throw error;
  }
}

async function sendCancellationDatesList(phone, listMessage) {
  try {
    console.log(`Queueing WhatsApp cancellation dates list for ${phone}`);
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
    await rabbitmq.sendToQueue('outgoing_messages', { phone, message: formattedListMessage, type: 'cancellation_list' });
    console.log(`Cancellation dates list queued for sending to ${phone}`);
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

function startOutgoingMessageConsumer() {
  rabbitmq.consume('outgoing_messages', async (messageData) => {
    try {
      await processOutgoingMessage(messageData);
    } catch (error) {
      console.error('Error processing outgoing message:', error);
    }
  });
}

module.exports = { 
  sendWhatsAppMessage, 
  sendListMessage, 
  sendCancellationDatesList, 
  startOutgoingMessageConsumer 
};