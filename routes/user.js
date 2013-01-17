/*
 * GET users listing.
 */

exports.fileList = function(req, res) {
    var sockets = global.io.sockets.sockets;

    var seederId = req.params.seederId;
    if (!(seederId in sockets)) {
        res.writeHead(404);
        res.end('Seeder not found.');
        return;
    }

    sockets[seederId].get('files', function(err, files) {
        res.render('user', {
            title: 'Peer of ' + seederId,
            files: files
        });
    });
};

exports.fileDownload = function(req, res) {
    var sockets = global.io.sockets.sockets;

    var seederId = req.params.seederId;
    if (!(seederId in sockets)) {
        res.writeHead(404);
        res.end('Seeder not found.');
        return;
    }

    var seeder = sockets[seederId];

    seeder.get('files', function(err, files) {
        var file = files.filter(function(file) { return file.name == req.params.fileName })[0];

        if (!file) {
            res.writeHead(404);
            res.end('File not found.');
            return;
        }

        console.log('Transferring ' + file.name + ' from ' + seederId);
        res.writeHead(200, {'Content-Type': file.type, 'Content-Length': file.size});

        var chunkSize = 64 * 1024;

        function nextChunk(offset) {
            offset = offset || 0;
            seeder.emit('getChunk', file.name, offset, chunkSize, function(data) {
                if (!data.length) {
                    res.end();
                    return;
                }
                res.write(new Buffer(data));
                nextChunk(offset + chunkSize);
            });
        }

        nextChunk();
    });
}