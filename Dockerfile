FROM node:0.10

ADD ./lib /opt/youtransfer/lib/
ADD ./src /opt/youtransfer/src/
ADD ./*.js* /opt/youtransfer/
ADD ./LICENSE /opt/youtransfer/LICENSE
ADD ./README.md /opt/youtransfer/README.md
ADD ./start /opt/youtransfer/start.sh
VOLUME /opt/youtransfer/uploads

WORKDIR /opt/youtransfer/
RUN npm install ; npm run dist

CMD ./start.sh