var AWS = require("aws-sdk");
var s3 = new AWS.S3();
var rekognition = new AWS.Rekognition();
var docClient = new AWS.DynamoDB.DocumentClient();
var config = require("./config.js");

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
        if(labelData[0]["Name"]=="Human") return rekognizeFace(bucket, key).then(function(faceData) {
          if(faceData["FaceRecords"][0])
          {
            face = faceData["FaceRecords"][0]["Face"];
            faceDetail = faceData["FaceRecords"][0]["FaceDetail"];
          }
          return addToFacesTable()
        })
        else console.log("Not Human");
      }
      else console.log("Can't rekognize");
  }

      promise.then(function(data) {
      lambdaCallback(null, data)
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
    MinConfidence: 70
  };

  return rekognition.detectLabels(params).promise()
};
