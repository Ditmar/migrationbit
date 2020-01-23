var request = require("request");
var fs = require("fs");
var clc = require("cli-color");
var google = /file=[\w\-]+/g;
var stdin = {};
//"https://cuevana3.io/23624/death-in-berruecos"
var mongoose = require('mongoose');
var tunnel = require('tunnel-ssh');
var config = {
    username:'ubuntu',
    host:'3.13.42.15',
    agent : process.env.SSH_AUTH_SOCK,
    privateKey:require('fs').readFileSync('/home/ditmar/Escritorio/newserverditmar.pem'),
    port:22,
    dstPort:27017,
    password:''
};
var moviesdb = null;
var server = tunnel(config, function (error, server) {
    if(error){
        console.log("SSH connection error: " + error);
    }
    mongoose.connect('mongodb://0.0.0.0:27017/moviedb', { useNewUrlParser: true, useUnifiedTopology:true});
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'DB connection error:'));
    db.once('open', async function() {
        // we're connected!
        console.log("DB connection successful!");
        var Schema = mongoose.Schema;
        var thingSchema = new Schema({}, { strict: false });
        moviesdb = mongoose.model('movies', thingSchema);
        console.log("Try do query");
        var moviesdata = await moviesdb.find({realurl:true, "optinalurls.url":/fembed/, "optinalurls.url":{$not:/bitporno/}}).sort({_id:1}).limit(20);
        console.log("Query Cool");
        //parse cool data
        var movies = []
        for (var i = 0; i < moviesdata.length; i++) {
            var json = moviesdata[i].toJSON();
            for (var j = 0; j < json.optinalurls.length; j++) {
                if (json.optinalurls[j].url.match(/fembed/g) != null || json.optinalurls[j].url.match(/pelisplus/g) != null) {
                    movies.push({url:json.optinalurls[j].url, idmovie:json.idmovie});
                    break;
                }
            }
        }
        console.log(movies);
        for (var i = 0; i < movies.length; i++) {
            var splitmovies = movies[i].url.split(/\//);
            var idmovie = splitmovies[splitmovies.length - 1];
            startdownloadvideo("https://feurl.com/api/source/" + idmovie);

        }
    });

});



/*for (var i = 0; i < movies.length; i++) {
    var splitmovies = movies[i].split(/\//);
    var idmovie = splitmovies[splitmovies.length - 1];
    startdownloadvideo("https://feurl.com/api/source/" + idmovie);

}*/
function startdownloadvideo (urldata) {
    request.post(urldata, function(
        err,
        data,
        body
      ) {
        if (body != null) {
          var json = JSON.parse(body);
          if (json.success == false) {
            //video borrado;
            console.log("El video no existe");
            return;
          }
          var last = json.data.length - 1;

          console.log(json.data[last].file);
          //console.log(Object.keys(data.req.path));
          var keys = data.req.path.split(/\//);
          var name = keys[keys.length - 1];
          console.log(name);
          download(json.data[last].file, "./" + name + ".mp4", function(namefile) {
            uploaddata(urlbitporno, namefile);
            console.log("Download Complete " + namefile);
          });
          console.log("Download Now...");
        }
      });
}

var download = async function(uri, filename, callback) {
  request.head(uri, function(err, res, body) {
    if (err) {
      console.log(`No se pudo descargar la pelicula`);
    }
    request(uri)
      .pipe(fs.createWriteStream(filename))
      .on("close", function() {
        callback(filename);
      });
  });
};
var urlbitporno = "https://upload.bitporno.com/bp/index.php";
function uploaddata(url, name) {
  var req = request.post(url, async function(err, resp, body) {
    if (err) {
      console.log("Error!");
    } else {
      var json = JSON.parse(body);
      var fordeletename = json.files[0].name;
      try {
        fs.unlinkSync("./" + fordeletename);
      } catch (err) {
        console.error(err);
      }
      // upload Links
      console.log(json.files[0].url + " - " + fordeletename);
      updateMovie(json.files[0].url, fordeletename.replace(/.mp4/,""));
    }
  });
  var form = req.form();
  form.append("files", fs.createReadStream(name));
  form.append("page_id", "2");
  form.append("user_id", "");
  console.log("Uploading");
}

async function updateMovie(urlbit, filename) {
  var updatemovies = await moviesdb.find({realurl:true, "optinalurls.url":new RegExp(filename)}).sort({_id:1});
  if (updatemovies.length == 1) {
    console.log("actualizamos");
    var updatemovie = updatemovies[0];
    var mm = updatemovie.toJSON();
    var optinalurls = mm.optinalurls;
    optinalurls.push({url : urlbit, web : ""});
    moviesdb.findOneAndUpdate({idmovie: mm.idmovie}, {optinalurls : optinalurls}, (err, docs) => {
      console.log("Actualizado el enlace " + mm.idmovie);
    });
  }
}
