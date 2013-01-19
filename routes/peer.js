/*
 * GET users listing.
 */

const chunkSize = 64 * 1024;

var sockets = require('./seeder').sockets;

function getSeeder(req, res, callback) {
    var seederId = req.params.seederId;

    if (!(seederId in sockets)) {
        callback('Seeder not found.');
        return;
    }

    callback(null, sockets[seederId]);
}

function getFiles(req, res, callback) {
    getSeeder(req, res, function(err, seeder) {
        if (err) {
            callback(err);
            return;
        }

        seeder.get('files', function(err, files) { callback(err, files, seeder) });
    });
}

function getFile(req, res, callback) {
    getFiles(req, res, function(err, files, seeder) {
        if (err) {
            callback(err);
            return;
        }

        var file = files.filter(function(file) {
            return file.name == req.params.fileName
        })[0];

        if (!file) {
            callback('File not found.');
            return;
        }

        callback(null, file, files, seeder);
    });
}

function index(req, res) {
    getFiles(req, res, function(err, files, seeder) {
        if (err) {
            res.writeHead(404);
            res.end(String(err));
            throw new Error(err);
        }

        res.render('peer', {
            title: 'Peer of ' + seeder.alias,
            files: files,
            filesAreLinks: true
        });
    });
};

function fileDownload(req, res) {
    getFile(req, res, function(err, file, files, seeder) {
        if (err) {
            res.writeHead(404);
            res.end(String(err));
            throw new Error(err);
        }

        var range = {
            start: 0,
            end: file.size - 1,
            isPartial: false
        };

        if ('range' in req.headers) {
            var offsets = req.headers.range.match(/^bytes=(\d+)?-(\d+)?$/).slice(1).map(Number);
            range.start = offsets[0] || range.start;
            range.end = offsets[1] || range.end;
            range.isPartial = true;
        }

        console.log('Transferring ' + file.name + ' from ' + seeder.alias + ' (bytes ' + range.start + '-' + range.end + ')');
        res.writeHead(range.isPartial ? 206 : 200, {
            'Accept-Ranges': 'bytes',
            'Content-Type': file.type,
            'Content-Length': range.end - range.start + 1,
            'Content-Range': 'bytes ' + range.start + '-' + range.end + '/' + file.size
        });

        var isDisconnected = false;

        req.on('close', function() {
            isDisconnected = true;
            console.log('Transfer of ' + file.name + ' from ' + seeder.alias + ' was interrupted.');
        });

        req.on('end', function() {
            console.log('Transfer of ' + file.name + ' from ' + seeder.alias + ' was finished.');
        });

        function transferChunk(offset) {
            seeder.emit('getChunk', file.name, offset, chunkSize, function(data) {
                if (isDisconnected) return;

                if (!data.length) {
                    res.end();
                    return;
                }
                res.write(new Buffer(data, 'binary'));
                transferChunk(offset + chunkSize);
            });
        }
        transferChunk(range.start);
    });
}


exports.bindTo = function(server) {
    server.express.get('/:seederId', index);
    server.express.get('/:seederId/:fileName', fileDownload);
}