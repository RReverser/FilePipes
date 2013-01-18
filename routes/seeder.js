/*
 * GET home page.
 */

exports.index = function(req, res) {
    res.render('seeder', {
        title: 'Seeder',
        files: [],
        filesAreLinks: false
    });
};
