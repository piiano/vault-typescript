#!/bin/bash

VAULT_TAG=1.10.2

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
echo "Stopping old Vaults"
docker stop pvault-dev > /dev/null 2>&1
docker rm -f pvault-dev > /dev/null 2>&1

# run vault container
echo "starting a new Vault"
docker run --rm --init -d \
  --name pvault-dev \
  -p 8123:8123 \
  -e PVAULT_SERVICE_LICENSE=$PVAULT_SERVICE_LICENSE \
  -e PVAULT_SENTRY_ENABLE=false \
  -e PVAULT_LOG_DATADOG_ENABLE=none \
  piiano/pvault-dev:${VAULT_TAG}

echo "Vault is running at http://localhost:8123"

# define an alias for Vault CLI
shopt -s expand_aliases
alias pvault="docker run --rm -i --add-host='host.docker.internal:host-gateway' -v $(pwd):/pwd -w /pwd piiano/pvault-cli:${VAULT_TAG}"

# Build
yarn build

# check for Vault version to ensure it is up and running
until pvault version > /dev/null 2>&1
do
    echo "Waiting for the vault to complete initialization ..."
    sleep 1
done

# Run the examples

npm run test::ssn
npm run cleanup

npm run test::encrypt
npm run cleanup

npm run test::store
npm run cleanup

docker stop pvault-dev
