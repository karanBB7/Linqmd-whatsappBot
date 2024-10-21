FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm install aws-sdk

COPY . .

EXPOSE 3002

CMD [ "node", "src/app.js" ]