var telegramBot = require('node-telegram-bot-api');
var sentiment = require('sentiment');

var token ='267449059:AAGzHJFlDkzOG5SxyOJJT2yHsiC06Ut6ySE';

var api = new telegramBot(token, {polling: true});

api.onText(/\/help/, function(msg, match) {
  var fromId = msg.from.id;
  api.sendMessage(fromId, "I can help you in getting the sentiments of any text you send to me.");
});

api.onText(/\/start/, function(msg, match) {
  var fromId = msg.from.id;
  api.sendMessage(fromId, "They call me MadansFirstTelegramBot. " + 
                          "I can help you in getting the sentiments of any text you send to me. "+
                          "To help you i just have few commands.\n/help\n/start\n/sentiments");
});

var opts = {
  reply_markup: JSON.stringify(
    {
      force_reply: true
    }
  )};

api.onText(/\/sentiments/, function(msg, match) {
  var fromId = msg.from.id;  
  api.sendMessage(fromId, "Alright! So you need sentiments of a text from me. "+
                          "I can help you in that. Just send me the text.", opts)
  .then(function (sended) {
    var chatId = sended.chat.id;
    var messageId = sended.message_id;
    api.onReplyToMessage(chatId, messageId, function (message) {
      //call a function to get sentiments here...
      var sentival = sentiment(message.text);
      api.sendMessage(fromId,"So sentiments for your text are, Score:" + sentival.score +" Comparative:"+sentival.comparative);
    });
  });                          
                          
});


console.log("MadansFirstTelegramBot has started. Start conversations in your Telegram.");

