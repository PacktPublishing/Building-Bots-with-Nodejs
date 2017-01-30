var skype = require('botbuilder');
var express = require('express');
var azure = require('azure-storage');

var app = express();

var APP_ID = '';
var APP_SECRET = '';

var AZURE_ACCOUNT = '';
var AZURE_KEY = '';
var AZURE_TABLE = 'HolidaysHRBot';

var tableSvc = azure.createTableService(AZURE_ACCOUNT, AZURE_KEY);

var authenticated = false;
var holidays = false;
var sick = false;
var userId = '';
var userName = '';
var userEntity = undefined;

var botService = new skype.ChatConnector({
    appId: APP_ID,
    appPassword: APP_SECRET
});

var bot = new skype.UniversalBot(botService);

app.post('/api/messages', botService.listen());

userVerification = function(session) {
  session.send('Hey, let me verify your user id ' + userId + ' (' + userName + '), bear with me...');

  tableSvc.retrieveEntity(AZURE_TABLE, userId, userName, function entityQueried(error, entity) {
    if (!error) {
      authenticated = true;
      userEntity = entity;

      session.send('I have verified your id, how can I help you? Type a) for Holidays, b) for Sick Leave.');
    }
    else {
      session.send('Could not find: ' + userName + ', please make sure you use proper casing :)');
    }
  });
};

cleanUserId = function(userId) {
  var posi = userId.indexOf(':');
  return (posi > 0) ? userId.substring(posi + 1) : userId;
};

BotBrain = function(session) {
  var orig = session.message.text;
  var content = orig.toLowerCase();
  var from = session.message.user.name;
  
  if (authenticated) {
    if (content === 'a)') {
      holidays = true;
      session.send('Please indicate how many vacation days you will be requesting, i.e.: 3');
    }
    else if (content === 'b)') {
      sick = true;
      session.send('Please indicate how many sick days you will be requesting, i.e.: 2');
    }
    else if (content !== 'a)' && content !== 'b)') {
      if (holidays) {
        session.send(userName + '(' + userId + ')' + ', you have chosen to take ' + content + ' holiday(s). Session ended.');
        sick = false;
        authenticated = false;
      }
      else if (sick) {
        session.send(userName + '(' + userId + ')' + ', you have chosen to take ' + content + ' sick day(s). Session ended.');
        holidays = false;
        authenticated = false;
      }
      else if (!holidays && !sick) {
        session.send('I can only process vacation or sick leave requests. Please try again.');
      }
    }
  }
  else {
    authenticated = false, holidays = false, sick = false;
    userId = '', userName = '', userEntity = undefined;

    if (content === 'hi') {
      session.send('Hello ' + cleanUserId(from) + ', I shall verify your identify...');
      session.send('Can you please your provide your FirstName-LastName? (please use the - between them)');
    }
    else if (content !== '') {
      userId = cleanUserId(from);
      userName = orig;

      if (userName.indexOf('-') > 1) {
        userVerification(session);
      }
      else {
        session.send('Hi, please provide your FirstName-LastName (please use the - between them) or say hi :)');
      }
    }
  }
};

bot.dialog('/', function (session) {
  BotBrain(session);
});

app.get('/', function (req, res) {
  res.send('SkypeBot listening...');
});

//app.listen(3979, function () {
app.listen(process.env.port, function () {
  console.log('SkypeBot listening...');
});
