const restify = require('restify');
const initializeSentry = require('./sentryConfig');
const { sequelize } = require('../models');
const { startMessageConsumer } = require('./services/messageService.js');
const sqs = require('./config/sqs');
const { startOutgoingMessageConsumer } = require('./middleware/whatsappMiddleware');

require('dotenv').config();

const sentry = initializeSentry();

const app = restify.createServer();

app.use((req, res, next) => {
  const transaction = sentry.createTransaction(`${req.method} ${req.url}`, 'http.request');
  
  res.once('finish', () => {
    transaction.setHttpStatus(res.statusCode);
    transaction.finish();
  });

  next();
});

app.use(restify.plugins.bodyParser());

sequelize.sync({ alter: true });

let incomingQueueUrl, outgoingQueueUrl;

async function initializeSQS() {
  const transaction = sentry.createTransaction('initialize_sqs', 'sqs');
  try {
    incomingQueueUrl = await sqs.createQueue('incoming_messages_dev');
    outgoingQueueUrl = await sqs.createQueue('outgoing_messages_dev');
    await startMessageConsumer(incomingQueueUrl);
    await startOutgoingMessageConsumer(outgoingQueueUrl);
    console.log('SQS initialized successfully');
  } catch (error) {
    console.error('Failed to initialize SQS:', error);
    setTimeout(initializeSQS, 30000);
  } finally {
    transaction.finish();
  }
}

app.listen(3002, async () => {
  const transaction = sentry.createTransaction('server_start', 'server');
  try {
    await initializeSQS();
  } finally {
    transaction.finish();
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});


process.removeAllListeners('warning');
require('events').EventEmitter.defaultMaxListeners = 15;

module.exports = app;