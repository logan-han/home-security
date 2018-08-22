var config = {
  tableName: "home_security",
  collectionId: "home-securtiy-cam-face",
  telstra_clientId: "blah",
  telstra_Secret: "blah",
  sms_to_phone: "+61blah",
  sesRegion: "us-west-2",
  sesEndpoint: "https://email.us-west-2.amazonaws.com",
  email_to_address: "blah",
  email_from_address: "blah",
  image_prefix: "https://s3-ap-southeast-2.amazonaws.com/bucket/",
  notification_prefix: "Movement detected ",
  send_sms: "true",
  send_email: "true",
  debug: "true"
};

module.exports = config
