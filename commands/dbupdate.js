const MongoClient = require("mongodb").MongoClient;

const dbName = "ZachMessages";

async function dbupdate(channel, dburl) {
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

    // query database for the last ingested message
    const lastMessage = await messageCollection.find({}).sort({"sent": 1}).limit(1);

    let exit = false;
    let toInsert = [];
    let count = 0;

    while (!(exit)) {
        let firstMessageIngestedID = "";
        let latestMessageIngestedID = "";
        const lastMessageInBaseID = lastMessage.messageID;

        let messages;
        if (latestMessageIngestedID) {
            // use the latest ingested message ID to get messages before that
            messages = await channel.messages.fetch({
                before: latestMessageIngestedID
            });
        } else {
            // if latestMessageIngestedID is falsy, means we haven't ingested any messages, so get first 50
            messages = await channel.messages.fetch();
        }

        // to array
        messages = messages.array();

        // format each message
        for (let element of messages) {
            let message = await processMessage(element);

            // if the message's ID is the same as the last message stored, stop eating messages because we're caught up
            // also, if the first message ingested's ID is the same as the current message's ID, that mean's we've reached the end of the
            // channel history and need to stop ingesting
            if (message.messageID === lastMessageInBaseID || ((message.messageID === firstMessageIngestedID) && count !== 0)) {
                exit = true;
                break;
            } else {
                toInsert.push(message);
                latestMessageIngestedID = message.messageID;

                if (count === 0) {
                    firstMessageIngestedID = message.messageID;
                }
                count++;
            }
        }
    }

    // debug
    console.log(toInsert);
    console.log(toInsert.length);

    //await messageCollection.insertMany(toInsert);
}

async function processMessage(message) {
    return {
        "messageID": message.id,
        "userID": message.author.id,
        "sent": message.createdAt,
        "channelID": message.channel.id,
        "reactions": await getReactions(message)
    };
}

function getReactions(message) {

    // get the reactions from current message
    const reactionCollection = message.reactions.cache.array();
    const reactions = [];

    reactionCollection.forEach(async reaction => {

        // for some reason this data isn't cached with the message, so we have to await it while it fetches
        let users = await reaction.users.fetch();
        users = users.array();

        // get the user IDs
        let userIDs = [];
        users.forEach(user => {
            userIDs.push(user.id);
        });

        // get the actual reaction
        let currentReaction = reaction.emoji.toString();
        
        reactions.push({
           "name": currentReaction,
           "users": userIDs
        });
    });

    return reactions;
}

module.exports = dbupdate;