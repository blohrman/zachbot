const fs = require("fs");

function zachpic(msg) {

    // get files
    const dir = "./zachpics/";
    const files = fs.readdirSync(dir);

    // send random picture
    const randNum = Math.floor((Math.random() * files.length));
    msg.channel.send({
        files: [{
            attachment: dir + files[randNum],
            name: files[randNum]
        }]
    });
}

module.exports = zachpic;