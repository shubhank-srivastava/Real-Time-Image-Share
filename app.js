//******************SERVER SETUP*********************//
var express = require('express');
var app = express();
app.use(express.bodyParser());
app.use(express.static(__dirname + '/'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
http.listen(8080);
console.log('OS listening on 8080');
var fs = require('fs');

//*********************CACHE*************************//
var cache={};
var put = function(key,value,expire){
	var exp = expire*1000 + Date.now();
	var record = {value:value,expire:exp};
	cache[key] = record;
}

var del = function(key){
	delete cache[key];
}
//********************ROUTES**************************//

app.get('/',function(req,res){
	res.sendfile('/index.html');
});

app.post('/upload',function(req,res){
var imageType = /^image\/[a-z]+/;
if(imageType.test(req.files.file.type)){    
	fs.readFile(req.files.file.path,function(err,data){
    	if(err){
    		console.log('Cannot readFile');
    		res.send(500,'file Cannot be found');
    	}
    	else{
    	    fs.writeFile(__dirname+'/uploads/'+req.files.file.originalFilename,data,function(err,result){
                if(err){console.log(err);res.send(500,'Error in upload');}
                else {
                    put(req.files.file.originalFilename,req.body.desc,req.body.expire);
                	res.send('File Uploaded');
                }
    	    });
        }
    });
}else
   res.send(500,'Not an image');
});

var Sockets=[];
io.sockets.on('connection',function (socket){
    Sockets.push(socket);
});
//*********************LISTENER***********************//
var async = require('async');
function cacheListener(){
if(Object.keys(cache).length!=0){	
    async.each(Object.keys(cache),function(item,iterate){
    	if(cache[item].expire<Date.now())
    		del(item);
    	else
    		iterate();
    },function(err){console.log(err);});
    setTimeout(function(){
        for (var i = Sockets.length - 1; i >= 0; i--) {
            Sockets[i].send(cache);
        };
            cacheListener();
            //console.log('listener working');
        },1000);
}else{
    setTimeout(function(){
        for (var i = Sockets.length - 1; i >= 0; i--) {
            Sockets[i].send(cache);
        };
            cacheListener();
            //console.log('listener working');
        },1000);
}
}
cacheListener();

