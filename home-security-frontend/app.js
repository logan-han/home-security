const express = require('express');
const app = express();
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
var config = require("./config.js");

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.get('/', (req, res) => {
    var params = {
      TableName: config.tableName
    }
    dynamodb.scan(params, function(err, data) {
      if (err) {
        console.log(err);
      }
      else {
        console.log(JSON.stringify(data.Items));
        res.render('listall',{items : data.Items, config : config});
      }
    });
});

module.exports = app
