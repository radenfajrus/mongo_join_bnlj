var config_server = {
    _id: "cs",
    configsvr: true,
    version: 1,
    members: [
        { _id: 0, host : 'm1:17011' },
        { _id: 1, host : 'm2:17011' },
        { _id: 2, host : 'm3:17011' }
    ]
};

var status_config_server = rs.initiate(config_server);

printjson(status_config_server);
