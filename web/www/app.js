/*
 *
 * (c) Copyright Ascensio System Limited 2010-2021
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/


const express = require('express'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    { v4: uuidv4 } = require('uuid'),
    session = require('express-session'),
    MemoryStore = require('memorystore')(session),
    fs = require('fs'),
    log = require('./app/log.js'),
    config = require('./config'),
    fileManager = require('./app/fileManager.js'),
    pug = require('pug'),
    errorCompiled = pug.compileFile(path.join(__dirname, 'views','Shared','error.pug')),
    Model = require('./app/model/base.js');

const app = express();
app.set('views', path.join(__dirname, 'views'))
    .set('view engine', 'pug')
    .set('etag', false);

app.use(favicon(__dirname + '/public/stylesheets/images/favicon.ico'))
    .use(logger('dev'))
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: false }))
    .use(cookieParser())
    .use(session({
        secret: uuidv4(),
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 60000 },
        store: new MemoryStore({ checkPeriod: 600000 })
    }))
    .use(config.makePath(), require('less-middleware')(path.join(__dirname, 'public')));

app.use(config.makePath(), express.static(path.join(__dirname, 'public')));

app.use(config.makePath(config.rebranding), function (req, res, next) {
    fileManager.getDataDirPath(config.rebranding)
        .then((result) => {
            express.static(result)(req, res, next);
        });
});

app.use(require('./app/middleware/auth.js'))
    .use(require('./app/middleware/payment.js'))
    .use(require('./app/middleware/resource.js'));

config.controllers.forEach((item) => {
    if (item === "base.js") return;
    app.use(config.makePath(`${item === 'index.js' ? '' : item.substring(0, item.indexOf('.'))}`), require(`./app/controllers/${item}`));
});

app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    log.error(err);
    res.status(err.status || 500);
    var model = new Model(req, "Error");
    model.error = err;
    res.end(errorCompiled(model));
});


module.exports = app;
