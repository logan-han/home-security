# Machine Learning Home Security
It's a small project runs surveillance camera image analysis using AWS Rekognition that I wrote for company preso.

Designed to capture email notification from Synology surveillance station and send SMS notification when human movement detected.

It also has MVP frontend web interface to display historic record.

Thanks to GitHub Actions, now supports (partial) auto build and deploy. 

# Deployment HOWTO

## backend
`claudia create --region ap-southeast-2 --handler index.handler --policies policy`
Need S3 PUT action trigger as well
## ses-mail-parser
`claudia create --region us-west-2 --handler index.handler --policies policy`
## frontend
`claudia create --region ap-southeast-2 --handler lambda.handler --deploy-proxy-api --policies policy`

## Create default collection
`aws rekognition create-collection --collection-id "<collection ID>"`

### Add SES Ruleset with two actions
```
Recipients
Your email address
Actions
1. S3 Action
Write to S3 bucket <your bucket> under the prefix <prefix>/
2. Lambda Action
Invoke Lambda function <ses-mail-parser> as Event
```

### email bucket should have bucket policy enabling SES write
```
{
   "Version": "2012-10-17",
   "Statement": [
       {
           "Sid": "GiveSESPermissionToWriteEmail",
           "Effect": "Allow",
           "Principal": {
               "Service": "ses.amazonaws.com"
           },
           "Action": "s3:PutObject",
           "Resource": "arn:aws:s3:::<bucket_name>/*",
           "Condition": {
               "StringEquals": {
                   "aws:Referer": "<AWS ACCOUNT ID>"
               }
           }
       }
   ]
}
```

### cognito integration
Create a user pool and app client. Then `OAuth 2.0` set to `Implicit grant`
