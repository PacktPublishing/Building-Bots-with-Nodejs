var TwitterPackage = require('twitter');
var secret = require("./secret");
var Twitter = new TwitterPackage(secret);
var request = require('request');

padLeft = function (str, paddingChar, length) {
  var s = new String(str);

  if ((str.length < length) && (paddingChar.toString().length > 0))
  {
      for (var i = 0; i < (length - str.length) ; i++)
        s = paddingChar.toString().charAt(0).concat(s);
  }

  return s;
};

GetDate = function() {
  var dateObj = new Date();
  var month = dateObj.getUTCMonth() + 1; //months from 1-12
  var day = dateObj.getUTCDate();
  var year = dateObj.getUTCFullYear();

  return year + '-' + padLeft(month.toString(), '0', 2) + '-' + padLeft(day.toString(), '0', 2);
};

FlightNumberOk = function(str) {
  var posi = str.indexOf('KL');
  var fn = str.substring(posi);
  return (posi >= 0 && fn.length === 6) ? fn : '';
};

var fd = '';

GetFlightDetails = function(fn) {
  var dt = GetDate();
  var rq = 'http://fox.klm.com/fox/json/flightstatuses?flightNumber=' + fn + '&departureDate=' + dt;

  request(rq, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      fd = body;
    }
  })
};

Twitter.stream('statuses/filter', {track: '#FlightBot'}, function(stream) {

  stream.on('data', function(tweet) {
    var statusObj = {status: "Hi @" + tweet.user.screen_name + ", Thanks for reaching out. We are missing the flight number."};

    var fn = FlightNumberOk(tweet.text);

    if (fn !== '') {
      GetFlightDetails(fn);
    }

    setTimeout(function() {
      console.log ('fd: ' + fd);

      if (fd !== undefined) {
        var ff = JSON.parse(fd);
        statusObj = {status: "scheduledArrivalDateTime: "  + ff.flights[0].operatingFlightLeg.scheduledArrivalDateTime};
      }

      Twitter.post('statuses/update', statusObj,  function(error, tweetReply, response) {
        if (error){
          console.log(error);
        }
        console.log(tweetReply.text);
      });
    }, 1500);
  });

  stream.on('error', function(error) {
    console.log(error);
  });
});
