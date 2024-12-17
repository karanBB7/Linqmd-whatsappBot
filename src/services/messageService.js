require('dotenv').config(); 
const WebSocket = require('ws');
const { handleIncomingMessage } = require('../controllers/botController');
const sqs = require('../config/sqs');

let incomingQueueUrl;
let ws;
let reconnectAttempts = 0;
let isConnecting = false;
const MAX_RECONNECT_ATTEMPTS = 10;
const INITIAL_RECONNECT_DELAY = 5000;

function getReconnectDelay() {
    const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), 30000);
    reconnectAttempts++;
    return delay;
}

function resetReconnectAttempts() {
    reconnectAttempts = 0;
    isConnecting = false;
}

function setupWebSocket() {
    if (isConnecting) return;
    isConnecting = true;

    const WS_SERVER_URL = process.env.WS_SERVER_URL;
    
    if (ws && ws.readyState !== WebSocket.CLOSED) {
        try {
            ws.close();
        } catch (err) {
            console.log('Error closing existing connection:', err);
        }
    }

    try {
        ws = new WebSocket(WS_SERVER_URL, {
            headers: {
                'auth-token': process.env.WS_AUTH_TOKEN
            }
        });

        ws.on('open', () => {
            console.log('WebSocket connected');
            resetReconnectAttempts();
        });

        ws.on('close', () => {
            console.log('WebSocket connection closed');
            isConnecting = false;
            
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                const delay = getReconnectDelay();
                console.log(`Attempting to reconnect in ${delay/1000} seconds... (Attempt ${reconnectAttempts} of ${MAX_RECONNECT_ATTEMPTS})`);
                setTimeout(setupWebSocket, delay);
            } else {
                console.error('Max reconnection attempts reached. Please check the server.');
                process.exit(1);
            }
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            isConnecting = false;
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

    } catch (error) {
        console.error('Error setting up WebSocket:', error);
        isConnecting = false;
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            const delay = getReconnectDelay();
            setTimeout(setupWebSocket, delay);
        }
    }
}

async function processMessage(messageContent) {
    try {
        const message = {
            ...messageContent,
            status: 1
        };

        await handleIncomingMessage(message);
        
        // console.log(`Successfully processed message for ${message.fromNumber}`);
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
        if (message && message.content) {
            const success = await processMessage(message.content);
            if (success) {
                await sqs.deleteMessage(incomingQueueUrl, message.receiptHandle);
            }
        }
    } catch (error) {
        console.error('SQS consume error:', error);
    }
    
    setImmediate(consumeMessages);
}

module.exports = { startMessageConsumer };