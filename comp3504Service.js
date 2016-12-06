var express = require('express');
var bodyParser = require('body-parser');
var http = require("http");
//var async = require("async");


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

app.get('/', function (req, res) {
    console.log('hello world');
    getCourseInstances(1005, function() {
        console.log("in function");
        res.json({message: "hello world"});
    });
});

//course dump
//TO DO: decide what to sort on; probably on subject then #
app.get('/api/courses', function(req, res) {
    console.log("in courses");
    
    var request = new dbRequest("select * from comp3504data.courses where number <> '' and id is not null and subject = 'COMP'", function(err, rowCount, rows) {
        if (err) {
            console.log(err);
        }
        else {
            var result = [];
            rows.forEach(function (row) {
                if (row.value === null) {  
                    console.log('NULL');  
                } else {  
                    result.push(new Course(
                        row.id.value,
                        row.subject.value,
                        row.number.value,
                        row.title.value,
                        row.attribute.value
                    ));  
                }  
            });
            result = result.reverse();
            
            res.json(result);
        }
    });
    connection.execSql(request);  
    
});

//electives
app.get('/api/courses/electives', function(req, res) {
    console.log("in electives");
    var sql = "SELECT DISTINCT c.[id], c.[subject], c.[number], c.[title], c.[attribute] FROM [comp3504data].[courses] c inner join comp3504data.sections s on c.id = s.course_id inner join comp3504data.terms t on s.term_id = t.id and t.id = 12 WHERE c.subject <> '' OR c.number <> NULL ORDER BY c.subject ASC, c.number ASC";
    
    var request = new dbRequest(sql, function(err, rowCount, rows) {
        if (err) {
            console.log(err);
        }
        else {
            var electiveResults = new CourseGroup(2, "Electives");
            var result = [];
            rows.forEach(function (row) {
                if (row.value === null) {  
                    console.log('NULL');  
                } else {  
                    result.push(new Course(
                        row.id.value,
                        row.subject.value,
                        row.number.value,
                        row.title.value,
                        row.attribute.value
                    ));  
                }  
            });
            electiveResults.courseGrouping = result;
            res.json(electiveResults);
        }
    });
    connection.execSql(request);  
    
});

//gned courses
app.get('/api/courses/gned', function(req, res) {
    console.log("in gneds");
    var sql = "SELECT DISTINCT c.[id], c.[subject], c.[number], c.[title], CAST(c.[attribute] as nvarchar(128)) as attribute, c.[created_at] FROM [comp3504data].[courses] c inner join comp3504data.sections s on c.id = s.course_id inner join comp3504data.terms t on s.term_id = t.id and t.id = 12 where attribute LIKE '%Cluster%'";
    var request = new dbRequest(sql, function(err, rowCount, rows) {
        if (err) {
            console.log(err);
        }
        else {
            var gnedResults = new CourseGroup(1, "GNED");
            var result = [];
            rows.forEach(function (row) {
                if (row.value === null) {  
                    console.log('NULL');  
                } else {  
                    result.push(new Course(
                        row.id.value,
                        row.subject.value,
                        row.number.value,
                        row.title.value,
                        row.attribute.value
                    ));  
                }  
            });
            
            gnedResults.courseGrouping = result;
            res.json(gnedResults);
        }
    });
    connection.execSql(request);  
    
});

//core courses
app.get('/api/courses/core', function(req, res) {
    console.log("in core courses");
    var sql = "SELECT c.[id], c.[subject], c.[number], c.[title], c.[attribute], c.[created_at] FROM [comp3504data].[courses] c inner join comp3504data.coreCourse cc on cc.courseNumber = (c.subject + c.number)";
    var request = new dbRequest(sql, function(err, rowCount, rows) {
        if (err) {
            console.log(err);
        }
        else {
            var coreResults = new CourseGroup(0, "Core Courses");
            var result = [];
            rows.forEach(function (row) {
                if (row.value === null) {  
                    console.log('NULL');  
                } else {  
                    result.push(new Course(
                        row.id.value,
                        row.subject.value,
                        row.number.value,
                        row.title.value,
                        row.attribute.value
                    ));  
                }  
            });
            coreResults.courseGrouping = result;
            res.json(coreResults);
        }
    });
    connection.execSql(request);  
});

