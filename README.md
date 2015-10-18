# YouTransfer

[![GitHub version](https://badge.fury.io/gh/remie%2Fyoutransfer.svg)](http://badge.fury.io/gh/remie%2Fyoutransfer) [![npm version](https://badge.fury.io/js/youtransfer.svg)](http://badge.fury.io/js/youtransfer) [![Build Status](https://travis-ci.org/remie/YouTransfer.svg?branch=master)](https://travis-ci.org/remie/YouTransfer) [![Code Climate](https://codeclimate.com/github/remie/YouTransfer/badges/gpa.svg)](https://codeclimate.com/github/remie/YouTransfer) [![Test Coverage](https://codeclimate.com/github/remie/YouTransfer/badges/coverage.svg)](https://codeclimate.com/github/remie/YouTransfer/coverage) [![Dependency Status](https://david-dm.org/remie/youtransfer.svg)](https://david-dm.org/remie/youtransfer) [![devDependency Status](https://david-dm.org/remie/youtransfer/dev-status.svg)](https://david-dm.org/remie/youtransfer#info=devDependencies) [![License](https://img.shields.io/github/license/remie/youtransfer.svg)](http://www.apache.org/licenses/LICENSE-2.0) [![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/remie/YouTransfer?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

YouTransfer is a simple but elegant self-hosted file transfer & sharing solution. It is an alternative to paid services like [Dropbox](http://dropbox.com) and [WeTransfer](http://wetransfer.com) by offering similar features but without limitations, price plans and a lengthy privacy policy. You remain in control of your files.

Created to be installed behind the firewall on private servers, YouTransfer aims to empower organisations and individuals that wish to combine easy-to-use file transfer tooling with security and control.

You can follow the project on [Twitter](https://twitter.com/youtransfer), or [read our blog](http://blog.youtransfer.io). 

## Demo

A live demo of YouTransfer is available on http://demo.youtransfer.io  
The demo is [somewhat limited](https://github.com/remie/YouTransfer/wiki/Demo) so it is recommended to run it locally (see quick start section below).

## Documentation

### Quick Start using Docker

If you wish to install YouTransfer in your own environment without any modifications, the [Docker image](http://hub.docker.com/r/remie/youtransfer/) is the most quick and easy approach. Simply [install docker](https://docs.docker.com/installation/) and run:

`docker pull remie/youtransfer:stable`

You can run the application with the following command:

````
docker run -d 
-v [path_to_upload_folder]:/opt/youtransfer/uploads 
-v [path_to_config_folder]:/opt/youtransfer/config 
-p 80:5000 
remie/youtransfer:stable
````

You can now connect to YouTransfer by browsing to http://[docker_host_ip]/  
For more information on Docker deployment, please read the [Docker installation instructions](https://github.com/remie/YouTransfer/wiki/docker).

### Additional documentation

You can find additional documentation (incl. installation and usage instructions) on the [GitHub Wiki](https://github.com/remie/YouTransfer/wiki)

## Contributors

- [Remie Bolte](https://github.com/remie)

You can contribute by forking the project and sending pull requests.  
If you do, please don't forget to add your name to this list!

## License & other legal stuff

Licensed under the Apache License, Version 2.0 (the "License");
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

### Important usage notice

The YouTransfer project relies heavily on 3rd party Open Source projects. These projects all have their own licenses. Although commercial use of the YouTransfer project is permitted under the Apache 2.0 license, this right is limited to the "original content" created as part of this project. Please make sure you check the licenses of all 3rd party components. The YouTransfer project cannot be held responsible for non-compliance with 3rd party licenses when using this application. The use of 3rd party projects is listed in the dependency section of the `package.json` or inline in the code (when applicable).  

<img src="http://youtransfer.io/assets/holland.png" alt="Founded in Holland" width="150">  
[Made in Amsterdam](http://www.iamsterdam.com/en/business/startupamsterdam), with ♥
