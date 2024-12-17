const restify = require('restify');
const { users, dashboard } = require('./dashboard/dashboardRouter.js');
const { getCancled, getFeedbackNumber } = require('./dashboard/dashboardQuery.js');
const app = restify.createServer();

app.use(restify.plugins.bodyParser());
app.use(restify.plugins.queryParser());
app.use(restify.plugins.acceptParser(app.acceptable));

users(app);
dashboard(app);

getCancled(app);
getFeedbackNumber(app);

process.removeAllListeners('warning');
require('events').EventEmitter.defaultMaxListeners = 15;

const PORT =  3005;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});