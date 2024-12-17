const path = require('path');
const restify = require('restify');
const { getUser } = require('./dashboardService');

function dashboard(app) {
  app.get('/dashboard', (req, res, next) => {
      res.writeHead(200, {
          'Content-Type': 'text/html'
      });
      const indexPath = path.join(__dirname, './web/index.html');
      require('fs').createReadStream(indexPath).pipe(res);
  });

  app.get('/assets/*', restify.plugins.serveStatic({
      directory: path.join(__dirname, './web')
  }));
}


function users(app) {
    app.get('/users', (req, res, next) => {
      getUser()
        .then((userData) => {
          res.send(200, {
            success: true,
            data: userData
          });
          next();
        })
        .catch((error) => {
          res.send(500, {
            success: false,
            error: error.message || 'Failed to fetch user data'
          });
          next(error);
        });
    });
  }



module.exports = {
    users,
    dashboard
  };