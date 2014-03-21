#!/bin/bash

DATA_DIR="$( cd "$( dirname "$0" )" && pwd )/../data"

wget -N --no-check-certificate https://drupal.org/node/1283408 -O $DATA_DIR/core.html
wget -N http://updates.drupal.org/release-history/project-list/all -O $DATA_DIR/community.xml
