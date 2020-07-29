const config = require("./config.js");
const express = require('express');
const CognitoExpress = require("cognito-express");
const cookieParser = require('cookie-parser');
const app = express();
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const moment = require('moment-timezone');
const arraySort = require('array-sort');

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
  if (!accessTokenFromClient && !req.path.startsWith('/login')) return res.redirect('/login');
  cognitoExpress.validate(accessTokenFromClient, function(err, response) {
    if (err && !req.path.startsWith('/login')) return res.redirect('/login');
    res.locals.user = response;
    next();
  });
});


app.get('/', (req, res) => {
  var scanRange = moment().subtract(config.daystoScan, 'days').valueOf();
  var params = {
    TableName: config.tableName,
    FilterExpression: "#ts > :scanRange",
    ExpressionAttributeNames:{
      "#ts" : "timestamp"
    },
    ExpressionAttributeValues: {
      ":scanRange": scanRange
    }
  }
  dynamodb.scan(params, function(err, data) {
    if (err) return res.status(500).send(err);
    else return res.render('list',{items : arraySort(data.Items, 'timestamp', {reverse: true}), moment : moment, config : config});
  });
});

app.get('/by-date/:date', (req, res) => {
  var tsTo = moment.tz(req.params.date,config.timeZone).add(1, 'days').valueOf();
  var tsFrom = moment.tz(req.params.date,config.timeZone).valueOf();
  var params = {
    TableName: config.tableName,
    FilterExpression: "#ts > :tsFrom AND #ts < :tsTo",
    ExpressionAttributeNames:{
      "#ts" : "timestamp"
    },
    ExpressionAttributeValues: {
      ":tsFrom": tsFrom,
      ":tsTo": tsTo
    }
  }
  dynamodb.scan(params, function(err, data) {
    if (err) return res.status(500).send(err);
    else return res.render('list',{items : arraySort(data.Items, 'timestamp', {reverse: true}), date : req.params.date, moment : moment, config : config});
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
    if (err) return res.status(500).send(err);
    else return res.render('detail',{items : data.Items, moment : moment, config : config});
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
    if (err) return res.status(500).send(err);
    else return res.render('detail',{items : arraySort(data.Items, 'timestamp', {reverse: true}), moment : moment, config : config});
  });
});

app.get('/login', function (req, res, next) {
  res.render("login", {config: config}, function (err,html) {
      return res.send(html);
    });
});

app.get('/logout', function (req, res, next) {
  res.cookie("id_token", "", {expires: new Date(0), path: '/'});
  res.cookie("access_token", "", {expires: new Date(0), path: '/'});
  res.render("logout", {config: config}, function (err,html) {
    return res.send(html);
  });
});

module.exports = app
