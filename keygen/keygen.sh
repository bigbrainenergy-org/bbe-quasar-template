#!/bin/bash
echo it is highly recommended that you run this on bare metal offline.
mkdir ./keypair
mkdir ./keypair/ini
cd keypair
openssl genrsa -out private.key 2048
openssl req -new -x509 -key private.key -out couchdb.pem -days 1095
openssl x509 -pubkey -noout -in couchdb.pem -out public.key
chmod 600 private.key couchdb.pem
chown couchdb private.key couchdb.pem

PUB_KEY=$(cat public.key)
PUB_KEY_FORMATTED=$(echo "$PUB_KEY" | sed ':a;N;$!ba;s/\n/\\n/g')
echo "rsa:testing = $PUB_KEY_FORMATTED" >> ini/10-pubkey.ini
