const Discord = require("discord.js");
const client = new Discord.Client();

const config = require("./config.json");
const zachcount = require("./commands/zachcount.js");
const zachpic = require("./commands/zachpic.js");

const init = config.initializer;

// echo when ready
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// processes a message
client.on("message", msg => {
    if (msg.content[0] === init) {
        const command = msg.content.substring(1);
        switch (command) {
            case ("zachcount"):
                zachcount(msg);
                break;
            case ("zachpic"):
                zachpic(msg);
                break;
            default:
                msg.channel.send("Whoopsies! Looks like you made a fuckie-wuckie. Try again!");
                break;
        }
    }
});

client.login(config.token);