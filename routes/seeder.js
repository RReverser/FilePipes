/*
 * GET home page.
 */

var sockets = exports.sockets = {};

function index(req, res) {
    res.render('seeder', {
        title: 'Seeder',
        files: [],
        filesAreLinks: false
    });
};

function socketConnection(socket) {
	var io = socket.manager;

    socket.on('trySetAlias', function(socketAlias, callback) {
        socket.alias = (socketAlias && !(socketAlias in sockets)) ? socketAlias : socket.id;
        sockets[socket.alias] = socket;
        callback(socket.alias);

        socket.on('updateFiles', function(newFiles) {
            console.log(socket.alias + ' updated list of files (count = ' + newFiles.length + ')')
            socket.set('files', newFiles);
            io.of('/' + socket.alias).emit('updateFiles', newFiles);
        });

        socket.on('disconnect', function() {
            io.of('/' + socket.alias).emit('updateFiles');
            delete sockets[socket.alias];
        });
    });
};

exports.bindTo = function(server) {
	server.express.get('/', index);
	server.io.sockets.on('connection', socketConnection);
}