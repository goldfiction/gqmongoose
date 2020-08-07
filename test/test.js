var assert=require("assert");
var lib=require(__dirname+"/../lib.js");
var log=lib.tryLog;
var needle=require('needle');
var _=require('lodash');
var id="";
var rand=Math.floor(Math.random()*10000)


// do this for your new mongo db if you have auth issue
//var schema = db.system.version.findOne({"_id" : "authSchema"})
//schema.currentVersion = 3
//db.system.version.save(schema)

// do this to create user
//db.createUser({user: "user",pwd: "user",roles: [ { role: "userAdminAnyDatabase", db: "admin" } ],passwordDigestor:"server"})

// do this to add db to user if you have trouble read/write to db
//db.grantRolesToUser("user",[{ role: "readWrite", db: "test" }])

console.log(rand)
global.gqmongoose=require('./../mongo.js');

global.mongodb={
    host:"mongo",  // change this to localhost if needed
    port:"27017",  // default
    user:"user",
    pass:"user",
    database:"test",  // default
    collection:"test",
    route:"http://localhost:10080/api/db",  // default
    schema:{
        name:String,
        value:Number,
        enabled:{type:Boolean,default:true},
        updateTime:{type:Date,default:Date.now},
        createTime:{type:Date,default:Date.now}
    },
    key:{
        name:"abc",
        enabled:true
    },
    data:{
        name:"abc",
        value:rand,
        enabled:true
    }
};

var route=mongodb.route;


describe("testing rest api",function(){
    before(function(done){
        require('./testapp.js');
        gqmongoose.model(_.cloneDeep(mongodb),function(e) {
           // setTimeout(function(){done(e)},200);
           done();
        });
    });

    after(function(done){
	    process.exit(0);
	    done();
    });

    it("should be able to run with express", function (done) {
        needle.get("http://localhost:10080/", function (e,r,b) {
            var result= b+"";
            console.log(result);
            assert(result,"welcome!");  // make sure the test server is online
            setTimeout(function(){done(e)},200);
        });
    });

    it("should be able to upsert", function (done) {
        var o=_.cloneDeep(mongodb);
	o.key.value=rand;
        needle.put(route,o,function(e,r,b){  // get/post/put all allow upsert
            //console.log(b)
            //console.log(e)
            // console.log("upsert b:")
            b=JSON.parse(b);
            //console.log(b)
            //console.log(b.name)
            assert(b.name=='abc');
            setTimeout(function(){done(e)},200);
        })
    });


    it("should be able to get", function (done) {
        var o=_.cloneDeep(mongodb);
        o.key.value=rand;
        o.read=true;    // o.read allows get operation through get/post/put
        // console.log(o)
        needle.post(route,o,function(e,r,b){
            // console.log(e)
            // console.log(r)
            // console.log("get b:")
            // console.log(b)
            id=JSON.parse(b+"")[0]["_id"];
            console.log("id:"+id);
            assert(id);
            setTimeout(function(){done(e)},200);
        });
    });

    it("should be able to remove",function(done){
        var o=_.cloneDeep(mongodb);
        o.key._id=id;
        o.delete=false;        // By default, only sets enabled to false, data is left in db
        needle.delete(route,o,function(e,r,b){
            b=JSON.parse(b);
            // console.log(b)
            setTimeout(function(){done(e)},200);
        });
    });

    it("should be able to count",function(done){
        var o= _.cloneDeep(mongodb);
        o.count=true;
        o.key.value=rand;
        needle.post(route,o,function(e,r,b){
            //console.log(b)
            b=JSON.parse(b);
            //console.log(b);
            assert(b==0);
            setTimeout(function(){done(e)},200);
        });
    });

    it("should be able to reenable",function(done){
        var o=_.cloneDeep(mongodb);
        var o2=_.cloneDeep(mongodb);

        o.key._id=id;
        o.key.enabled=false;  // key.enabled default to true, need to be false to find disabled item
        o.data.enabled=true;
        o2.count=true;

        // console.log(o)
	// console.log(o2)
	needle.put(route,o,function(e,r,b){
            b=JSON.parse(b);
             //console.log(b);
             id=b._id;  // apparently new upsert creates new _id
            needle.post(route,o2,function(e,r,b){
                b=JSON.parse(b);
                //console.log(b);
                assert(b==1)
                setTimeout(function(){done(e)},200);
            })
        });
    });

    it("should be able to delete",function(done){
        var o=_.cloneDeep(mongodb);  // what to delete
        var o2=_.cloneDeep(mongodb); // check if deleted by counting

        o.key={_id:id};
        o.delete=true;  // this make sure data is truly deleted
        o2.key.value=rand;
        o2.count=true;

        needle.delete(route,o,function(e,r,b){
            if(e){
                console.log(e);
            }
            //console.log(b);
            b=JSON.parse(b);
            assert(b=="OK");
            setTimeout(function(){
            needle.post(route,o2,function(e,r,b){
                if(e){
                    console.log(e);
                }
                //console.log(b);
                b=JSON.parse(b);
                //console.log(b);
                assert(b==0)
                setTimeout(function(){done(e)},200);
            })
            },100);
        });

    })
});