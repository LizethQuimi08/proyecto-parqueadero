#!/bin/bash
set -e
set -u

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "postgres" <<-EOSQL
  CREATE DATABASE usuarios_db;
  CREATE DATABASE zonas_db;
  CREATE DATABASE audit_db;
EOSQL
