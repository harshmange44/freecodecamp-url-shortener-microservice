require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const shortid = require('shortid');
const URL = require('url').URL;
const bodyParser = require("body-parser");
const dns = require("dns");
const app = express();
app.use(bodyParser.urlencoded({extended: false}));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;
const urlSchema = new Schema({
  original_url: String,
  short_url: String
});
const URL_MODEL = mongoose.model("URL", urlSchema);

app.post('/api/shorturl', (req, res) => {

  const originalURL = req.body.url;
  var urlObject;
  try{
  urlObject = new URL(originalURL);
  }catch(e){
    res.json({
      error: "invalid url"
    });
  }
  if(urlObject != undefined){
  dns.lookup(urlObject.hostname, (err, address, family) => {
    if (err) {
      res.json({
        error: "invalid url"
      });
    } else {

      const is_url_exists = URL_MODEL.findOne({original_url: originalURL})
      .then(url_exists => {
        if(url_exists){
          res.json({
            original_url: url_exists.original_url,
            short_url: url_exists.short_url
          })
        }else{
        var shortenedURL = shortid.generate().toString();

        var newURL = new URL_MODEL({
          original_url: originalURL,
          short_url: shortenedURL
        });

        newURL.save(function(err, data) {
          if (err) {
            return console.error(err);
          }
        });

        res.json({
          original_url: originalURL,
          short_url: shortenedURL
        })

        }
      })
    };
  });
}
});

app.get('/api/shorturl/:short_url', async function (req, res) {

  const find_url = await URL_MODEL.findOne({
    short_url: req.params.short_url
  })

  if(find_url == "" || find_url == undefined){
    res.status(404).json("No URL found");
  }else{
    res.redirect(find_url.original_url);
  }

});

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