//
app.get("/api/courses/sections/:courseID", function(req, res) {
    console.log("in course instances route");
    
    var sql = "select sec.id, sec.abbrev, d.day, d.start_time, d.end_time, ins.full_name, l.room as location from comp3504data.deliveries d inner join comp3504data.locations l on d.location_id = l.id inner join comp3504data.instructions i on i.delivery_id = d.id inner join comp3504data.instructors ins on ins.id = i.instructor_id inner join comp3504data.sections sec on sec.id = d.section_id inner join comp3504data.courses c on c.id = sec.course_id where term_id = 12 and c.id = " + req.params.courseID;
    var request = new dbRequest(sql, function (err, rowCount, rows) {
        if (err) {
            console.log(err);
        } else {
            var courseInstances = [];
            rows.forEach(function (row) {
                if (row.value === null) {
                    console.log('NULL');
                } else {
                    // console.log("before push");
                    // console.log(row.abbrev.value);
                    courseInstances.push(new CourseInstance(
                        row.id.value,
                        row.abbrev.value,
                        row.day.value,
                        row.start_time.value,
                        row.end_time.value,
                        row.location.value,
                        row.full_name.value
                    ));
                }
            });
            //console.log(courseInstances);
            res.json(courseInstances);
        }
    });
    
    connection.execSql(request);
    //console.log(courseInstances);
});

// //
// function getCourseInstances (courseID) {
    
//     var sql = "select sec.abbrev, d.day, d.start_time, d.end_time, ins.full_name, l.room as location from comp3504data.deliveries d inner join comp3504data.locations l on d.location_id = l.id inner join comp3504data.instructions i on i.delivery_id = d.id inner join comp3504data.instructors ins on ins.id = i.instructor_id inner join comp3504data.sections sec on sec.id = d.section_id inner join comp3504data.courses c on c.id = sec.course_id where term_id = 12 and c.id = " + courseID;
//     var request = new dbRequest(sql, function (err, rowCount, rows) {
//         if (err) {
//             console.log(err);
//         } else {
//             var courseInstances = [];
//             rows.forEach(function (row) {
//                 if (row.value === null) {
//                     console.log('NULL');
//                 } else {
//                     // console.log("before push");
//                     // console.log(row.abbrev.value);
//                     courseInstances.push(new CourseInstance(
//                         row.abbrev.value,
//                         row.day.value,
//                         row.start_time.value,
//                         row.end_time.value,
//                         row.location.value,
//                         row.full_name.value
//                     ));
//                 }
//             });
//             console.log(courseInstances);
//             return courseInstances;
//         }
//     });
    
//     connection.execSql(request);
//     //console.log(courseInstances);
// }

//core course retrieval
//not currently used
app.get("/api/courses/core1", function(req, res) {
    console.log("in core coures");
    var request = new dbRequest("SELECT coreID, program, RIGHT(courseNumber, 4) as courseNum, prerequisite1, prerequisite2, prerequisite3 FROM comp3504data.coreCourse ORDER BY courseNumber DESC", function (err, rowCount, rows) {
        if (err) {
            console.log(err);
            //res.json({message: "error retrieving core courses"});
        } else {
            var result = [];
            rows.forEach(function (row) {
                if (row.value === null) {
                    console.log("NULL");
                } else {
                    result.push(new CoreCourse(
                        row.coreID.value,
                        row.program.value,
                        row.courseNum.value,
                        row.prerequisite1.value,
                        row.prerequisite2.value,
                        row.prerequisite3.value
                    ));
                }
            });
            result = result.reverse();
            res.json(result);
        }
    });
    connection.execSql(request);
});

