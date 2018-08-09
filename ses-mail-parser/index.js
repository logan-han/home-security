var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var simpleParser = require('mailparser').simpleParser;
var config = require("./config.js");

exports.handler = function(event, context) {
    if (config.debug) console.log("New event: ", JSON.stringify(event));


   if (event.Records === null) {
        context.fail("Error: no records found");
        return;
    } else if (event.Records.length !== 1) {
        context.fail("Error: wrong # of records - we expect exactly one");
        return;
    }

    var message = event.Records[0].ses;

    if (message.mail.messageId === null) {
        context.fail("Error: mail.messageId is missing");
        return;
    } else if (message.receipt.action.type !== "Lambda") {
        context.fail("Error: mail action is not Lambda");
        return;
    }

    if (config.debug) console.log("Fetching message from " + config.fromPath + message.mail.messageId);

   s3.getObject({
        Bucket: config.fromBucket,
        Key: config.fromPath + message.mail.messageId,
    }, function(err, data) {
          if (err) {
              console.log(err);
              context.fail("Error: Failed to load message from S3");
              return;
          }
        simpleParser(data.Body, (err, mail)=>{
          if (mail.attachments) {
            if (config.debug) console.log("Store Image Into " + config.toPath + message.mail.messageId + ".jpg");
            s3.putObject({
                Bucket: config.toBucket,
                Key: config.toPath + message.mail.messageId + ".jpg",
                Body: mail.attachments[0].content
            }, function(err, data) {
                  if (err) {
                      console.log(err);
                      context.fail("Error: Failed to store the file into S3");
                      return;
                  }
                });
            }
            else context.fail("No attachment found");
          });
        }
    );
};
