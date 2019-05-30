'use strict'

const express = require('express');
const https = require('https');
const clientCertificateAuth = require('client-certificate-auth');
const bcrypt = require('bcrypt');
const rounds = 10;
const session = require('client-sessions');
const mysql = require('mysql');
const bodyparser = require('body-parser');
const fs = require('fs');

//Establish a connection to the database
var db = mysql.createConnection({
	host: 'localhost',
	user: 'server',
	password: 'fight.his.matching.college.petition',
	database: 'project'
});
db.connect(function(err){
	if(err){
		console.log('Could not connect to db\n');
		throw err;
	}
	else{
		console.log('Connected to db\n');
	}
})

//https options
const options = {
	key: fs.readFileSync('serverkey.pem'),
	cert: fs.readFileSync('servercert.pem'),
	ca: fs.readFileSync('certauthcert.pem'),
	rejectUnauthorized: true,
	requestCert: true
}

//logic to check the authenticity of the client's certificate
//Edit this function to allow more/different certificates
var checkAuth = function(cert){
	var ret;
	if(cert.fingerprint === 'E7:91:D1:3E:E9:C4:A5:29:87:A0:22:94:B5:B7:7C:CE:28:3C:1E:4B'){
		ret = true;
	}
	else if(cert.fingerprint === 'CF:FD:A3:79:9C:21:81:F9:08:C9:73:E9:F3:E0:77:3D:71:4B:D7:77'){
		ret = true;
	}
	else{
		ret = false;
	}
	return ret;
}

var app = express();

app.use(bodyparser.urlencoded({ extended: true }));

app.use(clientCertificateAuth(checkAuth))

//cookies
app.use(session({
	cookieName: 'login',
	secret: 'called.revealed.ethics.loyal.networks',
	duration: 3 * 60 * 1000,
	activeDuration: 3 * 60 * 1000,
    httpOnly: true,
    secure: true,
    ephemeral: true
}));

app.get('/', function(req, res){
	req.login.reset();
	res.sendFile(__dirname + '/index.html');
});

app.post('/login', function(req, res){
	console.log(new Date() + '\nLogin attempt\nID: ' + req.body.id + '\nPW: ' + req.body.pswd);
	var prep = 'SELECT password FROM users WHERE id = ?';
	var insert = [req.body.id];
	prep = mysql.format(prep, insert);
	console.log('Sending this query to the db\n\t' + prep + '\n\n');
	
	db.query(prep, function(err, result){
		if(err){
			console.log('Error login query\n');
			throw err;
		}
		else{
			var dynHTML = '<!DOCTYPE html><html><head><title>Error</title></head><body><p>Could not log in.<br>Click <a href=\'/\'>here</a> to try again.</p></body></html>';
			if(Object.keys(result).length === 0){
				res.send(dynHTML);
			}
			else{
				bcrypt.compare(req.body.pswd, result[0].password, function(er, rslt){
					if(rslt === true){
						req.login.id = req.body.id;
						res.redirect('/options');
					}
					else{
						res.send(dynHTML);
					}
				});
			}
		}
	});
});

app.get('/options', function(req, res){
	if(req.login.id === undefined){
		res.redirect('/');
	}
	else{
		res.sendFile(__dirname + '/options.html');
	}
});

app.get('/balance', function(req, res){
	console.log(new Date() + '\nCheck Balance Attempt\n');
	if(req.login.id === undefined){
		res.redirect('/');
	}
	else{
		console.log('ID: ' + req.login.id);
		var prep = 'SELECT balance FROM users WHERE id = ?';
		var insert = [req.login.id];
		prep = mysql.format(prep, insert);
		console.log('Sending this query to the db\n\t' + prep + '\n\n');
		
		db.query(prep, function(err, result){
			if(err){
				console.log('Error balance query\n');
				throw err;
			}
			else{
				var dynHTML = '<!DOCTYPE html><html><head><title>Balance</title></head><body><p>Your balance is: <strong>' + result[0].balance + '</strong>.<br>Click <a href=\'/options\'>here</a> to go back.</p></body></html>';
				res.send(dynHTML);
			}
		});
	}
});