//announcement retrieval
//not used
//TO DO: sort announcements by most recent date
app.get("/api/announcements/course", function(req, res) {
        console.log("in course announcements");
        var request = new dbRequest("SELECT * FROM comp3504data.announcements", function(err, rowCount, rows) {
            if (err) {
                console.log(err);
                res.json({message: "error retrieving course announcements"});
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

//return the groups of announcements
app.get("/api/announcements/", function(req, res) {
    console.log("in announcements");
   
    var repository = [];
   
    //build requests 
    var courseAnnounceRequest = new dbRequest("SELECT * FROM comp3504data.announcements WHERE announcementGroupID = 1", function(err, rowCount, rows) {
        if (err) {
            console.log(err);
            res.json({message: "error while receiving course announcements"});
        } else {
            var courseResults = new AnnouncementGroup(1, "Course");
            rows.forEach(function (row) {
                if (row.value === null) {  
                    console.log('NULL');  
                } else {  
                    courseResults.announcements.push(new Announcement(
                        row.announcementID.value,
                        row.postedBy.value,
                        row.postedOn.value,
                        row.postedTo.value,
                        row.title.value,
                        row.content.value
                    ));  
                } 
            });
            console.log("finished with course announcements");
            repository.push(courseResults);
            connection.execSql(instructAnnounceRequest);
        }
    });
    
    var instructAnnounceRequest = new dbRequest("SELECT * FROM comp3504data.announcements WHERE announcementGroupID = 2", function(err, rowCount, rows) {
        if (err) {
            console.log(err);
            res.json({message: "error while receiving instructor announcements"});
        } else {
            var instructResults = new AnnouncementGroup(2, "Instructor");
            rows.forEach(function (row) {
                if (row.value === null) {  
                    console.log('NULL');  
                } else {  
                    instructResults.announcements.push(new Announcement(
                        row.announcementID.value,
                        row.postedBy.value,
                        row.postedOn.value,
                        row.postedTo.value,
                        row.title.value,
                        row.content.value
                    ));  
                } 
            });
            console.log("finished with instructor announcements");
            repository.push(instructResults);
            connection.execSql(societyAnnounceRequest);
        }
    });
    
    var societyAnnounceRequest = new dbRequest("SELECT * FROM comp3504data.announcements WHERE announcementGroupID = 3", function(err, rowCount, rows) {
        if (err) {
            console.log(err);
            res.json({message: "error while receiving student society announcements"});
        } else {
            var societyResults = new AnnouncementGroup(3, "Student Society");
            rows.forEach(function (row) {
                if (row.value === null) {  
                    console.log('NULL');  
                } else {  
                    societyResults.announcements.push(new Announcement(
                        row.announcementID.value,
                        row.postedBy.value,
                        row.postedOn.value,
                        row.postedTo.value,
                        row.title.value,
                        row.content.value
                    ));  
                } 
            });
            console.log("finished with society announcements");
            repository.push(societyResults);
            res.json(repository);
        }
    });
    connection.execSql(courseAnnounceRequest);
});
    
//instructor retrieval
//TO DO: add route for instructors filtered by some criteria
app.get("/api/instructors", function(req, res) {
        var request = new dbRequest("SELECT * FROM comp3504data.instructors WHERE bio IS NOT NULL ORDER BY full_name DESC", function(err, rowCount, rows) {
            if (err) {
                console.log(err);
                res.json(err);
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
                            row.imagePath.value,
                            row.bio.value,
                            row.office.value,
                            row.email.value,
                            row.education.value
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
    this.ID = id;
    this.postedBy = by;
    this.date = on;
    this.postedTo = to;
    this.title = title;
    this.content = content;
}

function AnnouncementGroup(id, groupName) {
    this.groupID = id;
    this.groupName = groupName;
    this.announcements = [];
}

function Course(id, subject, number, title, attribute) {
    this.courseID = id;
    this.subject = subject;
    this.courseNumber = number;
    this.title = title;
    this.attribute = attribute;
    this.sections = [];
}

function CourseGroup(id, groupName) {
    this.courseGroupID = id;
    this.title = groupName;
    this.courseGrouping = [];
}

function Instructor (id, fullName, imgPath, bio, office, email, education) {
    this.id = id;
    this.name = fullName;
    this.imagePath = imgPath;
    this.bio = bio;
    this.office = office;
    this.email = email;
    this.education = education;
}

function CourseInstance (id, abbreviation, day, startTime, endTime, location, instructor) {
    this.sectionId = id;
    this.type = abbreviation;
    this.day = day;
    this.start = startTime;
    this.end = endTime;
    this.location = location;
    this.instructor = instructor;
}

function CoreCourse (id, program, courseNum, preReq1, preReq2, preReq3) {
    this.id = id;
    this.program = program;
    this.courseNumber = courseNum;
    this.preReq = [];
    this.preReq.push(preReq1);
    this.preReq.push(preReq2);
    this.preReq.push(preReq3);
}