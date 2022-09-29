

### Check Shard Info
From mongo router 




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