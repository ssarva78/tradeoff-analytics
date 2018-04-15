FROM node:boron

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app
RUN npm install

COPY *.js /usr/src/app/
COPY *.proto /usr/src/app/
COPY *.html /usr/src/app/

EXPOSE 20001 20002 20003

CMD ["npm", "start"]

