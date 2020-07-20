const MongoClient = require("mongodb").MongoClient;

const dbName = "ZachMessages";

async function init(arg) {
    // open connection
    const client = new MongoClient(dburl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    await client.connect();
    const db = client.db(dbName);
    // figure out what to query

    switch (arg) {

    }
    // return the query
}

async function activity(db) {

}

async function spicy(db) {

}

async function generous(db) {

}

async function favorites(db) {

}

async function vain(db) {

}