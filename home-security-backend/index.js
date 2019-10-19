const config = require("./config.js");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition();
const SES = new AWS.SES({region: config.sesRegion, endpoint: config.sesEndpoint});
const docClient = new AWS.DynamoDB.DocumentClient();
const TelstraMessaging = require('Telstra_Messaging');

var lambdaCallback, bucket, key;

exports.handler = function(event, context, callback) {
  lambdaCallback = callback
  bucket = event.Records[0].s3.bucket.name;
  key = event.Records[0].s3.object.key;
  var promise = rekognizeLabels(bucket, key).then(isHuman);
  function isHuman(data) {
      if(data["Labels"][0])
      {
        labelData = data["Labels"];
        if (config.debug) console.log(key + " = " + labelData[0]["Name"]);
        if(labelData[0]["Name"]=="Person") return rekognizeFace(bucket, key).then(function(faceData) {
          if(faceData["FaceRecords"][0])
          {
            face = faceData["FaceRecords"][0]["Face"];
            faceDetail = faceData["FaceRecords"][0]["FaceDetail"];
          }
          if (config.send_email) send_email(key);
          if (config.send_sms) send_sms(key);
          return addToFacesTable()
        })
        else console.log("Not Human");
      }
      else console.log("Can't rekognize");
  }
      promise.then(function(data) {
      lambdaCallback(null, data);
    }).catch(function(err) {
      lambdaCallback(err, null);
    });
};

function addToFacesTable() {
  let params = {
    TableName: config.tableName,
    Item: {
      filename: key.split("/")[1],
      timestamp: new Date().getTime()
    }
  };
  if(typeof faceDetail !== 'undefined' && faceDetail) {
      if (config.debug) console.log("faceId: ", face["FaceId"]);
      params.Item.faceId = face["FaceId"];
      params.Item.emotionType1 = faceDetail["Emotions"][0].Type;
      params.Item.emotionConf1 = faceDetail["Emotions"][0].Confidence;
      params.Item.emotionType2 = faceDetail["Emotions"][1].Type;
      params.Item.emotionConf2 = faceDetail["Emotions"][1].Confidence;
      params.Item.ageLow = faceDetail["AgeRange"].Low;
      params.Item.ageHigh = faceDetail["AgeRange"].High;
      params.Item.genderValue = faceDetail["Gender"].Value;
      params.Item.genderConf = faceDetail["Gender"].Confidence;
  }

  return docClient.put(params).promise()
};

function rekognizeFace(bucket, key) {
  let params = {
    CollectionId: config.collectionId,
    DetectionAttributes: ["ALL"],
    Image: {
      S3Object: {
        Bucket: bucket,
        Name: key
      }
    }
  };

  return rekognition.indexFaces(params).promise()
};

function rekognizeLabels(bucket, key) {
  let params = {
    Image: {
      S3Object: {
        Bucket: bucket,
        Name: key
      }
    },
    MaxLabels: 1,
    MinConfidence: config.MinConfidence
  };

  return rekognition.detectLabels(params).promise()
};

function send_sms(key)
{
  var AuthAPI = new TelstraMessaging.AuthenticationApi();
  var defaultClient = TelstraMessaging.ApiClient.instance;
  var auth = defaultClient.authentications['auth'];
  var SMSAPI = new TelstraMessaging.MessagingApi();
  var sendSMSrequest = new TelstraMessaging.SendSMSRequest();
  sendSMSrequest.to = config.sms_to_phone;
  sendSMSrequest.body = config.notification_prefix + config.image_prefix + key;
  AuthAPI.authToken(config.telstra_clientId, config.telstra_Secret, "client_credentials",
  function(error, data, response) {
    if (error) console.error(error);
    else {
          auth.accessToken = data['access_token'];
          if (config.debug) console.log("AccessToken: " + data['access_token']);
          return SMSAPI.sendSMS(sendSMSrequest,
          function(error, data, respones) {
            if (error) console.error(error);
            else if (config.debug) console.log("SMS: " + JSON.stringify(data));
          });
        }
  });
};

function send_email(key)
{
  AWS.config.update({region: 'us-west-2'});
  let params = {
    Destination: {
      ToAddresses: [
        config.email_to_address,
      ]
    },
    Message: {
      Body: {
        Text: {
          Charset: "UTF-8",
          Data: config.notification_prefix + config.image_prefix + key
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: config.notification_prefix
      }
    },
    Source: config.email_from_address
  };
  return SES.sendEmail(params,
  function(error, data, response) {
    if (error) console.error(error);
    else if (config.debug) console.log("EMAIL: " + JSON.stringify(data));
  });
};
