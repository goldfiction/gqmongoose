var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var port = 10080;

app.use(express.favicon());
//app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
app.get("/",function(req,res){
    res.send(200,"Welcome!");
});

app.all("/api/db", gqmongoose.requestHandler);
app.listen(port, function () {
    console.log("server is running @" + port);
});

