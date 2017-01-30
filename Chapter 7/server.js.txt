var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var moment = require('moment');
var Guid = require('guid');
var utils = require('./utils.js');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var DocumentClient = require('documentdb').DocumentClient;
var host = "https://botdb.documents.azure.com:443/";
var masterKey = "NpxDXr67utlhuknzEhRM5jWszGnBO8i9PkkdP78HVThx2DWhgCZyo2NZlVTzZWbkSSNJ1K7fRkNbCkgEkUHKgw==";
var docclient = new DocumentClient(host, { masterKey: masterKey });

var payloadm;

app.get('/', function (req, res) {
    res.send('This is my Facebook Messenger Bot - Whos Off Bot Server');
});

// for facebook verification
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'whosoffbot_verify_token') {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.status(403).send('Invalid verify token');
    }
});

app.post('/webhook', function (req, res) {
    var tday;
    var events = req.body.entry[0].messaging;
    for (i = 0; i < events.length; i++) {
        var event = events[i];

        if (event.message && event.message.text) {
             if (event.message.text.indexOf('hi') > -1) {
                sendMessageWithInitialOptions(event.sender.id);                
            } 
            else if (event.message.text.indexOf('@') > -1) {
                if (utils.isvalidateInput(event.message.text)) {
                    sendMessage(event.sender.id, { 'text': 'Sure! Let me set up your meeting for '+payloadm });
                    if (payloadm=='Today'){
                        tday = moment().format("MM/DD/YYYY");
                    }
                    else if (payloadm=='Tomorrow'){
                        tday = moment().add(1, 'day').format("MM/DD/YYYY");
                    }
                    processMeetingDetails(event.message.text, tday + ' ', event.sender.id);
                }
                else {
                    console.log('Invalid format!');
                    sendMessage(event.sender.id, { 'text': 'Pl. input meeting details e.g. Team Meeting@10:00to11:00' });
                }
            }
        }
          else if (event.postback && event.postback.payload) {
            payload = event.postback.payload;
            // Handle a payload from this sender
            console.log(JSON.stringify(payload));          
            if (payload == 'SCHEDULE A MEETING') {
                sendMessageWithScheduleOptions(event.sender.id);
            }
            else if (payload == 'SCHEDULETODAY') {
                payloadm='Today';
                sendMessage(event.sender.id, { 'text': 'Pl. provide meeting details e.g. Team Meeting@10:00to11:00' });
            }
            else if (payload == 'SCHEDULETOMORROW') {
                 payloadm='Tomorrow';
                 sendMessage(event.sender.id, { 'text': 'Pl. provide meeting details e.g. Team Meeting@10:00to11:00' });
            }            
            else if (payload=='WHOS OFF WHEN'){                               
                sendMessageWithAllScheduleOptions(event.sender.id);
            }
            else if (payload == 'ALLSCHEDULETODAY') {
                sendMessage(event.sender.id, 'Meeting(s) Scheduled for Today as..');
                var tilltonight = moment().add(1, 'day').startOf('day').unix();
                var startnow = moment().unix();               
                showWhosIsBusyWhen(event.sender.id, startnow, tilltonight);               
            }
            else if (payload == 'ALLSCHEDULETOMORROW') {
                sendMessage(event.sender.id, 'Meeting(s) Scheduled for tomorrow as..');
                var tilltomnight = moment().add(2, 'day').startOf('day').unix();
                var starttonight = moment().endOf('day').unix();                
                showWhosIsBusyWhen(event.sender.id, starttonight, tilltomnight);                
            }
        }

    }   
    res.sendStatus(200);
});

function sendMessageWithInitialOptions(recipientId) {
    messageData = {
        'attachment': {
            'type': 'template',
            'payload': {
                'template_type': 'button',
                'text': 'Pl. Select your options',
                'buttons': [{
                    'type': 'postback',
                    'title': 'Schedule a Meetting',
                    'payload': 'SCHEDULE A MEETING'
                }, {
                    'type': 'postback',
                    'title': 'Whos Off When',
                    'payload': 'WHOS OFF WHEN',
                }, {
                    'type': 'postback',
                    'title': 'My Schedule',
                    'payload': 'MY SCHEDULE'
                }]
            }
        }
    };
    sendMessage(recipientId, messageData);
};

function sendMessageWithScheduleOptions(recipientId) {
    messageData = {
        'attachment': {
            'type': 'template',
            'payload': {
                'template_type': 'button',
                'text': 'Select day to schedule a meeting',
                'buttons': [{
                    'type': 'postback',
                    'title': 'Today',
                    'payload': 'SCHEDULETODAY'
                }, {
                    'type': 'postback',
                    'title': 'Tomorrow',
                    'payload': 'SCHEDULETOMORROW',
                }]
            }
        }
    };
    sendMessage(recipientId, messageData);
};

