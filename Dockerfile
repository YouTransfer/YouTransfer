FROM node:0.12

MAINTAINER Remie Bolte (r.bolte@gmail.com)
LABEL version="1.0.5"

VOLUME /opt/youtransfer/config
VOLUME /opt/youtransfer/uploads

WORKDIR /opt/youtransfer/
RUN npm install youtransfer -g
RUN youtransfer init
RUN npm install

CMD npm run dockerized