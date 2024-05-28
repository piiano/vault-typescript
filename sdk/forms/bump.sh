#!/bin/sh

# bump the CDN version

if [ "$#" -ne 2 ]; then
    echo "Usage: <$0> <prev version> <new version>"
    echo "received $*"
    exit 1
fi

DIR=$(dirname $0)
PREV_VER=$1
NEW_VER=$2

echo "Replacing ${PREV_VER} with ${NEW_VER} in README"
gsed -i "s/v$PREV_VER.js/v$NEW_VER.js/g" ${DIR}/README.md
