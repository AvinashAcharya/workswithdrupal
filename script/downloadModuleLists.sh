#!/bin/bash

DATA_DIR="$( cd "$( dirname "$0" )" && pwd )/../data"

rm $DATA_DIR/*.html

wget --no-check-certificate https://drupal.org/node/1283408 -O $DATA_DIR/core.html

for ((i=0; i<574; i++)); do
  wget --no-check-certificate "https://drupal.org/project/project_module?page=$i" -O "$DATA_DIR/community-$i.html"
done
