#!/bin/bash

docker run -d -p 3000:3000 --name frontend 290672292276.dkr.ecr.ap-southeast-2.amazonaws.com/seguro_front_prod:latest
echo "y" | docker image prune
