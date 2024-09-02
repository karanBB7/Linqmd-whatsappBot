const { processMessage } = require('../services/messageService');

module.exports = function(app) {
  app.post('/api/appointment/incoming-message', (req, res, next) => {
    const { id } = req.body;
    if (!id) {
      res.send(400, { error: 'Message ID is required' });
      return next();
    }
    
    // Process the message asynchronously
    processMessage(id).catch(error => {
      console.error('Error processing message:', error);
    });

    res.send(202, { message: 'Message queued for processing' });
    next();
  });
};