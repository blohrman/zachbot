const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const zachcount = require("./commands/zachcount.js");

const init = config.initializer;

// echo when ready
client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// processes a message
client.on("message", msg => {
    if (msg.content[0] === init) {
        const command = msg.content.substring(1);
        if (command === "zachcount") {
            zachcount(msg);
        }
    }
});

client.login(config.token);