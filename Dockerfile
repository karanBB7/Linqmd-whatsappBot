FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm install aws-sdk

COPY . .

# We'll use an environment variable to determine which app to run
EXPOSE 3002 3005

CMD [ "sh", "-c", "node src/${APP_FILE}" ]