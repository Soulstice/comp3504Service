var express = require('express');
var bodyParser = require('body-parser');
var http = require("http");


var dbConnection = require("tedious").Connection;
var dbRequest = require("tedious").Request;
var dbTypes = require("tedious").Type;


var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
//app.set('',config.secret);

var server = http.createServer(app);


app.use(function(req, res, next) { 
    res.header("Access-Control-Allow-Origin", "*"); 
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept"); 
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    next(); 
    
});


var config = {
    userName: 'soniafollowers@comp3504app',
    password: 'SF3504app',
    server: 'comp3504app.database.windows.net',
    options: {
        encrypt: true,
        database: 'UniBluDB',
        rowCollectionOnRequestCompletion: true,
        useColumnNames: true
    }
};

var connection = new dbConnection(config);  
connection.on('connect', function(err) {  
// If no error, then good to proceed.  
    if (err) {
        console.log(err);
    }
    else    
        console.log("Connected");  
});  

//Begin routes
//course dump
//TO DO: decide what to sort on; probably on subject then #
app.get('/api/courses', function(req, res) {
        console.log("in courses");
        
        var request = new dbRequest("select * from comp3504data.courses", function(err, rowCount, rows) {
            if (err) {
                console.log(err);
            }
            else {
                var result = [];
                //console.log(rows);
                rows.forEach(function (row) {
                    if (row.value === null) {  
                        console.log('NULL');  
                    } else {  
                        result.push(new Course(
                            row.id.value,
                            row.subject.value,
                            row.number.value,
                            row.title.value,
                            row.attribute.value,
                            row.created_at.value
                        ));  
                    }  
                });
                result = result.reverse();
                res.json(result);
                
                //console.log(request);
            }
        });
        connection.execSql(request);  
        
    });

//announcement retrieval
//TO DO: sort announcements by most recent date
app.get("/api/announcements/course", function(req, res) {
        console.log("in course announcements");
        var request = new dbRequest("select * from comp3504data.announcements", function(err, rowCount, rows) {
            if (err) {
                console.log(err);
            } else {
                var result = [];
                //console.log(rows);
                rows.forEach(function (row) {
                    if (row.value === null) {  
                        console.log('NULL');  
                    } else {  
                        result.push(new Announcement(
                            row.announcementID.value,
                            row.postedBy.value,
                            row.postedOn.value,
                            row.postedTo.value,
                            row.title.value,
                            row.content.value
                        ));  
                    }  
                });

                //console.log(result);
                result = result.reverse();
                res.json(result);
            }
        });
        connection.execSql(request);
    });
    
//instructor retrieval
//TO DO: add prof bios then retrieve data
app.get("/api/instructors", function(req, res) {
        var request = new dbRequest("select * from comp3504data.instructors", function(err, rowCount, rows) {
            if (err) {
                console.log(err);
            } else {
                var result = [];
                //console.log(rows);
                rows.forEach(function (row) {
                    if (row.value === null) {  
                        console.log('NULL');  
                    } else {  
                        result.push(new Instructor(
                            row.id.value,
                            row.full_name.value,
                            row.created_at.value,
                            row.imagePath.value,
                            row.bio.value
                        ));  
                    }  
                });

                //console.log(result);
                result = result.reverse();
                res.json(result);
            }
        });
        connection.execSql(request);
    });

//cloud 9 listen
//app.listen(process.env.PORT, process.env.IP);
//azure listen
server.listen(process.env.PORT);

//utility code
function Announcement(id, by, on, to, title, content) {
    this.announcementID = id;
    this.postedBy = by;
    this.postedOn = on;
    this.postedTo = to;
    this.title = title;
    this.content = content;
}

function Course(id, subject, number, title, attribute, created_at) {
    this.id = id;
    this.subject = subject;
    this.number = number;
    this.title = title;
    this.attribute = attribute;
    this.created_at = created_at;
}

function Instructor (id, fullName, created, imgPath, bio) {
    this.id = id;
    this.fullName = fullName;
    this.createdAt = created;
    this.imgPath = imgPath;
    this.bio = bio;
}