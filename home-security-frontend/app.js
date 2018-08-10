const express = require('express');
const app = express();
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dateTime = require('date-time');
var arraySort = require('array-sort');
var config = require("./config.js");

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.get('/', (req, res) => {
    var params = {
      TableName: config.tableName
    }
    dynamodb.scan(params, function(err, data) {
      if (err) console.log(err);
      else {
        for(var i = 0; i < data.Items.length; i++) data.Items[i].date = dateTime({date: new Date(data.Items[i].timestamp)});
        res.render('list',{items : arraySort(data.Items, 'timestamp', {reverse: true}), config : config});
      }
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
      else {
        res.render('detail',{items : data.Items, date : dateTime({date: new Date(data.Items[0].timestamp)}), config : config});
      }
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
        else {
          res.render('detail',{items : arraySort(data.Items, 'timestamp', {reverse: true}), date : dateTime({date: new Date(data.Items[0].timestamp)}), config : config});
        }
    });
});

module.exports = app
