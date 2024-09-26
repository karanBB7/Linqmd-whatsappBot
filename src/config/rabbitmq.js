const amqp = require('amqplib');

let connection = null;
let channel = null;

async function connect() {
  const maxRetries = 10;  
  const retryInterval = 10000;  
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';  // const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqps://linqmdbot:Linqmd*12345@b-68cea6cd-69df-4c7c-a069-2bcf02c9d349.mq.ap-south-1.amazonaws.com:5671';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to connect to RabbitMQ (attempt ${attempt}/${maxRetries})...`);

      connection = await amqp.connect(rabbitmqUrl);
      channel = await connection.createChannel();

      connection.on('error', (err) => {
        console.error('RabbitMQ connection error', err);
      });

      connection.on('close', () => {
        console.log('RabbitMQ connection closed. Attempting to reconnect...');
        setTimeout(connect, retryInterval);
      });

      console.log('Connected to RabbitMQ');
      return;
    } catch (error) {
      console.error(`Failed to connect to RabbitMQ (attempt ${attempt}/${maxRetries}):`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, retryInterval));
    }
  }
}

async function createQueue(queueName) {
  try {
    await channel.assertQueue(queueName, { durable: true });
    console.log(`Queue ${queueName} created or confirmed`);
  } catch (error) {
    console.error(`Error creating queue ${queueName}:`, error);
    throw error;
  }
}

async function sendToQueue(queueName, message) {
  try {
    await channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
    console.log(`Message sent to queue ${queueName}`);
  } catch (error) {
    console.error(`Error sending message to queue ${queueName}:`, error);
    throw error;
  }
}

async function consume(queueName, callback) {
  try {
    await channel.consume(queueName, async (msg) => {
      if (msg !== null) {
        const content = JSON.parse(msg.content.toString());
        await callback(content);
        channel.ack(msg);
      }
    });
    console.log(`Consumer started for queue ${queueName}`);
  } catch (error) {
    console.error(`Error starting consumer for queue ${queueName}:`, error);
    throw error;
  }
}

// Helper function to ensure connection before operations
async function ensureConnection() {
  if (!connection || !channel) {
    await connect();
  }
}

module.exports = {
  connect,
  createQueue: async (queueName) => {
    await ensureConnection();
    return createQueue(queueName);
  },
  sendToQueue: async (queueName, message) => {
    await ensureConnection();
    return sendToQueue(queueName, message);
  },
  consume: async (queueName, callback) => {
    await ensureConnection();
    return consume(queueName, callback);
  }
};