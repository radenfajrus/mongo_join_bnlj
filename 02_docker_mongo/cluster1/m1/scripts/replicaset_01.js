var config_replicaset_01 = {
    _id: "rs1",
    version: 1,
    members:[
        { _id: 0, host : "m1:17012" },
    ]
};

var status_replicaset_01 = rs.initiate(config_replicaset_01);

printjson(status_replicaset_01);
