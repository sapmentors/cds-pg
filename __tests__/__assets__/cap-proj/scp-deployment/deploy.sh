#!/bin/bash
# export JAVA_HOME=/home/vcap/deps/0/apt/usr/lib/jvm/java-11-openjdk-amd64
# export JAVA_HOME=/home/vcap/deps/0/apt/usr/lib/jvm/java-8-openjdk-amd64
# export JAVA_HOME=/home/vcap/deps/0/apt/usr/lib/jvm/sapmachine-11
export JAVA_HOME=/home/vcap/deps/0/apt/opt/sapmachine-11-jre
export PATH=$PATH:/home/vcap/deps/1/bin
# Save Certificate from Environment where liquibase expects it
mkdir -p /home/vcap/.postgresql
export POSTGRESQL_ROOT_CERT="/home/vcap/.postgresql/root.crt"
echo $VCAP_SERVICES | jq --raw-output '."postgresql-db"[0].credentials.sslrootcert' > $POSTGRESQL_ROOT_CERT
# env
# echo $VCAP_SERVICES
npx cds-dbm deploy --load-via delta
