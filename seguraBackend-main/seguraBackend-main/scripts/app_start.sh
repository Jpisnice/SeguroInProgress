#!/bin/bash

docker run -d -p 8080:8080 --name backend 290672292276.dkr.ecr.ap-southeast-2.amazonaws.com/seguro_back_prod:latest

echo "y" | sudo docker image prune
