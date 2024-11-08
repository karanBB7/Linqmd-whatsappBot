const restify = require('restify');
const { sequelize } = require('../models');
const appointmentRoutes = require('./routes/router');
const { processAllPendingMessages, startMessageConsumer } = require('./services/messageService');
const sqs = require('./config/sqs');
const { startOutgoingMessageConsumer } = require('./middleware/whatsappMiddleware');

const { users, dashboard } = require('./routes/dashboardRouter.js');

const app = restify.createServer();

app.use(restify.plugins.bodyParser());

users(app);
dashboard(app);

appointmentRoutes(app);

sequelize.sync({ alter: true });

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
    console.error('Failed to initialize SQS:', error);
    console.log('Will retry SQS connection in 30 seconds...');
    setTimeout(initializeSQS, 30000);
  }
}

app.listen(3002, async () => {
  
  setInterval(async () => {
    try {
      await processAllPendingMessages();
    } catch (error) {
      console.error('Error processing pending messages:', error);
    }
  }, 100);

  initializeSQS();
});

module.exports = app;