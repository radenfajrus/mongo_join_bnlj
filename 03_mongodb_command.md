
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



