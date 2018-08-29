const express = require('express');
const CognitoExpress = require("cognito-express");
const cookieParser = require('cookie-parser');
const app = express();
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dateTime = require('date-time');
const arraySort = require('array-sort');
const config = require("./config.js");

const cognitoExpress = new CognitoExpress({
    region: config.cognitoRegion,
    cognitoUserPoolId: config.cognitoUserPoolId,
    tokenUse: "id",
    tokenExpiration: 3600000
});

app.use(cookieParser());

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(function(req, res, next) {
  let accessTokenFromClient = req.cookies.id_token;
  if (!accessTokenFromClient) res.render("login",{config : config});
  cognitoExpress.validate(accessTokenFromClient, function(err, response) {
    if (err) {
      res.cookie("id_token", "", {expires: new Date(0), path: '/'});
      res.cookie("access_token", "", {expires: new Date(0), path: '/'});
      return res.status(401).send(err);
    }
    res.locals.user = response;
    next();
  });
});


app.get('/', (req, res) => {
  var params = {
    TableName: config.tableName
  }
  dynamodb.scan(params, function(err, data) {
    if (err) console.log(err);
    else res.render('list',{items : arraySort(data.Items, 'timestamp', {reverse: true}), dateTime : dateTime, config : config});
  });
});

app.get('/by-filename/:filename', (req, res) => {
  var params = {
    TableName: config.tableName,
    FilterExpression: "filename = :filename",
    ExpressionAttributeValues: {
      ":filename": req.params.filename
    }
  }
  dynamodb.scan(params, function(err, data) {
    if (err) console.log(err);
    else res.render('detail',{items : data.Items, dateTime : dateTime, config : config});
  });
});

app.get('/by-faceId/:faceId', (req, res) => {
  var params = {
    TableName: config.tableName,
    FilterExpression: "faceId = :faceId",
    ExpressionAttributeValues: {
      ":faceId": req.params.faceId
    }
  }
  dynamodb.scan(params, function(err, data) {
    if (err) console.log(err);
    else res.render('detail',{items : arraySort(data.Items, 'timestamp', {reverse: true}), dateTime : dateTime, config : config});
  });
});

app.get('/logout', function (req, res, next) {
  res.cookie("id_token", "", {expires: new Date(0), path: '/'});
  res.cookie("access_token", "", {expires: new Date(0), path: '/'});
  res.render('logout',{config : config});
});

module.exports = app
