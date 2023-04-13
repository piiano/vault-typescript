#!/bin/bash

echo $1

git add -f ./src/generated

yarn generate

git diff --patch -R -- ./src/generated > ./patches/$@.patch

git rm --cached -r -f ./src/generated
