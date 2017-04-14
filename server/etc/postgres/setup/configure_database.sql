ALTER USER mstdbuser WITH ENCRYPTED PASSWORD 'dataStoreMST' ;

/* ASSUME already exists */
GRANT ALL PRIVILEGES ON DATABASE "mstdbv1" to mstdbuser ;
\connect "mstdbv1" ;
GRANT SELECT ON ALL TABLES IN SCHEMA PUBLIC to mstdbuser ;
