#!/bin/bash

# Define the Docker container and image names
container_name="backend"  # Update this to your container name with the tag
image_name="290672292276.dkr.ecr.ap-southeast-2.amazonaws.com/seguro_back_prod:latest"

# Check if the container exists and if it is running
if [ "$(docker ps -aq -f name=$container_name)" ]; then
    # Stop and remove the existing container
    docker stop $container_name
    docker rm $container_name
else
    echo "Container $container_name does not exist or is not running. Failover logic goes here..."
fi

# Remove the associated image
if docker rmi $image_name 2>/dev/null; then
    echo "Image $image_name removed successfully."
else
    echo "Failed to remove image $image_name. Failover logic goes here..."
fi

echo "Script finished."
