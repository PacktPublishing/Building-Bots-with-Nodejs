var twilio = require("twilio");
var express = require('express');

var accountSid = '<< Your Twilio Account SID >>'; // Your Account SID from www.twilio.com/console
var authToken = '<< Your Twilio Auth Token >>';   // Your Auth Token from www.twilio.com/console

var client = new twilio.RestClient(accountSid, authToken);
var app = express();

app.post('/receive', function (request, response) {
  var twiml = new twilio.TwimlResponse();
  twiml.message(request.body.From);

  response.writeHead(200, {'Content-Type': 'text/xml'});
  response.end(twiml.toString());
});

app.get('/send', function (req, res) {
  client.messages.create({
      body: 'Hi, this is TwilioBot',
      to: '+14806000000',  // Text this number - please replace with your own
      from: '+14805000000' // From a valid Twilio number - please replace with your own
  }, function(err, message) {
      res.send('This is the message id sent: ' + message.sid);
  });
});

app.listen(process.env.port, function () {
  console.log('TwilioBot listening...');
});
