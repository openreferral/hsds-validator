# Base image
FROM node:16

ADD package.json /tmp/package.json

# Create the root application directory
RUN mkdir /app

COPY . /app

RUN node --version

# Install app dependencies
RUN cd app && npm install

# Set the work directory
WORKDIR /app/src

# Expose the port
EXPOSE 1400

# Start the app
CMD node server.js

CMD [ "npm", "start" ]
