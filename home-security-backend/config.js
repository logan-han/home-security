var config = {
  tableName: "home_security",
  collectionId: "home-securtiy-cam-face",
  telstra_clientId: "TELSTRA_CLIENT_ID",
  telstra_Secret: "TELSTRA_SECRET",
  sms_to_phone: "SMS_TO_PHONE",
  sesRegion: "us-west-2",
  sesEndpoint: "https://email.us-west-2.amazonaws.com",
  email_to_address: "EMAIL_TO_ADDRESS",
  email_from_address: "EMAIL_FROM_ADDRESS",
  image_prefix: "https://s3-ap-southeast-2.amazonaws.com/bucket/",
  notification_prefix: "Movement detected ",
  send_sms: false,
  send_email: false,
  MinConfidence: 80,
  debug: true
};

module.exports = config
