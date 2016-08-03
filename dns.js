var dnsd = require('dnsd');
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient;

var db;
var domain = 'ffmpeg-test.ru';
var ip = '138.68.30.38';

MongoClient.connect("mongodb://localhost:27017/ffmpeg", function(err, database) {
    if(err) throw err;

    db = database;
	dnsd.createServer(function(req, res) {
	    for (var i = 0; i < req.question.length; ++i) {
	        var r = req.question[i];
	        var d = r.name.substring(0, r.name.length - domain.length - 1);
	        var labelId = d.lastIndexOf('.');
	        if (d.length > 0 && labelId !== -1) {
	        	var label = d.substring(labelId + 1);
	        	var info = d.substring(0, labelId);
	        	if (info === 'vulnerable') {
	        		db.collection('dns').updateOne({
	        			'label': label,
	        		},
              {
	        			'label': label,
	        		},
              {
        				'upsert': true
        			}, function(err, result) {

	        		});
	        	} /*else if (/^\d*\.\d*\.0.0/.test(info)) {
	        		var parts = info.split('.', 3);
	        		var fileId = parts[0];
	        		var filePos = parts[1];
	        		var data = parts[2].substring(1, 2);
	        		db.collection('dns_files').updateOne({
	        			'label': label,
	        			'fileId': fileId
	        		},
	        		{
	        			'label': label,
	        			'fileId': fileId,
	        			'filePos': filePos,
	        			'data': data
	        		},
	        		{
	        			'upsert': true
	        		}, function(err, result) {

	        		});

	        	}*/
	        	console.log(label);
	        	console.log(info);
	        }
	    }
	    res.end(ip);
	}).listen(53, ip);

    console.log('DNS server running at ' + ip);
});
