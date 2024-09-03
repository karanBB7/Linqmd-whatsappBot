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

(async function() {
  try {
    await rabbitmq.connect();
    await rabbitmq.createQueue('incoming_messages');
    await rabbitmq.createQueue('outgoing_messages');

    startMessageConsumer();
    startOutgoingMessageConsumer();

    app.listen(3001, () => {
      console.log('Server is running on http://localhost:3001');
      
      setInterval(async () => {
        try {
          await processAllPendingMessages();
        } catch (error) {
          console.error('Error processing pending messages:', error);
        }
      }, 100);
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
})();

module.exports = app;