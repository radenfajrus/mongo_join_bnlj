

# Create 1 database (shard enabled), multiple collection (some sharded, some not)
# Ram Used = max data on collection =  512MB s/d 1536MB (make sure data above Ram to enable sharding)

# TPC DS Generator
sudo yum install gcc make flex bison byacc git

download zip from https://www.tpc.org/tpc_documents_current_versions/current_specifications5.asp


unzip {uuid}-tpc-h-tool.zip
cd DSGen-software-code-3.2.0rc1
cd tools
make OS=LINUX


mkdir -p ./data2gb; ./dsdgen  -VERBOSE Y -SCALE 2 -DIR ./data2gb
mkdir -p ./data3gb; ./dsdgen  -VERBOSE Y -SCALE 3 -DIR ./data3gb



use tpcds_2gb




use tpcds_3gb



# TPC H Generator
download zip from https://www.tpc.org/tpc_documents_current_versions/current_specifications5.asp

unzip {uuid}-tpc-h-tool.zip
cd TPC-H\ V3.0.1
cd dbgen
mv makefile.suite Makefile
vi Makefile
    CC      = gcc
    # Current values for DATABASE are: INFORMIX, DB2, TDAT (Teradata)
    #                                  SQLSERVER, SYBASE, ORACLE, VECTORWISE
    # Current values for MACHINE are:  ATT, DOS, HP, IBM, ICL, MVS,
    #                                  SGI, SUN, U2200, VMS, LINUX, WIN32
    # Current values for WORKLOAD are:  TPCH
    DATABASE = ORACLE
    MACHINE = LINUX
    WORKLOAD = TPCH

make

./dbgen -s 1 -f  # SF=1 (1GB), file generated -> *.tbl, separator => '|'

mkdir data1gb
mv *.tbl data1gb/.


use tpch_unsharded




use tpch


# Lookup Must be in same DB
https://groups.google.com/g/mongodb-user/c/u1oDca7oDpQ/m/dp7yrNJQAQAJ

# execution time vs load time
https://stackoverflow.com/questions/69943885/mongodb-executionstats-time-is-different-than-real-execution

# where cursor stored
https://www.mongodb.com/community/forums/t/where-are-cursors-stored/1329

# Transaction API
https://www.mongodb.com/docs/manual/core/transactions/

# Sharding database
use tpch
db.test.insert({"id":1})
sh.enableSharding("tpch")
sh.shardCollection("tpch.customer",{ _id: 1}, false)
sh.shardCollection("tpch.supplier",{ _id: 1}, false)
sh.shardCollection("tpch.partsupp",{ _id: 1}, false)
sh.shardCollection("tpch.part",{ _id: 1}, false)
sh.shardCollection("tpch.lineitem",{ _id: 1}, false)
sh.shardCollection("tpch.orders",{ _id: 1}, false)
sh.shardCollection("tpch.nation",{ _id: 1}, false)
sh.shardCollection("tpch.region",{ _id: 1}, false)


# Set chunksize to 4MB
db.part.getShardDistribution()

use config
db.settings.updateOne(
   { _id: "chunksize" },
   { $set: { _id: "chunksize", value: 4 } },
   { upsert: true }
)

db.part.getShardDistribution()


# Get collection data size
var dbNames = db.adminCommand({ listDatabases: 1, nameOnly: true })["databases"].map(d => d.name);
for (let dbname of dbNames) { db.getSiblingDB(dbname). getCollectionNames(). forEach((coll) => { let size = db.getCollection(coll).totalSize() / 1024 / 1024; let cnt = db.getCollection(coll).countDocuments();  if (dbname !== "config" && dbname !== "admin") { console.log(dbname + " : " + coll + ` : ${size} MB - ${cnt}`); } }); };


tpch : region : 0.0703125 MB - 5
tpch : test : 0.0390625 MB - 1
tpch : orders : 565.94140625 MB - 3000000
tpch : part : 97.0078125 MB - 400000
tpch : customer : 87.23828125 MB - 300000
tpch : nation : 0.0703125 MB - 25
tpch : lineitem : 1847.828125 MB - 11907500
tpch : supplier : 2.94921875 MB - 20000
tpch : partsupp : 322.484375 MB - 1600000

db.customer.find().toArray()


# Unshard collection -> https://dbtut.com/index.php/2018/08/09/unshard-a-sharded-collection-in-mongodb/
sh.stopBalancer()

database = 'tpch'
collection = database + '.fs.chunks'
 
use config
primary = db.databases.findOne({_id: database}).primary
db.chunks.find({ns: collection, shard: {$ne: primary}}).forEach(function(chunk){print('moving chunk from', chunk.shard, 'to', primary, '::', tojson(chunk.min), '-->', tojson(chunk.max));sh.moveChunk(collection, chunk.min, primary);});
db.collections.remove({ "_id" : "test.fs.chunks" })
db.chunks.remove({ ns : collection })

use admin
db.runCommand({ flushRouterConfig: 1 })
db.Collection.find({}).forEach( function(myDoc) {  db.CollectionCopy.insert(myDoc); }  );
 
use db
db.Collection.drop()

use config
db.collections.remove( { _id: "db.Collection" } )
db.chunks.remove( { ns: "db.Collection" } )
db.locks.remove( { _id: "db.Collection" } )

sh.startBalancer()