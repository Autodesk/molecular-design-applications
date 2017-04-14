#!/bin/bash -e

# Create user
dropuser -U postgres -w --if-exists mstdbuser
createuser -U postgres -w --no-password -e -E -i -l -r mstdbuser

# see if db exists
set +e
# Good way to determine if db exists : http://stackoverflow.com/questions/14549270/check-if-database-exists-in-postgresql-using-shell
echo "databases found:"
psql -lqt | cut -d \| -f 1 
echo "psql -lqt | cut -d \| -f 1 | grep -qw mstdbv1"
psql -lqt | cut -d \| -f 1 | grep -qw mstdbv1
dbExists=$?
# for some reason this command below did not work like above
# dbExists=$(psql -lqt | cut -d \| -f 1 | grep -qw mstdbv1)
echo "Creating database 'mstdbv1' if it does not exist. Check=$dbExists (0=exists, 1=not exist)"
# returns 0 if db  exists, and 1 if it DOES NOT exists

set -e
if [ "$dbExists" = "1" ]
then
  psql -a -v ON_ERROR_STOP=1 -d postgres -f /create_database.sql
fi


# Create database
# this happens automatically when the .sql file is copied into /docker-entrypoint-initdb.d/
#psql -a -v ON_ERROR_STOP=1 -d postgres -f $MYPATH/configure_database.sql
