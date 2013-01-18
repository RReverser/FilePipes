addEventListener('load', function() {
	var filesTemplate = new EJS({url: '/views/files.ejs'});
    var socket = getPageSocket();

    socket.on('updateFiles', function(files) {
        if (!files) {
        	alert('Seeder has been disconnected. Thank you for using our service!');
        	close();
        }

        $('fileList').innerHTML = filesTemplate.render({files: files, filesAreLinks: true});
    });
});