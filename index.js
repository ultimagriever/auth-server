const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const app = express();
const routes = require('./routes');

// App Setup
app.use(morgan('combined'));
app.use(bodyParser.json({ type: '*/*' }));

routes(app);

// Server Setup
const port = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(port);
console.log('Server listening on port %d in %s mode', port, app.settings.env);
