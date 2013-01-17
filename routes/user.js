/*
 * GET users listing.
 */

exports.fileList = function(req, res) {
    var sockets = global.io.sockets.sockets;

    var seederId = req.params.seederId;
    if (!(seederId in sockets)) {
        res.writeHead(404);
        res.end('File not found.');
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
    res.end('Not implemented yet');
}