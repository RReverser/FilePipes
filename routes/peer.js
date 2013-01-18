/*
 * GET users listing.
 */

function getSeeder(req, res) {
    var seederId = req.params.seederId;

    if (!(seederId in global.sockets)) {
        res.writeHead(404);
        res.end('Seeder not found.');
        throw new Error('Seeder not found.');
    }

    return global.sockets[seederId];
}

exports.index = function(req, res) {
    var seeder = getSeeder(req, res);

    seeder.get('files', function(err, files) {
        res.render('peer', {
            title: 'Peer of ' + seeder.id,
            files: files,
            filesAreLinks: true
        });
    });
};

exports.fileDownload = function(req, res) {
    var seeder = getSeeder(req, res);

    seeder.get('files', function(err, files) {
        var file = files.filter(function(file) { return file.name == req.params.fileName })[0];

        if (!file) {
            res.writeHead(404);
            res.end('File not found.');
            return;
        }

        console.log('Transferring ' + file.name + ' from ' + seeder.id);
        res.writeHead(200, {
            'Content-Type': file.type,
            'Content-Length': file.size
        });

        var chunkSize = 64 * 1024;

        function transferChunk(offset) {
            seeder.emit('getChunk', file.name, offset, chunkSize, function(data) {
                if (!data.length) {
                    res.end();
                    return;
                }
                res.write(new Buffer(data, 'binary'));
                transferChunk(offset + chunkSize);
            });
        }

        transferChunk(0);
    });
}
