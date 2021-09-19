var request = require("request");
var fs = require("fs");
var clc = require("cli-color");
var google = /file=[\w\-]+/g;
var stdin = {};
//"https://cuevana3.io/23624/death-in-berruecos"
var mongoose = require('mongoose');
var tunnel = require('tunnel-ssh');
var uqloadlink = /https:\/\/\w+[.]uqload.com\/[\w-]+\/v.mp4/g;
console.log("INIT DATA")
var config = {
    username:'ubuntu',
    host:'3.13.42.15',
    agent : process.env.SSH_AUTH_SOCK,
    privateKey:require('fs').readFileSync('/Users/Ditmar/peliscastserver/newserverditmar.pem'),
    port:22,
    dstPort:27017,
    password:''
};
var moviesdb = null;
var limit = 100;
var server = tunnel(config, function (error, server) {
    if(error){
        console.log("SSH connection error: " + error);
    }
    console.log("Connect");
    mongoose.connect('mongodb://0.0.0.0:27017/moviedb', { useNewUrlParser: true, useUnifiedTopology:true});
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'DB connection error:'));
    db.once('open', async function() {
        console.log("OPEN DATA BASE")
        var Schema = mongoose.Schema;
        var thingSchema = new Schema({}, { strict: false });
        moviesdb = mongoose.model('movies', thingSchema);
        var moviesdata = await moviesdb.find({realurl : true, "optinalurls.url":/fembed/});
        console.log("Data CATCH!");
        for (var i = 0; i < moviesdata.length; i++) {
            var json = moviesdata[i].toJSON();
            for (var j = 0; j < json.optinalurls.length; j++) {
                if ((json.optinalurls[j].url.match(/fembed/g) != null || json.optinalurls[j].url.match(/pelisplus/g) != null)) {   
                    //var splitmovies = json.optinalurls[j].url.split(/\//);
                    //var idmovie = splitmovies[splitmovies.length - 1];
                    if (! await doRequestFembed(json.optinalurls[j].url)){
                        console.log(json.optinalurls);
                        var optinalurls = removeItem(json.optinalurls, json.optinalurls[j].url);
                        console.log("------");
                        console.log(optinalurls);
                        if (optinalurls.length == 0) {
                            moviesdb.findOneAndUpdate({idmovie: json.idmovie}, {realurl : false}, (err, docs) => {
                                console.log("Actualizado el enlace " + json.idmovie);
                            });
                        } else {
                            moviesdb.findOneAndUpdate({idmovie: json.idmovie}, {optinalurls : optinalurls}, (err, docs) => {
                                console.log("Actualizado el enlace " + json.idmovie);
                            });
                        }
                        
                    };
                    //await delay();
                    break;
                }
            }
        }
    })
});
function removeItem (optinal, url) {
    console.log(url);
    for (var i = 0; i < optinal.length; i++) {
        if (optinal[i].url == url) {
            optinal.splice(i, 1);
            if (optinal.length == 0) {
                return optinal;
            }
        }
        if (optinal[i].url.match(/openload/g) != null) {
            optinal.splice(i, 1);
            if (optinal.length == 0) {
                return optinal;
            }
        }

        if (optinal[i].url.match(/streamango/g) != null) {
            optinal.splice(i, 1);
            if (optinal.length == 0) {
                return optinal;
            }
        }
        if (optinal[i].url.match(/rapidvideo/g) != null) {
            optinal.splice(i, 1);
            if (optinal.length == 0) {
                return optinal;
            }
        }
    }
    return optinal;
}
function checkFembed (urldata) {
    return new Promise((resolve, reject) => {
      request.post(urldata, function(
        err,
        data,
        body
      ) {
        console.log("QUERY video");
            if (body != null) {
              try {
                
                var json = JSON.parse(data.body.toString());
              } catch(e) {
                console.log("El video no existe JSON INCORERCTO " + data.req.path);
                resolve(false);
                return;
              }
              if (json.success == false) {
                console.log("El video no existe " + data.req.path);
                resolve(false);
                return;
              }
              console.log("FEBED OK! " + data.req.path);
              resolve(true);
            }
            resolve(false);
      });
    });
  }
  function checkUqload (urldata) {
    return new Promise ((resolve, reject) => {
      request(urldata, (err, req, body) => {
          if (err) {
            resolve(false, "Enlace Roto");
            return;
          }
          var data = docs.body.toString();
          if (err) {
            resolve(false);
            return;
          }
          if (data.match(/File was deleted/g)) {
            resolve(false, "Enlace Roto");
          } else if (data.match(/Origin is unreachable/g)) {
            resolve(false, "523");
          } else if(data.match(/Uqload Team/g)) {
            resolve(false, "Cool");
          } else {
            resolve(true, "Cool")
          }
      });
    });
  }
  async function delay () {
    return new Promise((resolve, reject) => {
        var interval= setInterval(function(){ 
            clearInterval(interval);
            resolve() 
        }, 1100);
    });
  }
  function doRequestFembed(url) {
    return new Promise(function (resolve, reject) {
      checkfembed(url, function(result) {
        resolve(result);
      })
    });
  }
  function checkfembed (url, callback) {
      
    request.get(url, (err, docs) => {
      if (err) {
        callback(false, "Enlace Roto");
        return;
      }
      var data = docs.body.toString();
      if (err) {
        callback(false);
        return;
      }
      if (data.match(/Sorry this video does not exist/g) || data.match(/404 error/g) || data.match(/DMCA/g)) {
        callback(false, "Enlace Roto");
      } else {
          console.log("OK =>" + url);
        callback(true, "Cool");
      }
    });
  }