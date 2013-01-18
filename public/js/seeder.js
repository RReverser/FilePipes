addEventListener('load', function() {
    var filesTemplate = new EJS({url: '/views/files.ejs'});
    var socket = getPageSocket();

    function getFiles() {
        return Array.prototype.map.call($('file').files, function(file) {
            return {
                name: file.name,
                size: file.size,
                type: file.type
            };
        });
    }

    function fileChangeHandler() {
        var files = getFiles();
        socket.emit('updateFiles', files);
        $('fileList').innerHTML = filesTemplate.render({files: files, filesAreLinks: false});
    }

    $('file').addEventListener('change', fileChangeHandler);

    socket.on('connect', function() {
        var html_personalUrl = $('personalUrl');
        html_personalUrl.href = socket.socket.sessionid + '/';
        html_personalUrl.innerHTML = html_personalUrl.href;
        $('connectingMsg').classList.add('hidden');
        $('personalUrl').classList.remove('hidden');

        fileChangeHandler();
    });

    socket.on('disconnect', function() {
        $('personalUrl').classList.add('hidden');
        $('connectingMsg').classList.remove('hidden');
    });

    socket.on('getChunk', function(fileName, offset, chunkSize, callback) {
        var files = $('file').files;
        var file = Array.prototype.filter.call(files, function(file) { return file.name == fileName })[0];
        var reader = new FileReader();
        reader.addEventListener('load', function() { callback(reader.result) });
        reader.readAsBinaryString(file.slice(offset, offset + chunkSize));
    });
});
