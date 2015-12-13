FROM node:0.12

MAINTAINER YouTransfer.io (info@youtransfer.io)
LABEL version="1.0.6"

VOLUME /opt/youtransfer/config
VOLUME /opt/youtransfer/uploads

WORKDIR /opt/youtransfer/
RUN npm install youtransfer -g
RUN youtransfer init
RUN npm install

EXPOSE 5000

CMD npm run dockerized
