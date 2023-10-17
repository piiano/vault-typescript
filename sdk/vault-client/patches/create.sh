#!/bin/bash

# to generate patch:
# 1. yarn build from vault-client
# 2. make changes
# 3. run: ./patches/create.sh new-patch-name
# (*) Patch name without .patch

echo "Creating patch: $1"

git add -f ./src/generated

yarn generate

git diff --patch -R -- ./src/generated > ./patches/$@.patch

git rm --cached -r -f ./src/generated
