const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

let connection = null;
let channel = null;

async function connect() {
  try {
    connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    process.exit(1);
  }
}

async function createQueue(queueName) {
  if (!channel) await connect();
  await channel.assertQueue(queueName, { durable: true });
}

function sendToQueue(queueName, message) {
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
}

async function consume(queueName, callback) {
  if (!channel) await connect();
  await channel.assertQueue(queueName, { durable: true });
  channel.consume(queueName, (msg) => {
    if (msg !== null) {
      const content = JSON.parse(msg.content.toString());
      callback(content);
      channel.ack(msg);
    }
  });
}

module.exports = { connect, createQueue, sendToQueue, consume };