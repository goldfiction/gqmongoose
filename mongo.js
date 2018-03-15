var mongoose = require('mongoose');
var _=require('lodash');
var doq=require('gqdoq');
var schema = mongoose.Schema;
var objectId = schema.ObjectId;
var objectIdType=mongoose.Schema.Types.ObjectId;
var db=null;
var models=null;
var lib=require('./lib.js');


function toId(id){
    if(id)
        return mongoose.Types.ObjectId(id);
    else
        return new mongoose.mongo.ObjectId();
}

exports.mongoose=mongoose;
exports.objectId=objectId;
exports.schema=schema;
exports.objectIdType=objectIdType;
global.objectIdType=objectIdType;
global.toId=toId;

function parseId(o){
    o=o||{};
    o.key= o.key||{};
    o.data= o.data||{};
    o.option= o.option||{};
    o.collection= o.collection||"test";
    //console.log(o)
    if(o.key._id) {
        if (typeof o.key._id == "string")
            o.key._id = toId(o.key._id);
    }else{
        delete o.key._id
    }
    if(o.data._id) {
        if (typeof o.data._id == "string")
            o.data._id = toId(o.data._id);
    }else{
        delete o.data._id
    }
    return o
}

//  input:
//    [host=localhost]
//    [port=27017]
//    [database=test]
//  output:
//    o.db
function connect(o,cb) {
    o.host= o.host||"localhost";
    o.port= o.port||"27017";
    o.auth={};
    if(o.user) {
        o.auth={user:o.user,pass:o.pass,auth:{authdb:"admin"}}
    }
    o.database= o.database||"test";
    o.connectionString='mongodb://' + o.host+':'+ o.port+'/'+ o.database;
    //console.log(o.connectionString);
    mongoose.connect(o.connectionString,o.auth);
    db = mongoose.connection;
    db.on('error', function(e){
        console.error.bind(console, 'connection error:');
        console.log(e);
        cb(e);
    });
    console.log("Mongo connection established")
    o.db=db;
    cb(null,o)
}
exports.connect=connect;

// same as connect
// will check if connection has been previously made, if not, try to connect
function tryConnect(o,cb){
    if(db){
        cb(null,o);
    }else{
        connect(o,cb);
    }
}

//  input:
//    o.schema
//    [o.collection=test]
//  output
//    o.models
function model(o,cb){
    try {
        models= models||{};
        o.collection= o.collection||"test";
        o.schema=new schema(o.schema);
        models[o.collection]=mongoose.model(o.collection, o.schema);
        cb(null, o);
    }catch(e){
        console.log(e);
        cb(e);
    }
}

exports.model=model;

//  input:
//    [o.key={}]
//    [o.collection=test]
//    [o.option={}]
//  output:
//    o.result
function count(o,cb){
    tryConnect(o,function(e) {
        if(e) {
            console.log(e);
            cb(e, o);
        }else {
            mongoose.model(o.collection).count(o.key, function (e, r) {
                if (e)
                    console.log(e);
                o.result = r;
                cb(e, o);
            });
        }
    });
}

function q_count(o){
    o=o||{};
    o.query=read;
    return doq(o);
}

exports.count=q_count;

//  input:
//    [o.key={}]
//    [o.collection=test]
//    [o.option={}]
//  output:
//    o.result
function read(o,cb){
    tryConnect(o,function(e,o){
        o.key=lib.cleanProto(o.key);
        o.key=lib.cleanEval(o.key);
        console.log(o.key)
        mongoose.model(o.collection).find(o.key, o.option, function(e,r){
            console.log(e)
            console.log(r)
            if(r) {
                for (var i in r) {
                    try{
                        r[i]=r[i].toObject();
                    }catch(e){}
                }
            }
            o.result=r;
            cb(e,o);
        });
    });
}

function q_read(o){
    o=o||{};
    o.query=read;
    return doq(o);
}

exports.read=q_read;

//  input:
//    [o.key={}]
//    [o.data={}]
//    [o.collection=test]
//    [o.option={}]
//  output:
//    o.result
function upsert(o,cb){
    //console.log(o);
    tryConnect(o,function(e,o) {
        o.key=lib.cleanProto(o.key);
        o.data=lib.cleanProto(o.data);
        if(o.count)
        {
            count(o,cb);
        }
        else if (o.read)
        {
            read(o,cb);
        }
        else {
            if(!o.noTimeTracking){
                o.data.updateTime = Date.now();
            }
            ///console.log(o.key)
            mongoose.model(o.collection).findOne(o.key, o.option,function(e,docs) {
                //console.log(docs)
                if (e) {
                    cb(e);
                }
                else{
                    if(docs && docs.doc){
                        //console.log("update!");
                        //console.log(o.data);
                        var doc=docs.toObject();
                        delete doc._id;
                        doc = _.extend(doc, o.data);
                        mongoose.model(o.collection).update(o.key,doc,{upsert: true},function(e){
                            o.result=[doc];
                            cb(e,o);
                        })
                    }else{
                        //console.log("create!")
                        //console.log(o.data);
                        var myModel=mongoose.model(o.collection);
                        var item=new myModel(o.data);
                        //item= _.extend(item, o.data);
                        //var itemObj= _.cloneDeep(item)
                        //console.log(item);
                        item.save(function(e,r){
                            //console.log(e);
                            //console.log(r);
                            o.result=r;
                            //console.log(typeof o.result)
                            cb(e,o);
                        })
                    }
                }
            });
        }
    });
}

function q_upsert(o){
    o=o||{};
    o.query=upsert;
    return doq(o);
}

exports.upsert=q_upsert;

// save as upsert
// should use _id for exact remove
function remove(o,cb){
    if(o.delete)
    {
        del(o,cb);
    }
    else {
        o.key=lib.cleanProto(o.key);
        o.data=lib.cleanProto(o.data);
        o.key.enabled = true;
        o.data.enabled = false;
        models[o.collection].findOneAndUpdate(o.key, o.data, o.option,function(e,r){
            if(e)
                console.log(e);
            o.result=r;
            cb(e,o);
        });
    }
}

function q_remove(o){
    o=o||{};
    o.query=remove;
    return doq(o);
}

exports.remove=q_remove;

//  input:
//    [o.key={}]
//    [o.collection=test]
//    [o.option={}]
//  output:
//    o.result
function del(o,cb){
    o=parseId(o);
    o.key=lib.cleanProto(o.key);
    tryConnect(o,function(e,o) {
        //console.log(o.key);
        mongoose.model(o.collection).remove(o.key, function (e) {
            o.result="OK";
            cb(e,o);
        });
    });
}

function q_delete(o){
    o=o||{};
    o.query=del;
    return doq(o);
}

exports.del=q_delete;

// input: req
// output: res
// params:
//   req.method
//   req.query/req.body
function requestHandler(req,res){
    var method=req.method.toLowerCase();
    var o={};
    if(method==="get"||method==="head"){
        o=req.query;
    }else{
        o=req.body;
    }
    o=parseId(o);

    function cb(e,o){
        if(e){
            console.log(e);
            res.send(500);
        }
        else{
            res.send(200,JSON.stringify(o.result, null, 2));
        }
    }


    if(method=="get"||method=="post"||method=="put"){
        upsert(o,cb);
    } else if (method=="delete"){
        remove(o,cb);
    }
}

exports.requestHandler=requestHandler;