const { processMessage } = require('../services/messageService');
const rabbitmq = require('../config/rabbitmq');

module.exports = function(app) {
  app.post('/api/appointment/incoming-message', (req, res, next) => {
    const { id } = req.body;
    if (!id) {
      res.send(400, { error: 'Message ID is required' });
      return next();
    }
    
    rabbitmq.sendToQueue('incoming_messages', { id });

    res.send(202, { message: 'Message queued for processing' });
    next();
  });
};