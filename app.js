/**
 * Module dependencies.
 */

var express = require('express'),
    http = require('http'),
    socketIO = require('socket.io'),
    routes = {
        seeder: require('./routes/seeder'),
        peer: require('./routes/peer')
    },
    server = {};

server.express = express();
server.http = http.createServer(server.express);
server.io = socketIO.listen(server.http, {'log level': 2});

server.express.configure(function() {
    this.set('port', process.env.PORT || 3000);
    this.set('views', './views');
    this.set('view engine', 'ejs');
    this.use(express.favicon());
    this.use(express.logger('dev'));
    this.use(express.bodyParser());
    this.use(express.methodOverride());
    this.use(express.static('./public'));
    this.use('/views', express.static('./views/public'));
    this.use(this.router);
});

server.express.configure('development', function() {
    this.use(express.errorHandler());
});

for (var routeName in routes) {
    routes[routeName].bindTo(server);
}

server.http.listen(server.express.get('port'), function() {
    console.log("Express server listening on port " + server.express.get('port'));
});
