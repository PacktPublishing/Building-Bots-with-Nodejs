//Test Meeting@11:00to12:00
var moment = require('moment');
var https = require('https');

function isvalidateInput(str) {
    var pattern = /^\w+[a-z A-Z_]+?\@[0-9]{1,2}\:[0-9]{1,2}\w[to][0-9]{1,2}:[0-9]{1,2}$/;
    if (str.match(pattern) == null) {
        return false;
    } else {
        return true;
    }

};
exports.isvalidateInput = isvalidateInput;

function getFormattedTime(tsfrom, tsto) {
    var timeString = moment.unix(tsfrom).format("HH:mm") + ' - ' + moment.unix(tsto).format("HH:mm")
    return timeString;
};
exports.getFormattedTime =getFormattedTime;

function getFormattedDay(tsfrom) {
    var dateString = moment.unix(tsfrom).format("MMM, DD");
    return dateString;
};
exports.getFormattedDay =getFormattedDay;

function meeting(id,recipientId,ownername,strstartdatetime,strenddatetime,strtitle){    
     this.id=id;
     this.ownerid=recipientId;
     this.owner=ownername;
     this.startdatetime=strstartdatetime;
     this.enddatetime=strenddatetime;
     this.title=strtitle;             
};
exports.meeting =meeting;

function getUserName(uid,callback){
    https.get("https://graph.facebook.com/v2.6/" + uid + "?fields=first_name,last_name&access_token=EAAQo1ecZCQhUBAD1JQubPmkFtq5VVvfKwdeovOZCjog4QSadk7fZCgfGx8qx52H1H8ZBQ9SrgM3DGBJ8Ypux50T4Pj9ZCAAtinFda8SftZCIH32YjFuYdIuIxsLeSBCCInhK9czUe3RSETnPZCQjAeZAE55L65XcXe4DCnjkuVeYLcnQhKOWkaLK", function(res) {  
        var d = '';  
        var i;  
        arr = [];  
        res.on('data', function(chunk) {  
            d += chunk;  
        });  
        res.on('end', function() {  
            var e = JSON.parse(d);  
            callback(e.first_name);           
        });  
    });  
};
exports.getUserName =getUserName;
 
