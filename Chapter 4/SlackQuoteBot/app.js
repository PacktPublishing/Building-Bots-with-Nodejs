var Bot = require('slackbots');
var rq = require('request');

var token = '';

var settings = {
    token: '',
    name: 'quotebot'
};

var bot = new Bot(settings);

isChatMsg = function (msg) {
    return msg.type === 'message';
};

isFromQuoteBot = function (msg) {
    return msg.username === 'quotebot';
};

isMentioningQuote = function (msg) {
    return msg.text.toLowerCase().indexOf('getquote') > -1;
};

replyWithRandomQuote = function (bot, oMsg) {
  var options = {
	url: 'https://theysaidso.p.mashape.com/quote?query=software',
	headers: {
		'User-Agent': 'request',
		'X-Mashape-Key': token
	}
  };
  
  rq(options, function (error, response, body) {
	
    if (!error && response.statusCode == 200) {
	  bot.postMessageToChannel(bot.channels[0].name, body);
    }
  })
};

bot.on('message', function (msg) {
    if (isChatMsg(msg) &&
        !isFromQuoteBot(msg) &&
        isMentioningQuote(msg)) {
        replyWithRandomQuote(bot, msg);
    }
});
