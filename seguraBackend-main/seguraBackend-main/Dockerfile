# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory in the container
WORKDIR /home/ubuntu/backend

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies, including nodemon
RUN npm install --save-dev nodemon

# Copy the rest of your source code into the container
COPY . .

# Expose the port that your app listens on
EXPOSE 8080

# Define the command to run your application with nodemon
CMD [ "npx", "nodemon", "src/app.js" ]
