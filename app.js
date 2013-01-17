var app = require('http').createServer(httpHandler),
io = require('socket.io').listen(app),
fs = require('fs');

io.set('log level', 2);
app.listen(3000);

function httpHandler(req, res) {
    fs.readFile(__dirname + '/index.html', function (err, data) {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
        }

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
    });
}

io.sockets.on('connection', function (socket) {
    socket.on('updateFiles', function (newFiles) {
        console.log(socket.id + ' updated list of files (count = ' + newFiles.length + ')')
        socket.files = newFiles;
        io.sockets.in(socket.id).emit('updateFiles', newFiles);
    });

    socket.on('join', function (socketId) {
        console.log(socket.id + ' is switching from ' + socket.joinedId + ' to ' + socketId);

        if (socket.joinedId) socket.leave(socket.joinedId);
        socket.joinedId = socketId;

        if (!(socketId in io.sockets.sockets)) {
            socket.emit('updateFiles');
            return;
        }
        socket.join(socketId);
        socket.emit('updateFiles', io.sockets.sockets[socketId].files);
    });

    socket.emit('updateFiles', socket.joinedId in io.sockets.sockets ? io.sockets.sockets[socket.joinedId].files : null);
});
