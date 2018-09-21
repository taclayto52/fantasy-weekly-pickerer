var beautify = require('js-beautify').js,
    fs = require('fs');

console.log('beautification starting...');
fs.readFile('app.js', 'utf8', function(err, data){
    if(err) {
        throw err;
    }

    var beautifiedCode = beautify(data, {
        indent_size: 2,
    });

    fs.writeFile('app.js', beautifiedCode, function(err){
        if(err){
            throw err;
        }

        console.log('beautification done!');
    });
});