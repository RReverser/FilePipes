/*
 * GET users listing.
 */

const chunkSize = 64 * 1024;

function getSeeder(req, res) {
    var seederId = req.params.seederId;

    if (!(seederId in global.sockets)) {
        res.writeHead(404);
        res.end('Seeder not found.');
        throw new Error('Seeder not found.');
    }

    return global.sockets[seederId];
}

function getFile(req, res, callback) {
    var seeder = getSeeder(req, res);

    seeder.get('files', function(err, files) {
        var file = files.filter(function(file) {
            return file.name == req.params.fileName
        })[0];

        if (!file) {
            res.writeHead(404);
            res.end('File not found.');
            throw new Error('File not found.');
        }

        callback(seeder, file);
    });
}

exports.index = function(req, res) {
    var seeder = getSeeder(req, res);

    seeder.get('files', function(err, files) {
        res.render('peer', {
            title: 'Peer of ' + seeder.alias,
            files: files,
            filesAreLinks: true
        });
    });
};

exports.fileDownload = function(req, res) {
    getFile(req, res, function(seeder, file) {
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
