const restify = require('restify');
const Sentry = require('@sentry/node');
const { sequelize } = require('../models');
const { startMessageConsumer } = require('./services/messageService.js');
const sqs = require('./config/sqs');
const { startOutgoingMessageConsumer } = require('./middleware/whatsappMiddleware');
const { users, dashboard } = require('./routes/dashboardRouter.js');
const { getCancled, getFeedbackNumber } = require('./routes/dashboardQuery.js');
require('dotenv').config();

Sentry.init({
  dsn: process.env.DSN,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.RELEASE_VERSION || '1.0.0',
  tracesSampleRate: 1.0,
  autoSessionTracking: true
});

const app = restify.createServer();

app.use((req, res, next) => {
  const transaction = Sentry.startTransaction({
    op: 'request',
    name: `${req.method} ${req.url}`
  });
  res.once('finish', () => transaction.finish());
  next();
});

app.use(restify.plugins.bodyParser());
users(app);
dashboard(app);
getCancled(app);
getFeedbackNumber(app);
sequelize.sync({ alter: true });

app.use((error, req, res, next) => {
  Sentry.captureException(error);
  next(error);
});

app.get('/health', (req, res, next) => {
  res.send(200, { status: 'OK' });
});

let incomingQueueUrl, outgoingQueueUrl;

async function initializeSQS() {
  try {
    incomingQueueUrl = await sqs.createQueue('incoming_messages_dev');
    outgoingQueueUrl = await sqs.createQueue('outgoing_messages_dev');
    await startMessageConsumer(incomingQueueUrl);
    await startOutgoingMessageConsumer(outgoingQueueUrl);
    console.log('SQS initialized successfully');
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to initialize SQS:', error);
    setTimeout(initializeSQS, 30000);
  }
}

app.listen(3002, async () => {
  initializeSQS();
});

process.on('uncaughtException', (err) => {
  Sentry.captureException(err);
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  Sentry.captureException(err);
  console.error('Unhandled Rejection:', err);
});

module.exports = app;