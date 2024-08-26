#!/bin/bash
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 290672292276.dkr.ecr.ap-southeast-2.amazonaws.com