app.get('/withdraw', function(req, res){
	if(req.login.id === undefined){
		res.redirect('/');
	}
	else{
		var dynHTML = '<!DOCTYPE html><html><head><title>Withdraw</title></head><body><p><strong>Please Set an amount to withdraw:</strong></p><form action=\'/wr\' method=\'post\'><label>Amount: <input type=\'number\' name=\'amnt\' placeholder=\'Amount\' min=\'0\' step=\'0.01\' required></label><br><button type=\'submit\'>Submit</button></form><br>Click <a href=\'/options\'>here</a> to go back.</body></html>';
		res.send(dynHTML);
	}
});

app.post('/wr', function(req, res){
	console.log(new Date() + '\nWithdrawal attempt ');
	if(req.login.id === undefined){
		res.redirect('/');
	}
	else{
		var prep = 'SELECT balance FROM users WHERE id = ?';
		var insert = [req.login.id];
		prep = mysql.format(prep, insert);
		console.log('Sending this query to the db\n\t' + prep + '\n\n');
		
		db.query(prep, function(err, result){
			if(err){
				console.log('Error balance query for withdrawal\n');
				throw err;
			}
			else{
				var dynHTML;
				var sub = Number(result[0].balance) - Number(req.body.amnt);
				sub.toFixed(2);
				if(sub >= 0){
					var prp = 'UPDATE users SET balance = ? WHERE id = ?';
					var ins = [sub, req.login.id];
					prp = mysql.format(prp, ins);
					console.log('Sending this query to the db\n\t' + prp + '\n\n');
					
					db.query(prp, function(er, rslt){
						if(er){
							console.log('Error update query for withdrawal\n');
							throw er;
						}
						else{
							console.log('$' + sub);
							dynHTML = '<!DOCTYPE html><html><head><title>Results</title></head><body><p>You successfully withdrew <strong>$' + req.body.amnt + '</strong>.<br>Click <a href=\'/options\'>here</a> to go back.</p></body></html>';
							res.send(dynHTML);
						}
					});
				}
				else{
					dynHTML = '<!DOCTYPE html><html><head><title>Error</title></head><body><p>Insufficient Funds<br>Click <a href=\'/options\'>here</a> to try again.</p></body></html>';
					res.send(dynHTML);
				}
			}
		});
	}
});

app.get('/deposit', function(req, res){
	if(req.login.id === undefined){
		res.redirect('/');
	}
	else{
		var dynHTML = '<!DOCTYPE html><html><head><title>Deposit</title></head><body><p><strong>Please Set an amount:</strong></p><form action=\'/dr\' method=\'post\'><label>Amount: <input type=\'number\' name=\'amnt\' placeholder=\'Amount\' min=\'0\' step=\'0.01\' required></label><br><button type=\'submit\'>Submit</button></form><br>Click <a href=\'/options\'>here</a> to go back.</body></html>';
		res.send(dynHTML);
	}
});

app.post('/dr', function(req, res){
	console.log(new Date() + '\nDeposit attempt ');
	if(req.login.id === undefined){
		res.redirect('/');
	}
	else{
		var prep = 'SELECT balance FROM users WHERE id = ?';
		var insert = [req.login.id];
		prep = mysql.format(prep, insert);
		console.log('Sending this query to the db\n\t' + prep + '\n\n');
		
		db.query(prep, function(err, result){
			if(err){
				console.log('Error balance query for deposit\n');
				throw err;
			}
			else{
				var sub = Number(result[0].balance) + Number(req.body.amnt);
				sub.toFixed(2);
				var prp = 'UPDATE users SET balance = ? WHERE id = ?';
				var ins = [sub, req.login.id];
				prp = mysql.format(prp, ins);
				console.log('Sending this query to the db\n\t' + prp + '\n\n');
				
				db.query(prp, function(er, rslt){
					if(er){
						console.log('Error update query for deposit\n');
						throw er;
					}
					else{
						console.log('$' + sub);
						var dynHTML = '<!DOCTYPE html><html><head><title>Results</title></head><body><p>You successfully deposited <strong>$' + req.body.amnt + '</strong>.<br>Click <a href=\'/options\'>here</a> to go back.</p></body></html>';
						res.send(dynHTML);
					}
				});
			}
		});
	}
});

app.get('/exit', function(req, res){
	req.login.reset();
	res.redirect('/');
});

https.createServer(options, app).listen(3000);

