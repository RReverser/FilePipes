/**
 * Module dependencies.
 */

var express = require('express'),
    seeder = require('./routes/seeder'),
    peer = require('./routes/peer'),
    http = require('http'),
    path = require('path'),
    app = express(),
    httpServer = http.createServer(app),
    io = require('socket.io').listen(httpServer, {
        'log level': 2
    });

global.sockets = io.sockets.sockets;

app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.set('views', './views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static('./public'));
    app.use('/views', express.static('./views/public'));
    app.use(app.router);
});

app.configure('development', function() {
    app.use(express.errorHandler());
});

app.get('/', seeder.index);
app.get('/:seederId', peer.index);
app.get('/:seederId/:fileName', peer.fileDownload);

httpServer.listen(app.get('port'), function() {
    console.log("Express server listening on port " + app.get('port'));
});

io.sockets.on('connection', function(socket) {
    socket.on('updateFiles', function(newFiles) {
        console.log(socket.id + ' updated list of files (count = ' + newFiles.length + ')')
        socket.set('files', newFiles);
        io.of('/' + socket.id).emit('updateFiles', newFiles);
    });

    socket.on('disconnect', function() {
        io.of('/' + socket.id).emit('updateFiles');
    });
});
