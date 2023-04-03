#!/bin/bash

# check for license key of Vault
if [ -z $PVAULT_SERVICE_LICENSE ] ; then
	echo "Please first set environment variable: PVAULT_SERVICE_LICENSE"
	echo "Obtain a free license here: https://piiano.com/docs/guides/get-started#install-piiano-vault"
	exit 0
fi

# check for docker existence
docker help > /dev/null 2>&1
if [ $? != 0 ] ; then
	echo "Running Vault requires Docker."
	echo "Please install docker first: https://docs.docker.com/get-docker/"
	exit 0
fi

# check for docker daemon running
docker version > /dev/null 2>&1
if [ $? != 0 ] ; then
	echo "Cannot connect to the Docker daemon."
	echo "Is the docker daemon running?"
	exit 0
fi

# remove existing vault container
docker rm -f pvault-dev > /dev/null 2>&1

# run vault container
docker run --rm --init -d \
  --name pvault-dev \
  -p 8123:8123 \
  -e PVAULT_SERVICE_LICENSE=$PVAULT_SERVICE_LICENSE \
  -e PVAULT_SENTRY_ENABLE=false \
  -e PVAULT_LOG_DATADOG_ENABLE=none \
  piiano/pvault-dev:1.3.0

# define an alias for Vault CLI
shopt -s expand_aliases
alias pvault="docker run --rm -i --add-host='host.docker.internal:host-gateway' -v $(pwd):/pwd -w /pwd piiano/pvault-cli:1.3.0"

# check for Vault version to ensure it is up and running
until pvault version > /dev/null 2>&1
do
    echo "Waiting for the vault to start ..."
    sleep 1
done

# create a new collection
pvault collection add --collection-pvschema "
user PERSONS (
  name NAME,
  email EMAIL,
  phone_number PHONE_NUMBER NULL,
  ssn SSN COMMENT 'Social security number',
)"

# Install dependencies
npm install --no-package-lock

# Run the example
npm start

echo "Vault is running at http://localhost:8123"
