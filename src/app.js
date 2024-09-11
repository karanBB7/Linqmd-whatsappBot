const restify = require('restify');
const { sequelize } = require('../models');
const appointmentRoutes = require('./routes/router');
const { processAllPendingMessages, startMessageConsumer } = require('./services/messageService');
const rabbitmq = require('./config/rabbitmq');
const { startOutgoingMessageConsumer } = require('./middleware/whatsappMiddleware');

const app = restify.createServer();

app.use(restify.plugins.bodyParser());

appointmentRoutes(app);

sequelize.sync({ alter: true });

app.get('/health', (req, res, next) => {
  res.send(200, { status: 'OK' });
});

async function initializeRabbitMQ() {
  try {
    await rabbitmq.connect();
    await rabbitmq.createQueue('incoming_messages');
    await rabbitmq.createQueue('outgoing_messages');
    startMessageConsumer();
    startOutgoingMessageConsumer();
    console.log('RabbitMQ initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RabbitMQ:', error);
    console.log('Will retry RabbitMQ connection in 30 seconds...');
    setTimeout(initializeRabbitMQ, 30000);
  }
}

app.listen(3002, async () => {
  console.log('Server is running on http://localhost:3002');
  
  setInterval(async () => {
    try {
      await processAllPendingMessages();
    } catch (error) {
      console.error('Error processing pending messages:', error);
    }
  }, 100);

  initializeRabbitMQ();
});

module.exports = app;