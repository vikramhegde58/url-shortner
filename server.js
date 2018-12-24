'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

let Url = mongoose.model('Url', new mongoose.Schema({
  original_url: String,
  short_url: Number
}));

let Counter = mongoose.model('Counter', new mongoose.Schema({
    "_id": String,
    "sequence_value": Number
}));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/look", function (req, res) {
  
  res.json({greeting: 'hello API'});
});

// shorten url
app.post("/api/shorturl/new", async function (req, res) {
  // await Counter.create({_id: "urlid", sequence_value: 0});
  dns.lookup(req.body.url.split("://")[1], function(err, address, family){
      if(err)
        res.json({"error":"invalid URL"});
  });
  let url = await Url.find({original_url: req.body.url});
    if(url.length > 0){
        res.json({origin_url: url[0].original_url, short_url: url[0].short_url});
    } else {
      let c = await Counter.findOneAndUpdate({_id: "urlid"}, {$inc:{sequence_value: 1}}, {new: true});
      let resUrl = await Url.create({original_url: req.body.url, short_url: c.sequence_value});
      res.json({origin_url: resUrl.original_url, short_url: resUrl.short_url});
    }
});

// redirect 
app.get("/api/shorturl/:short_url", async function (req, res) {
  let result = await Url.find({short_url: req.params.short_url});
  res.redirect(result[0].original_url);
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});