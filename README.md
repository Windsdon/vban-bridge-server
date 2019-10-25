# vban-bridge-server
This is the server-side for the vban-bridge. 
It acts as a hub where clients can connect and share audio streams.

The UDP packets from VBAN are encapsulated in a secure TLS connection and sent to the server,
which in turn sends the data to all connected clients.

The clients can then re-emit those UDP packages locally, creating a virtual network.

## Certificates
The communication is encrypted with TLS. The certificate and key must be generated
and stored in the config folder, following this structure:

```
- config
| - server.crt
| - server.key
``` 

You can follow [this guide](https://blog.pinterjann.is/ed25519-certificates.html) 
to generate ED25519 certificates. The configuration file is already provided.

```shell script
cd config
openssl genpkey -algorithm ED25519 > server.key
openssl req -new -out server.csr -key server.key -config openssl-25519.cnf
openssl x509 -req -days 9999 -in server.csr -signkey server.key -out server.crt
``` 

## Password
The password can be configured in the `config/config.json` file. 
Clients must use this password when they first connect to the server.
Following connections do not require typing the password, as the client's
identity is saved on the server.

## Running
Steps to get the server up and running:
* Clone this repository
* Generate the server certificates
* Change the relevant configurations
* Run `npm install`
* Run `npm run compile` to compile the Typescript source
* Run `npm start`