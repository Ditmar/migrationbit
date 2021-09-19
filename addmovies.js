var request = require("request");
var sha1 = require("sha1");
var stdin = process.openStdin();
var fs = require("fs");
var clc = require("cli-color");
var google = /file=[\w\-]+/g;
//var urls = "https://omeg-cf696.firebaseio.com/.json";
//var urls = "http://40.84.131.201/Series/charla-c5a02-2e43e-export.json";
//var urls = "https://cars-8feb0.firebaseio.com/.json";
var urls = "https://s3.eu-central-1.wasabisys.com/dayams/ervices.json";
//var urls = "https://my-horoscopo-y-tarot.firebaseio.com/.json";
//var urls = "https://charla-c5a02-2e43e.firebaseio.com/.json";
//var urls = "https://mov-serie-ani.firebaseio.com/.json";
//var urls = "https://radio-json.herokuapp.com/peliculas";
//var urls = "https://pelisrayo.blogspot.com/2019/12/peliculas.html";
var id = "3485";
var title = "Greyhound";
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
    request(urls, async (err, docs, body) => {
      console.log("Datos recuperados");
      var cad = body.toString().match(regularparse);
      //cad = cad.reverse();
      for (var i = 0; i < cad.length; i++) {
        try {
          var json = JSON.parse(cad[i]);
          //console.log(json);
          if (
            json.opcion1.match(/storage\.googleapis/g) != null ||
            json.opcion1.match(/s3.us-west-1/) != null
          ) {
            var movie = {};
            movie["urlpage"] = urls;
            movie["count"] = 0;
            movie["realpath"] = "";
            movie["token"] = "";
            movie["poster"] = json.image;
            movie["spanishtitle"] = json.title;
            movie["spanishtitle_search"] = json.title.toLowerCase();
            movie["title"] = json.title;
            movie["searchtitle"] = json.title.toLowerCase();
            movie["date"] = json["año"] == null ? json["ano"] : json["año"];
            movie["duration"] = "-";
            movie["sinopsis"] = json.description;
            //var category = [];
            var category = json.categoria.split(",");
            var cat = [];
            for (var j = 0; j < category.length; j++) {
              if (category[j] != "Peliculas") {
                cat.push(category[j].replace(/R\-/g, ""));
              }
            }
            //category.push(json.categoria);
            movie["category"] = cat;
            movie["idmovie"] = sha1(json.opcion1).substring(0, 8);
            movie["active"] = true;
            movie["realurl"] = true;
            movie["language"] = "-";
            movie["update"] = new Date();
            //movie["update"] = new Date(2019,9,2);
            movie["url"] = json.opcion1;
            movie["optinalurls"] = [];
            movie["monetize"] = false;
            MOVIES.push(movie);
          } else {
            console.log("NO tiene URL EN DRIVE");
          }
        } catch (err) {
          console.log("ERROR");
        }
      }
      //searchMovie();
      initMigration();
      //console.log(cad[0]);
    });
  });
});
async function searchMovie() {
  for (var i = 0; i < MOVIES.length; i++) {
    if (MOVIES[i].title == "WALL·E") {
      var googleok = await doRequestGoogle(MOVIES[i].url);
      if (googleok) {
        var mov = new moviesdb(MOVIES[i]);
        mov.save().then(() => {
          console.log("Insertado!");
          return;
        });
      }
    }
  }
}
async function initMigration() {
  console.log("CHECK IF THE MOVIE are in the database");
  //MOVIES = MOVIES.reverse();
  for (var i = 0; i < MOVIES.length; i++) {
    if (MOVIES[i].url == "") {
      console.log("NO TIENE URL");
      continue;
    }
    console.log("====>  ");
    var data = await moviesdb.find({ idmovie: MOVIES[i].idmovie });
    if (data.length == 1) {
      console.log("Ya se inserto " + MOVIES[i].title + " " + MOVIES[i].idmovie);
      continue;
    }

    var data = await moviesdb.find({ url: MOVIES[i].url });
    if (data.length == 1) {
      console.log(
        "La url ya existe " + MOVIES[i].title + " " + MOVIES[i].idmovie
      );
      continue;
    }
    console.log("==> CHECK! ");
    console.log(MOVIES[i].title);
    if (MOVIES[i].title.match(/Midway/i) == null) {
      var googleok = await doRequestGoogle(MOVIES[i].url);

      if (data.length == 0 && googleok) {
        //console.log("DESEA AGREGAR LA PELICULA " + MOVIES[i].title + "A la base de datos (Y)");
        console.log(MOVIES[i]);
        var resulttitle = await moviesdb.find({ title: MOVIES[i].title });
        if (resulttitle.length == 1) {
          console.log("deseas Actualizar con el nuevo enlace");
          var s = await readKeyboard();
          if (s.toString().match(/y/g) != null) {
            console.log("UPDATE");
            var awaitdata = await moviesdb.update(
              { title: MOVIES[i].title },
              { $set: { url: MOVIES[i].url } }
            );
            console.log(awaitdata);
          }
        } else {
          var s = await readKeyboard();
          console.log(s.toString());
          if (s.toString().match(/y/g) != null) {
            console.log("SE AGREGO A LA BASE DE DATOS");
            var mov = new moviesdb(MOVIES[i]);
            mov.save().then(() => {
              console.log("Insertado!");
            });
          } else {
            console.log("WOOPS");
          }
        }
      } else {
        console.log("Algo anda mal");
      }
    }
  }
}
function readKeyboard() {
  return new Promise((resolve, reject) => {
    try {
      stdin.addListener("data", function (d) {
        resolve(d);
      });
    } catch (err) {
      reject();
    }
  });
}
function doRequestGoogle(url) {
  return new Promise(function (resolve, reject) {
    checkopenGoogle(url, function (result) {
      try {
        resolve(result);
      } catch (error) {
        reject(false);
      }
    });
  });
}

function checkopenGoogle(url, callback) {
  var c = 0;
  try {
    var r = request
      .get(url, { timeout: 1700 })
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
