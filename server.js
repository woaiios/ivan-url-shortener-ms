function idToShortURL(n)
{
    // Map to store 62 possible characters
    var map = "abcdefghijklmnopqrstuvwxyzABCDEF"
                 "GHIJKLMNOPQRSTUVWXYZ0123456789".split("");
    var shorturl = [];
    while (n) {
        shorturl.push(map[n%62]);
        n = parseInt(n/62);
    }
    console.log(shorturl)
    shorturl = shorturl.reverse().join()
    return shorturl;
}
 
function shortURLtoID(shortURL) {
    var id = 0; 
    for (var i=0; i < shortURL.length(); i++)
    {
        if ('a' <= shortURL[i] && shortURL[i] <= 'z')
          id = id*62 + shortURL[i] - 'a';
        if ('A' <= shortURL[i] && shortURL[i] <= 'Z')
          id = id*62 + shortURL[i] - 'A' + 26;
        if ('0' <= shortURL[i] && shortURL[i] <= '9')
          id = id*62 + shortURL[i] - '0' + 52;
    }
    return id;
}


var express = require('express');
var urlValid = require('valid-url');
var mongodb = require('mongodb').MongoClient;
var app = express();
var dbUrl = process.env.url; 
app.get("/new/*", function (request, response) {
  var original_url = request.url.substring(5,request.url.length)
  if (urlValid.isUri(original_url)) {
    mongodb.connect(dbUrl, function(err, db) {
      if (err) throw err;
      var dbo = db.db("ivan");
      dbo.createCollection("urls", function(err, res) {
        if (err) throw err;
        dbo.collection("urls").find().toArray(function(err, docs) {
          if (err) throw err;
          var id = docs.length + 1
          var short_url = idToShortURL(id)
          console.log("ksks")
          console.log(short_url)
          var obj = {original_url: original_url, short_url: short_url}
          dbo.collection("urls").insertOne(obj, function(err, res) {
            if (err) throw err;
            db.close();
            var fullUrl = request.protocol + '://' + request.get('host') + "/" + short_url
            var ret = {original_url: original_url, short_url: fullUrl}
            response.send(JSON.stringify(ret))
          })
        })
      });
    });
    
  } else {
    var ret = {err: "invalid url"}
    response.send(JSON.stringify(ret))  
  }
});

app.use(express.static('views'))

app.get("/", function (req, res) {
  res.sendFile(__dirname + "index.html")
})

app.get("/:id", function(req, res) {
  mongodb.connect(dbUrl, function(err, db) {
    if (err) throw err;
    var dbo = db.db("ivan");
    dbo.collection("urls").find({short_url:req.params.id})
                          .sort({short_url:-1})
                          .limit(1)
                          .toArray(function(err, docs) {
          if (err) throw err;
          if (docs.length == 1) {
            var mURL = docs[0].original_url
            res.redirect(mURL)
          } else {
            res.send(req.params.id)      
          }
    })
  })
})

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
