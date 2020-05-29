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

    await addMembers(channel, db);

}

async function ingestMessages(channel, db) {
    const messageCollection = db.collection("messages");

    // query database for the last ingested message
    let lastMessage = await messageCollection.find({}).sort({sent: -1}).limit(1).toArray();

    lastMessage = lastMessage[0];

    let exit = false;
    let toInsert = [];
    let latestMessageIngestedID = "";
    const lastMessageInBaseID = lastMessage.messageID;

    while (!(exit)) {

        // if there is a message ID to get messages before, use that. if not, get the most recent messages
        let messages = await channel.messages.fetch(latestMessageIngestedID ? { before: latestMessageIngestedID} : {});

        // to array
        messages = messages.array();

        // if we ingested no more messages, than wham bam there ain't nothing new to add to the db
        if (messages.length === 0) {
            exit = true;
            continue;
        }

        // format & push each message to the array
        for (let element of messages) {
            let message = await processMessage(element);

            if (message.messageID === lastMessageInBaseID) {
                exit = true;
                break;
            }

            toInsert.push(message);
            latestMessageIngestedID = message.messageID;
        }
    }

    if (toInsert.length !== 0) {
        await messageCollection.insertMany(toInsert);
    }
}

async function processMessage(message) {
    return {
        "messageID": message.id,
        "userID": message.author.id,
        "sent": new Date(message.createdAt),
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

async function addMembers(channel, db) {

    // get the users already in the db
    const usersCollection = db.collection("users");
    const usersInBase = await usersCollection.find({}).toArray();

    // get the users of the channel
    let membersCollection = channel.members;
    membersCollection = membersCollection.array();

    // format users
    let members = [];
    membersCollection.forEach(element => {
        let member = {
            "name": element.user.tag,
            "userID": element.user.id
        };

        members.push(member);
    });

    // check if each user is in the db, if not, add them to the db
    for (let member of members) {
        let inBase = false;
        for (let user of usersInBase) {
            if (member.userID === user.userID) {
                inBase = true;
                break;
            }
        }

        if (!(inBase)) {
            await usersCollection.insertOne(member);
        }
    }
}

module.exports = dbupdate;