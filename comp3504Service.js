var express = require('express');
var bodyParser = require('body-parser');

//var db = require('mssql');
var dbConnection = require("tedious").Connection;
var dbRequest = require("tedious").Request;
var dbTypes = require("tedious").Type;


var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
//app.set('',config.secret);


// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function callback () {
//     console.log("connected");
// });

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
//
app.get('/api/courses', function(req, res) {
        console.log("in courses");

        // var course = {
        //     id: null,
        //     subject: "",
        //     number: null,
        //     title: "",
        //     attribute: "",
        //     created_at: ""
        // };
        
        
        var request = new dbRequest("select top 2 * from comp3504data.courses", function(err, rowCount, rows) {
            if (err) {
                console.log(err);
            }
            console.log(rows);
            // console.log(rows[0][0].metadata);
            //console.log(request);
        });
        var result = "";  
        request.on('row', function(columns) {  
            console.log(columns);
            // columns.forEach(function(column) {  
            //   if (column.value === null) {  
            //     console.log('NULL');  
            //   } else {  
            //     //console.log(column);
            //     //course.id
            //     result+= column.value + " ";  
            //   }  
            // });  
            //console.log(result);  
            res.send(columns);
            result ="";  
        });  
  
        request.on('done', function(rowCount, more) {  
            console.log(rowCount + ' rows returned');  
        });  
        connection.execSql(request);  
        
    });

//announcement retrieval
app.get("/api/announcements", function(req, res) {
        
    });
    
//instructor retrieval
app.get("/api/instructors", function(req, res) {
        
    });

app.listen(process.env.PORT, process.env.IP);