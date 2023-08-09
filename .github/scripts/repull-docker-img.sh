#!/bin/bash
docker stop nest-server
docker rmi dahakalab/cosmetology-backend:latest
docker image pull dahakalab/cosmetology-backend:latest
docker run -d --rm --name nest-server -p 3000:3000 dahakalab/cosmetology-backend:latest