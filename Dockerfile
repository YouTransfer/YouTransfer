FROM node:0.12

MAINTAINER Remie Bolte (r.bolte@gmail.com)
LABEL version="0.0.7"

ADD ./bin /opt/youtransfer/bin/
ADD ./lib /opt/youtransfer/lib/
ADD ./src /opt/youtransfer/src/
ADD ./*.js* /opt/youtransfer/
ADD ./LICENSE /opt/youtransfer/LICENSE
ADD ./README.md /opt/youtransfer/README.md
ADD ./start /opt/youtransfer/start.sh
VOLUME /opt/youtransfer/uploads

WORKDIR /opt/youtransfer/
RUN npm install ; npm run dist

CMD npm run app