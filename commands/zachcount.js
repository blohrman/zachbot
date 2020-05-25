async function zachCount(msg) {

    // get the channel name
    const channel = msg.channel;

    try {
        let count = 0;

        // try to fetch messages
        const messages = await channel.messages.fetch();

        // count messages
        messages.forEach(message => {
            if (message.author.id === "691717080864522291") {
                count++;
            }
        });

        // shitpost
        msg.channel.send(`O glorious Zach has sent ${count} messages in this channel`);
    } catch(e) {

        // be sad
        console.log(e.stackTrace);
    }
}

module.exports = zachCount;