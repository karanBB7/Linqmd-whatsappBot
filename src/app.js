const restify = require('restify');
const { sequelize, Tokens, Receiver } = require('../models'); // Correctly import sequelize and models
const appointmentRoutes = require('./routes/router');
const { processAllPendingMessages } = require('./services/messageService');

const app = restify.createServer();

app.use(restify.plugins.bodyParser());

appointmentRoutes(app);

sequelize.sync({ alter: true });


app.listen(3001, () => {
  console.log('Server is running on http://localhost:3001');
  
  setInterval(async () => {
    try {
      await processAllPendingMessages();
    } catch (error) {
      console.error('Error processing pending messages:', error);
    }
  }, 1000);
});

module.exports = app;
