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

    var socketAlias;

    socket.on('connect', function() {
        socket.emit('trySetAlias', socketAlias, function(newAlias) {
            socketAlias = newAlias;

            var html_personalUrl = $('personalUrl');
            html_personalUrl.href = socketAlias + '/';
            html_personalUrl.innerHTML = html_personalUrl.href;
            $('connectingMsg').classList.add('hidden');
            $('personalUrl').classList.remove('hidden');

            fileChangeHandler();
        });
    });

    socket.on('disconnect', function() {
        $('personalUrl').classList.add('hidden');
        $('connectingMsg').classList.remove('hidden');
    });

    socket.on('getChunk', function(fileName, offset, chunkSize, callback) {
        var files = $('file').files;
        var file = Array.prototype.filter.call(files, function(file) { return file.name == fileName })[0];
        var blob = file.slice(offset, offset + chunkSize);
        var reader = new FileReader();

        if ('readAsBinaryString' in FileReader.prototype) {
            reader.addEventListener('load', function() { callback(reader.result) });
            reader.readAsBinaryString(blob);
        } else {
            reader.addEventListener('load', function() {
                var bytes = new Uint8Array(reader.result);
                var binaryString = String.fromCharCode.apply(String, bytes);
                callback(binaryString);
            });
            reader.readAsArrayBuffer(blob);
        }
    });
});
