STEP:

#Check chmod +x all script/wait_for_it.sh
#Run All Docker Compose


#Check telnet all config_server
telnet m2 17021
sh configserver_init.sh
sh shardserver_init.sh
sh router_init.sh

sh init_admin_user.sh

sh add_standalone_db.sh
sh add_clusterdb.sh
sh add_clusterdb_copy.sh



