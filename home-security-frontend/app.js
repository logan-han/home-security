const express = require('express');
const app = express();
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dateTime = require('date-time');
const arraySort = require('array-sort');
const config = require("./config.js");

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

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

module.exports = app
