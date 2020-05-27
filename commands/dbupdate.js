const MongoClient = require("mongodb").MongoClient;

const config = require("config.json");
const dburl = config.dburl;

const dbName = "ZachMessages";

async function dbupdate(channel) {
    const client = new MongoClient(dburl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    await client.connect();
    const db = client.db(dbName);

    await ingestMessages(channel, db);

}

async function ingestMessages(channel, db) {
    const messageCollection = db.collection("messages");
    const lastMessage = await messageCollection.find({}).limit(1);

    if (!(lastMessage)) {
        // account for if the db hasn't been created? is that something i need to do?
        // or should i just ensure that it's been created before we start lol
    }

    //TODO: loop through until no more messages

    let messages = await channel.messages.fetch({
        after: lastMessage.messageID
    }).array();

    let toInsert = [];

    messages.forEach(element => {
        let message = {
            "messageID": element.id,
            "userID": element.author.id,
            "sent": element.createdAt,
            "channelID": element.channel.id,
            "reactions": element.reactions.cache // fix this
        };

        toInsert.push(message);
    });

    let finalMessageID = toInsert[toInsert.length - 1].messageID;

    await messageCollection.insertMany(toInsert);
}

module.exports = dbupdate;