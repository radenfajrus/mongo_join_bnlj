const mongoose = require("mongoose")
const express = require("express")
const path = require("path")
const nunjucks = require('nunjucks')

// INIT CONF
require('dotenv').config()
const conf = require("./config")

// INIT INFRA
const Conn = require("./connection").ConnManager
let conns = Conn.all()

// INIT SERVICE
const Service = require("./service")
const { env } = require("process")



// INIT ROUTER
const app = express();
app.use(express.json()) 

app.get("/", (req, res) => {
    res.send("Ok");
});


app.use('/assets',express.static(path.join(__dirname, 'public/assets')));
var nunjuck = nunjucks.configure( 'views', {
    autoescape: true,
    cache: false,
    express: app
} ) ;
nunjuck.addGlobal('url_for',()=> `http://localhost:${conf.port}`);
app.engine('html', nunjuck.render)
app.set('view engine', 'html');
app.set('views', 'views');

app.use('/home', (req, res, next) => {
    res.render('home.html');
});
app.use('/ws_test', (req, res, next) => {
    res.render('ws.html');
});
  
  

app.post("/coordinator", (req, res) => {
    /*
        1. Init Param
        1. Get All Chunk Server
        1. Init Connection All Chunk Server
        2. Create Job
        2. Create Chunk Plan
        3. Store Chunk Plan
        - Update Status Open
        4. List Executor
        5. While True Executor
        5. Send Job
        6. Listen Executor Success (Log Job)
        7. Check New Executor
        8. List Executor
        9. Send Job to New Executor
        10. Promise Return Query Select All
    */
    res.json(req.body)
    // res.send("Coordinator");
});

app.get("/executor", (req, res) => {
    /*
        1. Decide Chunk to Process (Balanced Node)
        2. Check status
        3. Kill Itself while All Status Done.
        - Update Status Running (Kill Itself while Status Already Done.)
        - Get Data
        - Update Status Running (Kill Itself while Status Already Done.)
        - BNLJ
        - Update Status Running (Kill Itself while Status Already Done.)
        - Insert
        - Update Status Done
        - Return Status
    */
    res.send("Executor");
});

const ws = require('./websocket')
const wsserver = new ws.WsServer(app,"/wss")
wsserver.start()

app.post('/publish', (req,res) => {
    wsserver.publish( req.body.topic, req.body.data)
    let subscribers = []
    ws.wsrepo.activeConnections.forEach( connection => {
        let topic = (connection.topics)?connection.topics:[];
        if(connection.topics.includes(req.body.topic)){
            subscribers.push(connection.session)
        }
    })
    let response = {"topic" : req.body.topic,"data" : req.body.data,"subscribers": subscribers}

    res.type('application/json');
    return res.status(200).json(response);
})

// const { MongoClient } = require('mongodb');
// async function main() {
//     const uri = "mongodb://admin:admin@m1:17013/bnlj?retryWrites=true&w=majority";
//     const client = new MongoClient(uri);
//     try {
//         await client.connect();
//     } finally {
//         await client.close();
//     }
// }
// main().catch(console.error);
// const mongoCollectionWatcher = setInterval()

mongoose.connect(
    `mongodb://admin:admin@m1:17013/block_join_status?authSource=admin`, 
    {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true
    }
  );
const Event = mongoose.model('Event', new mongoose.Schema({ 
    location: String,
    min: String,
    max: String,
    start_time: Date,
    end_time: Date,
    respon_time: Date,
}));
const Block = mongoose.model('Block', new mongoose.Schema({ 
    source: String,
    block1: String,
    block2: String,
    status: String,
}));
const BlockJoinStatus = mongoose.model('BlockJoinStatus', new mongoose.Schema({ 
    trax_id: Number,
    query: String,
    start_time: Date,
    end_time: Date,
    blocks: String[Block],
    events: String[Event],
}));
// Create a change stream. The 'change' event gets emitted when there's a
// change in the database. Print what the change stream emits.
BlockJoinStatus.watch().
  on('change', data => console.log(data));


wsserver.server.listen(conf.port, () => {
    console.log(`Listen on the port ${conf.port}...`);
});