const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const app = express();
const routes = require('./routes');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config({ silent: true });

mongoose.connect(process.env.MONGODB_URI);

// App Setup
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json({ type: '*/*' }));

routes(app);

// Server Setup
const port = process.env.PORT || 8080;
const server = http.createServer(app);
server.listen(port);
console.log('Server listening on port %d in %s mode', port, app.settings.env);
