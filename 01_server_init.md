# Setup Cluster with python pulumi

## Server Env
1. 4 Server (CentOS 7)
 - m0 -> master / additional software (grafana/openvpn server/etc)
 - m1 -> shard1
 - m2 -> shard2
 - m3 -> shard3
2. OpenVPN
 - m0 -> 10.10.10.1
 - m1 -> 10.10.10.101
 - m2 -> 10.10.10.102
 - m3 -> 10.10.10.103
3. Docker
4. Anaconda3 Python


## Set env (each server)
sudo su
vim /etc/hosts

    10.10.10.1   m0
    10.10.10.101 m1
    10.10.10.102 m2
    10.10.10.103 m3

## Setup OpenVPN Server (@m0)
sudo su
curl https://copr.fedorainfracloud.org/coprs/dsommers/openvpn-release/repo/epel-7/dsommers-openvpn-release-epel-7.repo > /etc/yum.repos.d/openvpn-release-epel-7.repo
yum install -y openvpn

### create openvpn rsa key
cd /etc/openvpn/server
git clone https://github.com/OpenVPN/easy-rsa.git
./easy-rsa/easyrsa3/easyrsa init-pki
./easy-rsa/easyrsa3/easyrsa build-ca nopass

;## Common Name (eg: your user, host, or server name) [Easy-RSA CA]:server
./easy-rsa/easyrsa3/easyrsa build-server-full server nopass
openssl verify -CAfile pki/ca.crt pki/issued/server.crt
openvpn --genkey secret pki/tc.key
./easy-rsa/easyrsa3/easyrsa gen-crl nopass
./easy-rsa/easyrsa3/easyrsa gen-dh


mkdir ccd
mkdir client
ln -s ./pki/issued/server.crt .
ln -s ./pki/private/server.key .
ln -s ./pki/dh.pem .
ln -s ./pki/ca.crt .
ln -s ./pki/crl.pem .
ln -s ./pki/tc.key .
ln -s ../pki ./easy-rsa/.

vim server.conf
    local 0.0.0.0
    port 1941
    proto udp
    dev tun

    ca ca.crt
    cert server.crt
    key server.key
    dh dh.pem
    auth SHA512
    tls-crypt tc.key

    topology subnet
    server 10.10.10.0 255.255.255.0 'nopool'
    ifconfig-pool 10.10.10.200 10.10.10.255
    ifconfig-pool-persist ipp.txt

    duplicate-cn
    client-to-client

    keepalive 10 120
    cipher AES-256-GCM
    ncp-ciphers AES-256-GCM:AES-256-CBC:AES-128-GCM:AES-128-CBC:BF-CBC
    user openvpn
    group openvpn
    persist-key
    persist-tun
    status status.log
    verb 3
    crl-verify crl.pem
    explicit-exit-notify

    client-config-dir ./ccd

vim client-common.txt
    client
    dev tun
    proto udp
    remote $IP_PUBLIC 1941
    resolv-retry infinite
    nobind
    persist-key
    persist-tun
    remote-cert-tls server
    auth SHA512
    cipher AES-256-GCM
    ncp-ciphers AES-256-GCM:AES-256-CBC:AES-128-GCM:AES-128-CBC:BF-CBC
    ignore-unknown-option block-outside-dns
    block-outside-dns
    verb 3


### create openvpn server systemctl
vim /usr/lib/systemd/system/openvpn-server@.service
    [Unit]
    Description=OpenVPN service - %I
    After=syslog.target network-online.target
    Wants=network-online.target
    Documentation=man:openvpn(8)
    Documentation=https://community.openvpn.net/openvpn/wiki/Openvpn24ManPage
    Documentation=https://community.openvpn.net/openvpn/wiki/HOWTO

    [Service]
    Type=notify
    PrivateTmp=true
    WorkingDirectory=/etc/openvpn/%i
    ExecStart=/usr/sbin/openvpn --status /etc/openvpn/%i/status.log --status-version 2 --suppress-timestamps --config /etc/openvpn/%i/server.conf
    CapabilityBoundingSet=CAP_IPC_LOCK CAP_NET_ADMIN CAP_NET_BIND_SERVICE CAP_NET_RAW CAP_SETGID CAP_SETUID CAP_SYS_CHROOT CAP_DAC_OVERRIDE CAP_AUDIT_WRITE
    LimitNPROC=10
    DeviceAllow=/dev/null rw
    DeviceAllow=/dev/net/tun rw
    ProtectSystem=true
    ProtectHome=true
    KillMode=process
    RestartSec=5s
    Restart=on-failure

    [Install]
    WantedBy=multi-user.target

systemctl daemon-reload
systemctl start openvpn-server@server
systemctl enable openvpn-server@server
systemctl status openvpn-server@server
ping 10.10.10.1
ip address | grep 10.10.10


### generate openvpn client for m1,m2,m3 and local (script not published)
sh openvpn_client_dhcp_add.sh
sh openvpn_client_static_add.sh 10.10.10.101 m1.ovpn
sh openvpn_client_static_add.sh 10.10.10.101 m2.ovpn
sh openvpn_client_static_add.sh 10.10.10.101 m3.ovpn
sh openvpn_client_status.sh


## Setup OpenVPN Client (@m1,m2,m3)
sudo su
curl https://copr.fedorainfracloud.org/coprs/dsommers/openvpn-release/repo/epel-7/dsommers-openvpn-release-epel-7.repo > /etc/yum.repos.d/openvpn-release-epel-7.repo
yum install -y openvpn

cp m1/m2/m3.ovpn /etc/openvpn/client/client.ovpn

vim /usr/lib/systemd/system/openvpn-client@.service
    [Unit]
    Description=OpenVPN tunnel for %I
    After=syslog.target network-online.target
    Wants=network-online.target
    Documentation=man:openvpn(8)
    Documentation=https://community.openvpn.net/openvpn/wiki/Openvpn24ManPage
    Documentation=https://community.openvpn.net/openvpn/wiki/HOWTO

    [Service]
    Type=notify
    PrivateTmp=true
    WorkingDirectory=/etc/openvpn/client
    ExecStart=/usr/sbin/openvpn --suppress-timestamps --nobind --config %i.ovpn
    CapabilityBoundingSet=CAP_IPC_LOCK CAP_NET_ADMIN CAP_NET_RAW CAP_SETGID CAP_SETUID CAP_SYS_CHROOT CAP_DAC_OVERRIDE
    LimitNPROC=10
    DeviceAllow=/dev/null rw
    DeviceAllow=/dev/net/tun rw
    ProtectSystem=true
    ProtectHome=true
    KillMode=process

    [Install]
    WantedBy=multi-user.target

systemctl daemon-reload
systemctl enable openvpn-client@client
systemctl start openvpn-client@client
systemctl status openvpn-client@client
ping 10.10.10.1
ip address



## Setup Docker (each server)
1. Install Docker 
sudo su
yum -y install yum-utils
yum-config-manager  --add-repo https://download.docker.com/linux/centos/docker-ce.repo 
yum -y install docker-ce
systemctl enable docker.service
systemctl start docker.service

usermod -aG docker root && newgrp docker

docker ps -a

2. Install Docker Compose
sudo su
curl -L "https://github.com/docker/compose/releases/download/v2.2.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/bin/docker-compose
chmod +x /usr/bin/docker-compose
docker-compose --version


## Setup Anaconda3 Python
download from https://www.anaconda.com/products/distribution
install to /opt/anaconda3

/opt/anaconda3/bin/python --version
vim /etc/bashrc
    export PATH=$PATH:/opt/anaconda3/bin

sudo su
python --version

