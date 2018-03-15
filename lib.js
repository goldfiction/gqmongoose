/**
 * Created by happy on 2/25/17.
 */

function doParse(obj){
    try{
        if(typeof obj === 'string' || obj instanceof String) {
            obj = JSON.parse(obj);
        }
    }catch(e){}
    if(typeof obj === 'object') {
        for (var i in obj) {
            if(typeof obj[i] === 'string' || obj[i] instanceof String) {
                obj[i] = doParse(obj[i]);
            }
        }
    }
    return obj;
}
exports.doParse=doParse;

function log(text) {
    setTimeout(function () {
        try {
            console.log(text);
        } catch (e) {
        }
    }, 5);
}
exports.log=log;

function tryLog(text) {
    if (text)
        log(text);
}
exports.tryLog=tryLog;

function doQ(o) {
    // doQ(o)
    // in: o.query
    // out: o.result
    // promise return: doQ({query:query,...other parameter query needs})
    var deferred = Q.defer();
    o.query(o, function (e, o2) {
        tryLog(e);
        deferred.resolve(o2);
    });
    return deferred.promise;
}
exports.doQ = doQ;

function cleanProto(obj){
    try{
        delete obj['__proto__']
    }catch(e){}
    return obj;
}

exports.cleanProto=cleanProto;

function cleanEval(obj){
    for(var i in obj){
        if(typeof obj[i]=='string') {
            try {
                obj[i] = eval(obj[i]);
            } catch (e) {
            }
        }else if (typeof obj[i]=='object'){
            obj[i]=cleanEval(obj[i]);
        }else{
        }
    }
    return obj;
}

exports.cleanEval=cleanEval;