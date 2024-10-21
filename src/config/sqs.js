require('dotenv').config(); 
const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.region,
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey
});

const sqs = new AWS.SQS();

async function createQueue(queueName) {
  const params = {
    QueueName: queueName,
    Attributes: {
      'DelaySeconds': '0',
      'MessageRetentionPeriod': '86400'
    }
  };

  try {
    const data = await sqs.createQueue(params).promise();
    console.log(`Queue ${queueName} created or confirmed, URL: ${data.QueueUrl}`);
    return data.QueueUrl;
  } catch (error) {
    console.error(`Error creating queue ${queueName}:`, error);
    throw error;
  }
}

async function sendMessage(queueUrl, message) {
  const params = {
    MessageBody: JSON.stringify(message),
    QueueUrl: queueUrl
  };

  try {
    await sqs.sendMessage(params).promise();
    console.log(`Message sent to queue ${queueUrl}`);
  } catch (error) {
    console.error(`Error sending message to queue ${queueUrl}:`, error);
    throw error;
  }
}

async function receiveMessage(queueUrl) {
  const params = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 1,
    VisibilityTimeout: 30,
    WaitTimeSeconds: 20
  };

  try {
    const data = await sqs.receiveMessage(params).promise();
    if (data.Messages && data.Messages.length > 0) {
      const message = data.Messages[0];
      const content = JSON.parse(message.Body);
      return { content, receiptHandle: message.ReceiptHandle };
    }
    return null;
  } catch (error) {
    console.error(`Error receiving message from queue ${queueUrl}:`, error);
    throw error;
  }
}

async function deleteMessage(queueUrl, receiptHandle) {
  const params = {
    QueueUrl: queueUrl,
    ReceiptHandle: receiptHandle
  };

  try {
    await sqs.deleteMessage(params).promise();
    // console.log(`Message deleted from queue ${queueUrl}`);
  } catch (error) {
    console.error(`Error deleting message from queue ${queueUrl}:`, error);
    throw error;
  }
}

module.exports = {
  createQueue,
  sendMessage,
  receiveMessage,
  deleteMessage
};