function processMeetingDetails(str, todaysdate, recipientId) {
    var title, stime, etime, starttime, endtime, ownername

    //parsing input provided for extracting meeting information
    title = str.substring(0, str.indexOf('@'));
    stime = str.substring(title.length + 1, str.indexOf('to')) + ':00';
    etime = str.substring(str.indexOf('to') + 2, str.length) + ':00';

    starttime = moment(todaysdate + stime).unix();
    endtime = moment(todaysdate + etime).unix();

    console.log(starttime + ' to ' + endtime + ' title' + title);
    //function to get Fb User Name
    utils.getUserName(recipientId, function (d) {
        ownername = d;
        var objMeeting = new utils.meeting(Guid.raw(), recipientId, ownername, starttime, endtime, title)
        CheckMeetingsIfExistsOrInsert(objMeeting);
    });
}

function CheckMeetingsIfExistsOrInsert(objMeeting) {
    var querySpec = {
        query: 'SELECT * FROM Events b WHERE  (b.ownerid= @id) and (@start between b.startdatetime and b.enddatetime)',
        parameters: [
            {
                name: '@id',
                value: objMeeting.ownerid
            },
            {
                name: '@start',
                value: objMeeting.startdatetime
            }
        ]
    };

    docclient.queryDocuments('dbs/EventsDB/colls/Events', querySpec).toArray(function (err, results) {
        console.log(objMeeting.title);
        if (results.length === 0) {
            console.log('No data found' + objMeeting.title);
            var documentDefinition = {
                'id': objMeeting.id,
                'ownerid': objMeeting.ownerid,
                'owner': objMeeting.owner,
                'startdatetime': objMeeting.startdatetime,
                'enddatetime': objMeeting.enddatetime,
                'title': objMeeting.title
            };
            docclient.createDocument('dbs/EventsDB/colls/Events', documentDefinition, function (err, document) {
                if (err) return console.log(err);
                console.log('Created A Meeting with id : ', document.id);
                sendMessage(objMeeting.ownerid, { 'text': 'Meeting has been scheduled.' });
            });
        } else {
            console.log('Data found');
            sendMessage(objMeeting.ownerid, { 'text': 'Meeting exists for this schedule. Pl. schedule another time.' });
        }
    });
}

function sendMessageWithAllScheduleOptions(recipientId) {
    messageData = {
        'attachment': {
            'type': 'template',
            'payload': {
                'template_type': 'button',
                'text': 'Select your schedule for',
                'buttons': [{
                    'type': 'postback',
                    'title': 'Today',
                    'payload': 'ALLSCHEDULETODAY'
                }, {
                    'type': 'postback',
                    'title': 'Tomorrow',
                    'payload': 'ALLSCHEDULETOMORROW',    
                }]
            }
        }
    };
    sendMessage(recipientId, messageData);
};

function showWhosIsBusyWhen(recipientId,start, end) {
    var querySpec = {
        query: 'SELECT * FROM Events b WHERE  b.startdatetime<= @end and b.startdatetime>= @start ORDER BY b.startdatetime',
        parameters: [            
            {
                name: '@end',
                value: end
            },
            {
                name: '@start',
                value: start
            }
        ]
    };
    docclient.queryDocuments('dbs/EventsDB/colls/Events', querySpec).toArray(function (err, results) {
        if (results.length > 0) {
            sendMessageWithMeetingsOwnerInList(recipientId, results)
        }
    });
}

function sendMessageWithMeetingsOwnerInList(recipientId, results) {
    var card;
    var cards = [];
    var messageData;

    messageData = {
        attachment: {
            type: 'template',
            payload: {
                template_type: 'generic',
                elements: []
            }
        }
    };

    for (i = 0; i < results.length; i++) {
        card = {
            title: results[i].title,
            item_url: 'https://myorgmeetings.com/' + results[i].id,
            image_url: '',
            subtitle: 'Your confirmed meeting.',
            buttons: [
                {
                    type: 'web_url',
                    url: 'https://myorgmeetings.com/' + results[i].id,
                    title: utils.getFormattedDay(results[i].startdatetime)
                },
                 {
                    type: 'web_url',
                    url: 'https://myorgmeetings.com/' + results[i].id,
                    title: results[i].owner
                },
                {
                    type: 'web_url',
                    url: 'https://myorgmeetings.com/' + results[i].id,
                    title: utils.getFormattedTime(results[i].startdatetime, results[i].enddatetime)
                }
            ]
        };
        cards.push(card);
    }

    messageData.attachment.payload.elements = cards;
    sendMessage(recipientId, messageData);
};

function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: 'EAAQo1ecZCQhUBAD1JQubPmkFtq5VVvfKwdeovOZCjog4QSadk7fZCgfGx8qx52H1H8ZBQ9SrgM3DGBJ8Ypux50T4Pj9ZCAAtinFda8SftZCIH32YjFuYdIuIxsLeSBCCInhK9czUe3RSETnPZCQjAeZAE55L65XcXe4DCnjkuVeYLcnQhKOWkaLK' },
        method: 'POST',
        json: {
            recipient: { id: recipientId },
            message: message,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

app.listen((process.env.PORT || 8080));