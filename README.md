# HSTS
Use two-way TLS handshake

Miguel Hernandez
mig220@csu.fullerton.edu

---

-----STEPS TO GENERATE CERTIFICATES USING RSA-----
1. Generate a key and certificate for the Certificate Authority:
	make sure to securely store the passphrase used to generate this cert
	as it will be used in later steps. In the included files, the pass phrase is
	gate.giving.surveyed.default.pictures
  
`openssl req -new -x509 -days 365 -keyout certauthkey.pem -out certauthcert.pem`

2. Generate a key for the server:

`openssl genrsa -out serverkey.pem 4096`

3. Generate a certificate signing request for the server

`openssl req -new -sha256 -key serverkey.pem -out servercertreq.pem`

4. Sign the server certificate request with the Certificate Authority's pass phrase

`openssl x509 -req -days 365 -in servercertreq.pem -CA certauthcert.pem -CAkey certauthkey.pem -CAcreateserial -out servercert.pem`

5. Generate key for client:

`openssl genrsa -out client1key.pem 4096`

6. Generate certificate signing request for client:

`openssl req -new -sha256 -key client1key.pem -out client1req.pem`

7. Sign the client certificate request with Certificate Authority's passphrase:

`openssl x509 -req -days 365 -in client1req.pem -CA certauthcert.pem -CAkey certauthkey.pem -CAcreateserial -out client1cert.pem`

8. Repeat Steps 5 through 7 for as many clients as needed

9. Create pkcs12 certificates for your browser:
	make sure to securely store the passphrase used to generate these files
	as they will be used in later steps. In the included files, the passphrases are
	atm1.pass	atm2.pass
  
`openssl pkcs12 -export -in client1cert.pem -inkey client1key.pem -out clientpkcs.p12`

10. Import the pkcs12 files into your browser

-----END-----

---

-----STEPS TO GENERATE CERTIFICATES USING DSA-----
1. Generate a key and certificate for the Certificate Authority:

`openssl req -new -x509 -days 365 -keyout certauthkey.pem -out certauthcert.pem`

2. Generate a DSA param file

`openssl dsaparam -out dsaparam.pem 1024`

3. Generate keys for clients and server
	Repeat for as many clients as needed.
  
`openssl gendsa -out key.pem dsaparam.pem`

4. Generate a certificate signing request for clients and server
	Repeat for as many clients as needed.
  
`openssl req -new -sha256 -key key.pem -out certreq.pem`

5. Sign the certificate requests with the Certificate Authority's pass phrase
	Repeat for as many clients as needed.
  
`openssl x509 -req -days 365 -in certreq.pem -CA certauthcert.pem -CAkey certauthkey.pem -CAcreateserial -out cert.pem`

6. Create pkcs12 certificates for your browser:
	make sure to securely store the passphrase used to generate these files
	as they will be used in later steps
  
`openssl pkcs12 -export -in client1cert.pem -inkey client1key.pem -out clientpkcs.p12`

7. Import the pkcs12 files into your browser

-----END-----

---

-----STEPS TO RUN APPLICATION-----
1. Install dependencies:

`npm i express bcrypt client-sessions mysql client-certificate-auth`

2. Edit the file `bankserver.js` to allow your certificates (line 41)
	The checkAuth function allows one to change how certificates are validated

3. Set up the MySql database:
	Note: the password for the dummy account is
	project.test.pass
 ```
CREATE DATABASE project;
USE project;
CREATE TABLE users (id CHAR(6) NOT NULL, password CHAR(60) NOT NULL, balance DECIMAL(65, 2), PRIMARY KEY (id));
GRANT ALL PRIVILEGES ON project.* TO 'server'@'localhost' IDENTIFIED BY 'fight.his.matching.college.petition';
INSERT INTO users VALUES ('123456', '$2b$10$z1mpUIyawbzxWmBJY87ztOTD788/cD.0r6JepERdWr4UKJZbTjO0K', 0.00);
```

4. Start the server:

`nodemon bankserver.js`

5. In a browser, go to:

`https://localhost:3000/`

6. A dialogue box will prompt you to choose a certificate,
	Choose one of the certificates you have previously imported.

------END-----

