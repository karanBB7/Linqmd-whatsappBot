const axios = require('axios');

const WHATSAPP_API_URL = 'https://whatsappapi-79t7.onrender.com/send-text-message';
const WHATSAPP_API_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJPd25lck5hbWUiOiJCaXp0ZWNobm9zeXMtbWlkd2FyZSIsInBob25lTnVtYmVySWQiOiIyNDg4OTg2NDQ5NzI0MDQiLCJ3aGF0c2FwcE1ldGFUb2tlbiI6IkVBQXhWMWc0dDI0UUJPd2ZBOGw1Q3d6Tm1qNUlvaHlWUkdaQWNKemRpTW9xb3hMWDZ1a3h3cVEzSDlGZVRHZUVuVmxaQkRhMXc0dUYxUzczUUk0OVkwTEpPQ1hJU0tTd2dBZkJnZ1N6dzNyUWlWSmtLRWt0Q0lMaTlqdzNRbUhXMmxnWFpBaXlwdXdaQ3FhSmRRaXBsb0M1SEtyYUx0ODZiSnVtSEt3RUFXNGthMGRaQlRPNWl4dWV1R1Ztb0daQ2JLbkZBUEEwVzkwWkNVR2dSZ29oIiwiaWF0IjoxNzA5MjAwMTEwfQ.ZMy9wpBxphJbpEOYI3bBchlywwKCIN23GJiYrDlvXyc';

async function sendWhatsAppMessage(phone, message) {
  try {
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
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
}

async function sendListMessage(phone, listMessage) {
  try {
    const interactiveUrl = 'https://whatsappapi-79t7.onrender.com/interact-messages';
    await axios.post(interactiveUrl, {
      messaging_product: "whatsapp",
      to: phone,
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
    }, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error sending WhatsApp list message:', error);
    throw error;
  }
}


async function sendCancellationDatesList(phone, listMessage) {
  try {
    const interactiveUrl = 'https://whatsappapi-79t7.onrender.com/interact-messages';
    await axios.post(interactiveUrl, {
      messaging_product: "whatsapp",
      to: phone,
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
    }, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error sending WhatsApp cancellation dates list:', error);
    throw error;
  }
}


module.exports = { sendWhatsAppMessage, sendListMessage, sendCancellationDatesList };