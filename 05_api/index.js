const mongoose = require("mongoose")
const express = require("express")

// INIT CONF
require('dotenv').config()
const conf = require("./config")
console.log(conf.url)

// INIT INFRA
const Conn = require("./connection").ConnManager
let conns = Conn.all()
console.log(conns)
conns["aaa"] = "bbb"

console.log(Conn.all())

// INIT SERVICE
const Service = require("./service")



// INIT ROUTER
const app = express();
app.get("/", (req, res) => {
    res.send("Ok");
});

app.get("/coordinator", (req, res) => {
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
    res.send("Coordinator");
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


app.listen(conf.port, () => {
    console.log(`Listen on the port ${conf.port}...`);
});