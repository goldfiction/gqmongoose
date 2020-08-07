var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var methodOverride=require('method-override');

var port = 10080;

//app.use(express.favicon());
//app.use(express.logger('dev'));
//app.use(bodyParser());
app.use(methodOverride());
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
app.get("/",function(req,res){
    res.status(200).send("Welcome!");
});

app.all("/api/db", gqmongoose.requestHandler);
global.expressserver=app.listen(port, function () {
    console.log("server is running @" + port);
});


