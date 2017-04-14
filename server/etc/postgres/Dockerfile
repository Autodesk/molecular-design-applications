FROM postgres:9.6.2-alpine

ENV POSTGRES_PASSWORD MSTPGMASTER
ENV POSTGRES_USER postgres

COPY setup/configure_database.sh /docker-entrypoint-initdb.d/
COPY setup/configure_database.sql /docker-entrypoint-initdb.d/
# DON'T put this file into docker-entrypoint-initdb.d as we don't want to run it every time
COPY setup/create_database.sql /