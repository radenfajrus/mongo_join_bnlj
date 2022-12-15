var crypto = require('crypto');
var http = require('http');
var fs = require('fs');
var websocketServer = require('ws');
var url = require("url");


class WsRepo {
    users = {}
    clients = {}
    topics = {}
    sockets = {}
    stacks = []
    head
    max_array
    activeConnections=[] //WsConnection

    constructor () {
        this.users= {};
        this.clients= {};
        this.topics = {
            "/system/sos" : {"subscriber":[]},
            "/system/user_tracking" : {"subscriber":[]},
            "/system/space" : {"subscriber":[]},
            "/log/debug" : {"subscriber":[]},
            "/log/info" : {"subscriber":[]},
            "/log/error" : {"subscriber":[]},
            "/notification/changed" : {"subscriber":[]},
            "/notification/test" : {"subscriber":[]}
        };
        this.sockets= {};
        this.stacks= [];
        this.head = 0;
        this.max_array = 200;

        this.activeConnections= [];
    }
    
    addActiveConnection(connection) {
        this.activeConnections.push(connection);
    }
    removeActiveConnection(connection) {
        for (var i=0;i<this.activeConnections.length;i++) {
            if (this.activeConnections[i] === connection) {
                this.activeConnections.splice(i,1);
                for(var t in this.topics){
                    this.topics[t]["subscriber"] = this.topics[t]["subscriber"].filter( x => x!==connection.user )
                }
                break;
            }
        }
    }
    
    send(msg){
        if(this.stacks.length>this.max_array) {
            this.stacks[this.head] = msg
            this.head = (this.head+1)%this.max_array
        }else{
            this.stacks.push(msg)
        }
    }

    checkScope(userScope){
        // return !userScope || !Permissions.hasPermission(userScope,"status.read"))
        return true
    }
}


var wsrepo = new WsRepo()

class WsUser{
    user

    constructor () {
        this.user = null;
    }

    authenticate() {
        var username = arguments[0];
        if (typeof username !== 'string') {
            username = username.username;
        }
        const args = Array.from(arguments);
    }
    getDefaultUser() {
        return Promise.resolve(null);
    }

    cleanUser(user) {
        if (user && user.hasOwnProperty('password')) {
            // user = clone(user);
            delete user.password;
        }
        return user;
    }

}


class WsConnection {
    session 
    ws
    stack
    user
    token
    topics = []
    lastSentTime
    _xmitTimer

    constructor (ws, user) {
        this.session = crypto.randomBytes(32).toString('base64');
        this.ws = ws;
        this.stack = [];
        this.topics = [];
        this.user = null;
        this.token = null;
        this.lastSentTime = Date.now()
        this._xmitTimer = null;

        var self = this;
            
        this.ws.on('close',function() {
            // log.audit({event: "comms.close",user:self.user, session: self.session});
            // log.trace("comms.close "+self.session);
            wsrepo.removeActiveConnection(self);
            console.log("close : " + self.session)
        });
        this.ws.on('error', function(err) {
            // log.warn(log._("comms.error",{message:err.toString()}));
            console.log(err)
        });

        this.ws.on('message', function(data,flags) {
            let msg = null;
            try {
                msg = JSON.parse(data);
            } catch(err) {
                console.log("[MalformedMessage] "+err.toString());
                return;
            }

            // Check type msg -> authByToken -> OpenConnection -> No Topic -> Subscribe Topic.
            if (self.user) {
                if (msg.subscribe) {
                    self.subscribe(msg.subscribe);
                    // handleRemoteSubscription(ws,msg.subscribe);
                }
                if (msg.unsubscribe) {
                    self.unsubscribe(msg.unsubscribe);
                    // handleRemoteSubscription(ws,msg.subscribe);
                }
            } else {
                // Authorize User
                if (msg.auth) {
                    let userScope = "read"
                    
                    try {
                        let hasScope = wsrepo.checkScope(userScope)
                        if (!hasScope) {
                            ws.send(JSON.stringify({auth:"fail"}));
                            ws.close();
                        } else {
                            self.user = self.session;
                            self.token = msg.auth;

                            // Check Session is Exist
                            if(msg.session){
                                for(let i in wsrepo.activeConnections){
                                    if(wsrepo.activeConnections[i].session === msg.session){
                                        self.stack = JSON.parse(JSON.stringify(wsrepo.activeConnections[i].stack))
                                        self.user = wsrepo.activeConnections[i].user
                                        self.token = wsrepo.activeConnections[i].token
                                    }
                                }
                            }

                            wsrepo.addActiveConnection(self)
                            ws.send(JSON.stringify({auth:self.token,session:self.session}));
                        }
                    } catch(err) {
                        console.log(err.stack);
                    }
                } else {
                }
            }
        });
    }

