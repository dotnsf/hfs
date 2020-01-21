# HFS(Hash File Storage)

## Overview

File Storage with content's hash value management.


## Pre-requisites

You need [IBM Cloud](https://cloud.ibm.com/) account and [IBM Cloudant](https://www.ibm.com/jp-ja/cloud/cloudant) service instance.

You also need Web application server with [Node.js](https://nodejs.org/) installed.

You may choose one of following settings before running application:

- Bind your web application runtime and IBM Cloudant instance in your IBM Cloud dashboard.

- Find your credentials in your IBM Cloudant, and edit **settings.js** with them.

- If you are going to run your application **NOT** in localhost, you can edit **public/doc/swagger.yaml** file with your server's hostname.


## Install & Run

- `$ npm install`

- `$ node app`


## Sample application

https://localhost:3000/


## Swagger API doc

https://localhost:3000/doc/


## Refererence

https://github.com/dotnsf/cfs


## Licensing

This code is licensed under MIT.


## Copyright

2020 K.Kimura @ Juge.Me all rights reserved.
