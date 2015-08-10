# YouTransfer

YouTransfer is a simple but elegant self-hosted file transfer & sharing solution. It is an alternative to paid services like [Dropbox](http://dropbox.com) and [WeTransfer](http://wetransfer.com) by offering similar features but without limitations, price plans and a lengthy privacy policy. You remain in control of your files.

## Installation

### Docker

The easiest way to install YouTransfer in your own environment is to use the [Docker image](http://hub.docker.com/r/remie/youtransfer/):

`docker pull remie/youtransfer`

You can run the application with the following command:

`docker run -d -v [path_to_upload_folder]:/opt/youtransfer/uploads -v [path_to_settings.json]:/opt/youtransfer/settings.json -p 80:80 remie/youtransfer`

You can now connect to YouTransfer by browsing to http://[docker_host_ip]/

### NodeJS

If you wish to run YouTransfer directly from source, you will need to install [NodeJS](http://nodejs.org). 

Download the latest release zip file from [GitHub](https://github.com/remie/YouTransfer/releases) or clone the repository from https://github.com/remie/YouTransfer.git

To install YouTransfer, run `npm install && npm run dist`.
After installation, start YouTransfer using `PORT=[port] node app.js`.

You can now connect to YouTransfer by browsing to http://localhost:[port]/

## Usage

### Hosting

#### Ngrok

The easiest way to host YouTransfer from your local system is to use [Ngrok](http://ngrok.com). This will create a secure tunnel between your computer and the NGrok servers, exposing the YouTransfer application to the outside world. 

NGrok offers secure connections using SSL, which is highly recommended.

#### Reverse Proxy

If you are hosting YouTransfer on your own servers, it is recommended that you add a reverse proxy in front of the application. There are several solutiona available, like [HAProxy](http://www.haproxy.org), [Nginx](http://nginx.org) or [Apache Httpd](http://httpd.apache.org). 

A reverse proxy can be configured to support SSL, access rules and other security features which are not part of YouTransfer.

### Uploading & sharing files

This should be the easy part :)

You can upload the files using drag & drop (depending on browser support) or by using the file input field on the form. Uploading will start automatically. As soon as the file has been transferred succesfully, a file-specific token will be provided. You can use this token to download the file to your computer. 

File sharing is done by publishing the access token.

#### Browser compatibility

YouTransfer will always work with the latest version of any major browser, and will try to support up to three prior versions. There is one exception: drag & drop support for file uploading. This relies on HTML5 and more specifically the ability for data transfer. See the DropzoneJS [compatibility chart](http://www.dropzonejs.com/#browser-support) for more information.

## Contributors

- [Remie Bolte](https://github.com/remie)

You can contribute by forking the project and sending pull requests. If you do, please don't forget to add your name to this list!

## License & other legal stuff

Copyright 2015 Collabsoft

Licensed under the Apache License, Version 2.0 (the "License");
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

### Important usage notice

The YouTransfer project relies heavily on 3rd party Open Source projects. These projects all have their own licenses. Although commercial use of the YouTransfer project is permitted under the Apache 2.0 license, this right is limited to the "original content" created as part of this project. Please make sure you check the licenses of all 3rd party components. The YouTransfer project cannot be held responsible for non-compliance with 3rd party licenses when using this application. The use of 3rd party projects is listed in the dependency section of the `package.json` or inline in the code (when applicable).