    send(topic,data) {
        if ( topic && data &&
            (
                (typeof data==="object" && data.length!==0 && Object.keys(data).length!==0) 
                ||
                (typeof data!=="object") 
            )
            ) {
            let isSubscribed = this.topics.includes(topic) 
            let isDefaultTopic = ["hb","auth","subscribed","unsubscribed"].includes(topic) 
            if(isSubscribed || isDefaultTopic){
                this.stack.push({topic:topic,data:data});
                this._queueSend();
            }
        }
    }
    _queueSend() {
        if (!this._xmitTimer) {
            var self = this
            this._xmitTimer = setTimeout(function() {
                try {
                    console.log(self.ws.readyState)
                    console.log(self.stack)
                    if(self.ws.readyState==1){
                        self.ws.send(JSON.stringify(self.stack.splice(0,50)));
                    }else{
                        self.ws.send(JSON.stringify([]));
                        return
                    }
                    self.lastSentTime = Date.now();
                } catch(err) {
                    console.log(`connection removed ${self.session}`)
                    wsrepo.removeActiveConnection(self);
                }
                self._xmitTimer = null;
                if (self.stack.length > 0) {
                    self._queueSend();
                }
            },50);
        }
    }

    subscribe(topic) {
        // check regex /topic1/# and /topic1/+/name
        var re = new RegExp("^"+topic.replace(/([\[\]\?\(\)\\\\$\^\*\.|])/g,"\\$1").replace(/\+/g,"[^/]+").replace(/#$/,"(.*)?")+"$");
        let subscribed = []
        for (var t in wsrepo.topics) {
            if (re.test(t)) {
                if(!this.topics.includes(t)){
                    this.topics.push(t)
                }
                if(!wsrepo.topics[t]["subscriber"].includes(this.user)){
                    wsrepo.topics[t]["subscriber"].push(this.user)
                }
                subscribed.push(t)
            }
        }
        this.ws.send(JSON.stringify({"subscribed":subscribed}));
        if (this.stack.length > 0) {
            this._queueSend();
        }
    }
    unsubscribe(topic) {
        // check regex /topic1/# and /topic1/+/name
        var re = new RegExp("^"+topic.replace(/([\[\]\?\(\)\\\\$\^\*\.|])/g,"\\$1").replace(/\+/g,"[^/]+").replace(/#$/,"(.*)?")+"$");
        let unsubscribed = []
        for (var t in wsrepo.topics) {
            if (re.test(t)) {
                this.topics = this.topics.filter( x => x!==t )
                wsrepo.topics[t]["subscriber"] = wsrepo.topics[t]["subscriber"].filter( x => x!==this.user )
                unsubscribed.push(t)
            }
        }
        this.ws.send(JSON.stringify({"unsubscribed":unsubscribed}));
        if (this.stack.length > 0) {
            this._queueSend();
        }
    }
    
    publish(topic,data) {
        wsrepo.send({topic:topic,data:data});
        wsrepo.activeConnections.forEach(connection => connection._queueSend())
    }
}

class WsServer {
    server
    wss
    path
    cfg

    // Heartbeat : Server check status all client each few second, to terminate closed connection
    // let client reconnect to server if disconnected
    heartbeatTimer = null
    heartbeatInterval = 15000
    lastHeartbeatTime = null
    webSocketKeepAliveTime = 3600000

    constructor (app,path,cfg=null) {
        // Config
        this.cfg = cfg
        this.path = path
        
        // Server
        this.server = http.createServer(app)
        
        this.wss = new websocketServer.Server({
            path: path, server: this.server
        });

    }

    publish(topic,data) {
        // wsrepo.stack.forEach(connection => connection.send(topic,data));
        wsrepo.activeConnections.forEach(connection => connection.send(topic,data));
    }

    start(){
        this.server.on('upgrade', function upgrade(request, socket, head) {
            let commsPath = "/";
            commsPath = (commsPath.slice(0,1) != "/" ? "/":"") + commsPath + (commsPath.slice(-1) == "/" ? "":"/") + this.path;
            
            const pathname = url.parse(request.url).pathname;
            if (pathname === commsPath) {
                this.wss.handleUpgrade(request, socket, head, function done(ws) {
                    this.wss.emit('connection', socket, request, null);
                });
            }
        });

        this.wss.on('connection', (ws, req, user) => {
            let conn = new WsConnection(ws,user)
            conn.subscribe("/notification/+")
            wsrepo.addActiveConnection(conn)
        });
        this.wss.on('error', function(err) {
            console.log(err)
        });

        // Check Connection Alive
        this.lastHeartbeatTime = Date.now();
        var self = this
        this.heartbeatTimer = setInterval(function() {
            var now = Date.now();
            if (now-self.lastHeartbeatTime > self.heartbeatInterval) {
                wsrepo.activeConnections.forEach(connection => {
                    if (now-connection.lastSentTime > self.webSocketKeepAliveTime) {
                        try {
                            connection.ws.send(JSON.stringify({"hb":self.lastHeartbeatTime}))
                            connection.lastSentTime = Date.now()
                            if(connection.ws.readyState!==1){
                                console.log(`connection removed ${connection.session}`)
                                wsrepo.removeActiveConnection(connection);
                            }
                        } catch(err) {
                            console.log(`connection removed ${connection.session}`)
                            wsrepo.removeActiveConnection(connection);
                        }
                    }
                });
                self.lastHeartbeatTime = now
            }
        }, 1000);
  
    }
        
    stop() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.wss) {
            this.wss.close();
            this.wss = null;
        }
    }

}

module.exports = {
    WsConnection,
    WsRepo,
    WsServer,
    WsUser,
    wsrepo
}