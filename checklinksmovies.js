var request = require("request");
var sha1 = require("sha1");
var stdin = process.openStdin();
var fs = require("fs");
var clc = require("cli-color");
var google = /file=[\w\-]+/g;
//var urls = "https://omeg-cf696.firebaseio.com/.json";
var urls = "https://pastebin.com/raw/dWWfJELR";
//var urls = "https://cars-8feb0.firebaseio.com/.json";
//var urls = "https://charla-c5a02-2e43e.firebaseio.com/.json";
//var urls = "https://radio-json.herokuapp.com/peliculas";
//var urls = "https://pelisrayo.blogspot.com/2019/12/peliculas.html";
var mongoose = require("mongoose");
var tunnel = require("tunnel-ssh");
var regularparse = /\{[\s\S]+?\}/g;
var MOVIES = [];
var config = {
  username: "ubuntu",
  host: "3.13.42.15",
  agent: process.env.SSH_AUTH_SOCK,
  privateKey: require("fs").readFileSync(
    "/Users/Ditmar/peliscastserver/newserverditmar.pem"
  ),
  port: 22,
  dstPort: 27017,
  password: "",
};
/*async function init () {
    var r = await doRequestGoogle("https://storage.googleapis.com/mov-serie-ani.appspot.com/Peliculas/Latino/Ver%20Jigsaw-%20El%20Juego%20Contin%C3%BAa%20(Saw%208)%20Cap%C3%ADtulo%200.mp4");
    console.log(r);
}
init();*/
//return;
var moviesdb = null;
var server = tunnel(config, function (error, server) {
  if (error) {
    console.log("SSH connection error: " + error);
  }
  console.log("Conectando");
  mongoose.connect("mongodb://0.0.0.0:27017/moviedb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  var db = mongoose.connection;
  db.on("error", console.error.bind(console, "DB connection error:"));
  db.once("open", async function () {
    var Schema = mongoose.Schema;
    var thingSchema = new Schema({}, { strict: false });
    moviesdb = mongoose.model("movies", thingSchema);
    console.log("Conectando a la base de datos");
    var count = 201;
    var movies = await moviesdb
      .find({ realurl: false, url: /googleapis/i })
      .sort({ update: -1 })
      .skip(0);
    console.log("peliculas a revisar " + movies.length);
    console.log("Accediendo a datos de " + urls);
    //var datos = fs.readFileSync("./test.json", "utf8");
    request(urls, async (err, docs, body) => {
      /*if (err) {
      console.log("ERROR ");
      console.log(err);
      return;
    }*/
      var catalogo = JSON.parse(body);
      for (var i = count; i < movies.length; i++) {
        var mov = movies[i].toJSON();
        console.log(
          "-------------------------------------- " +
            count +
            "xxxxx----------------------------------------------------"
        );
        count++;
        console.log("Revisando --> " + mov.title + " id= " + mov.idmovie);
        if (mov.url.match(/googleapis/) == null) {
          console.log("url no es storage.google");
          continue;
        }
        console.log("Revisando Enlace");
        var movieresult = await doRequestGoogle(mov.url);
        if (!movieresult) {
          //var yea = await moviesdb.update({"idmovie": mov.idmovie}, {"$set" : {token: "roto"}});
          console.log("Iniciando Busqueda");
          var review = false;
          for (var j = 0; j < catalogo.length; j++) {
            if (catalogo[j].title == mov.title) {
              review = true;
              console.log("revisando enlace");
              var result = await doRequestGoogle(catalogo[j].opcion1);
              if (result) {
                var yea = await moviesdb.update(
                  { idmovie: mov.idmovie },
                  {
                    $set: {
                      url: catalogo[j].opcion1,
                      realurl: true,
                      token: "",
                    },
                  }
                );
                console.log("Actualizado ! ");
                console.log(mov.title + " " + mov.idmovie);
              } else {
                var yea = await moviesdb.update(
                  { idmovie: mov.idmovie },
                  { $set: { realurl: false } }
                );
                console.log("Quitando del catalogo ! ");
                console.log(mov.title + " " + mov.idmovie);
              }
              break;
            }
          }
          if (!review) {
            console.log("Pelicula no encontrada...");
            await moviesdb.update(
              { idmovie: mov.idmovie },
              { $set: { realurl: false, token: "Revisar links" } }
            );
            console.log("Quitando del catalogo ! ");
            console.log(mov.title + " " + mov.idmovie);
          }
        } else {
          var update = await moviesdb.update(
            { idmovie: mov.idmovie },
            { $set: { token: "" } }
          );
          console.log(update);
          console.log("is Ok! " + mov.title);
        }
      }
    });
  });
});

/*var test = async function () {
    var t = await doRequestGoogle("https://storage.googleapis.com/mov-serie-ani.appspot.com/Peliculas/Latino/Power%20Rangers-%20La%20Pel%C3%ADcula.mp4");
    console.log(t);
}*/
function doRequestGoogle(url) {
  return new Promise(function (resolve, reject) {
    checkopenGoogle(url, function (result) {
      try {
        resolve(result);
      } catch (error) {
        reject();
      }
    });
  });
}

function checkopenGoogle(url, callback) {
  var c = 0;
  try {
    var r = request
      .get(url, { timeout: 2700 })
      .on("data", function (err, data) {
        /*if (err) {
                console.log("IN");
                callback(false, "Enlace Roto");
                return;
            }*/
        c++;
        if (c > 7) {
          r.abort();
          return;
        }
      })
      .on("response", function (response) {
        // unmodified http.IncomingMessage object
        response.on("data", function (data) {
          // compressed data as it is received
          if (
            c == 0 &&
            (data.toString().match(/NoSuchBucket/g) != null) |
              (data.toString().match(/key does not exist/g) != null) |
              (data.toString().match(/AccessDenied/g) != null) |
              (data.toString().match(/ExpiredToken/g) != null) |
              (data.toString().match(/InsufficientQuota/g) != null) |
              (data.toString().match(/ProjectNotFound/g) != null)
          ) {
            console.log("FALLA");
            callback(false, "Enlace Roto");
            return;
          }
          if (c > 5) {
            callback(true, "Cool");
            return;
          }
        });
      });
  } catch (err) {
    console.log("ERROR");
    callback(false, "Enlace Roto");
  }
}
