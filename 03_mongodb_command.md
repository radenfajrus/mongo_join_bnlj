
https://scoutapm.com/blog/monitoring-docker-containers-from-scratch

CONTAINER ID   NAME      CPU %     MEM USAGE / LIMIT   MEM %     NET I/O           BLOCK I/O         PIDS
cf790469a48e   c1-s1     0.00%     78MiB / 512MiB      15.23%    5.51MB / 24.7MB   14.5MB / 26.9MB   93
11702787a1ec   c1-r1     0.46%     17.19MiB / 512MiB   3.36%     29.1MB / 3.89MB   33.4MB / 27.5MB   33
642dc439d0f3   c1-c1     2.71%     85.05MiB / 512MiB   16.61%    18.9MB / 16.3MB   12.2MB / 66.1MB   87

CPU %     


MEM USAGE
cat /sys/fs/cgroup/memory/memory.stat | grep total_rss

MEM LIMIT   
MEM %     
NET I
NET O           
BLOCK I
BLOCK O
PIDS



$ docker run -it --rm --cpus 1.5 --memory 1g busybox /bin/sh
/ # cat /sys/fs/cgroup/memory/memory.usage_in_bytes
3043328
/ # cat /sys/fs/cgroup/memory/memory.limit_in_bytes
1073741824
/ # cat /sys/fs/cgroup/cpu/cpu.cfs_quota_us
150000
/ # cat /sys/fs/cgroup/cpu/cpu.cfs_period_us
100000
/ # cat /sys/fs/cgroup/cpu/cpuacct.usage
97206588



https://docs.docker.com/config/containers/runmetrics



% cat <( </dev/zero head -c 10m) <(sleep 2) | tail

</dev/zero head -c 1000m | pv -L 50m | tail


dd if=/dev/zero of=/dev/null
fulload() { dd if=/dev/zero of=/dev/null | dd if=/dev/zero of=/dev/null | dd if=/dev/zero of=/dev/null | dd if=/dev/zero of=/dev/null & }; fulload; read; killall dd



### Check Shard Info
From mongo router 

sh.status()

db.createUser(
  {
    user: "admin",
    pwd: "admin",
    roles: [ { role: "root", db: "admin" } ]
  }
)
data1gb : part : 35.76171875 MB - 200000
data1gb : partsupp : 169.171875 MB - 800000
data1gb : nation : 0.0078125 MB - 0
data1gb : lineitem : 720.390625 MB - 3700000
data1gb : orders : 252.97265625 MB - 1500000
data1gb : region : 0.0078125 MB - 0
data1gb : supplier : 1.48046875 MB - 10000
data1gb : customer : 45.98046875 MB - 150000
    150000 /home/infra/TPC-H V3.0.1/dbgen/data1gb/customer.tbl
   6001215 /home/infra/TPC-H V3.0.1/dbgen/data1gb/lineitem.tbl
        25 /home/infra/TPC-H V3.0.1/dbgen/data1gb/nation.tbl
   1500000 /home/infra/TPC-H V3.0.1/dbgen/data1gb/orders.tbl
    800000 /home/infra/TPC-H V3.0.1/dbgen/data1gb/partsupp.tbl
    200000 /home/infra/TPC-H V3.0.1/dbgen/data1gb/part.tbl
         5 /home/infra/TPC-H V3.0.1/dbgen/data1gb/region.tbl
     10000 /home/infra/TPC-H V3.0.1/dbgen/data1gb/supplier.tbl
#data1gb : part : 87.66015625 MB - 400000
#data1gb : partsupp : 22.484375 MB - 100000
data1gb : lineitem : 0.0390625 MB - 25
data1gb : orders : 0.0390625 MB - 25
#data1gb : customer : 0.0390625 MB - 25


data2gb : supplier : 1.48046875 MB - 10000
data2gb : orders : 252.97265625 MB - 1500000
data2gb : orders2 : 0 MB - 0
data2gb : region : 0.0078125 MB - 0
data2gb : nation : 0.0078125 MB - 0
data2gb : lineitem : 722.29296875 MB - 3700000
data2gb : customer : 45.98046875 MB - 150000
data2gb : part : 35.76171875 MB - 200000
data2gb : partsupp : 169.171875 MB - 800000
    300000 /home/infra/TPC-H V3.0.1/dbgen/data2gb/customer.tbl
  11997996 /home/infra/TPC-H V3.0.1/dbgen/data2gb/lineitem.tbl
        25 /home/infra/TPC-H V3.0.1/dbgen/data2gb/nation.tbl
   3000000 /home/infra/TPC-H V3.0.1/dbgen/data2gb/orders.tbl
   1600000 /home/infra/TPC-H V3.0.1/dbgen/data2gb/partsupp.tbl
    400000 /home/infra/TPC-H V3.0.1/dbgen/data2gb/part.tbl
         5 /home/infra/TPC-H V3.0.1/dbgen/data2gb/region.tbl
     20000 /home/infra/TPC-H V3.0.1/dbgen/data2gb/supplier.tbl


db.updateUser("admin",
  {
    roles: [ { role: "root", db: "admin" } ]
  }
)

db.grantRolesToUser(admin,   [ { role: "read", db: "config" } ] )

### DB AUTH
db.auth( "admin", "admin" )


### CHECK COLLECTION SIZE
db.collection.stats()



insert : 400000
insert : 9
Traceback (most recent call last):
  File "/home/infra/TPC-H V3.0.1/dbgen/main2.py", line 141, in <module>
    db[s2].insert_many(data_bulk)
  File "/opt/anaconda3/lib/python3.9/site-packages/pymongo/collection.py", line 574, in insert_many
    raise TypeError("documents must be a non-empty list")
TypeError: documents must be a non-empty list



