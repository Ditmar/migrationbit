var request = require("request");
var fs = require("fs");
var mongoose = require("mongoose");
var tunnel = require("tunnel-ssh");
var uqloadlink = /https:\/\/\w+[.]uqload.com\/[\w-]+\/v.mp4/g;
var total = 0;
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
/*async function bitdata () {
  //https://storage.googleapis.com/mov-serie-ani.appspot.com/Peliculas/Latino/el%20resplador%20%20(1980)%20%20lat.mp4
  //https://www.bitporno.com/v/GB5UDZWP3Y
  var r = await doRequestBitporno('https://www.bitporno.com/v/GB5UDZWP3Y');
  
  //var r = await doRequestGoogle('https://storage.googleapis.com/mov-serie-ani.appspot.com/Peliculas/Latino/Ver%20El%20secreto%20de%20Marrowbone%20(2017)%20Online%20-%20Cuevana%203%20Peliculas%20Online.mp4');
  console.log(r)
}
bitdata();
return;*/
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
    // we're connected!
    console.log("DB connection successful!");
    var Schema = mongoose.Schema;
    var thingSchema = new Schema({}, { strict: false });
    moviesdb = mongoose.model("movies", thingSchema);
    var data = await moviesdb
      .find({ url: /storage.googleapis/, realurl: true })
      .skip(10);
    console.log(data.length);
    for (var i = 0; i < data.length; i++) {
      var movies = data[i].toJSON();
      var links = [];
      links.push(movies.url);
      if (movies.optinalurls != null) {
        for (var j = 0; j < movies.optinalurls.length; j++) {
          links.push(movies.optinalurls[j].url);
        }
      }
      console.log("Probando " + movies.title);
      var result = await checklinks(links);
      console.log(links);
      total++;
      if (result) {
        console.log(total + ".- AUN FUNCIONA " + movies.idmovie);
        moviesdb.findOneAndUpdate(
          { idmovie: movies.idmovie },
          { realurl: true },
          (err, docs) => {
            console.log("Actualizado a verdadero");
          }
        );
      } else {
        console.log(total + ".- MUERTO " + movies.idmovie);
        moviesdb.findOneAndUpdate(
          { idmovie: movies.idmovie },
          { realurl: false },
          (err, docs) => {
            console.log("Actualizado enlace a falso");
          }
        );
      }
    }
    console.log("TERMINA PROCESO");
    //console.log(data);
  });
});
/*async function init () {
    console.log("Init");
    var result = await checklinks(["https://www.pelisplus.net/v/5878gadn087gx4j", "https://uqload.com/embed-7qahqsuvuffx.html", "https://gounlimited.to/embed-q94xymcuf32x.html", "https://www.bitporno.com/v/GB6EQTJFFI"]);
    console.log(result);
}
init();*/

async function checklinks(datalinks) {
  return new Promise(async (resolve, reject) => {
    try {
      //var total = datalinks.length;
      var count = 0;
      for (var i = 0; i < datalinks.length; i++) {
        /*if (datalinks[i].match(/fembed/)) {
                var data = await doRequestFembed(datalinks[i]);
                    if (data) {
                        count++; 
                    }
              } else*/ if (
          datalinks[i].match(/storage.googleapis/g)
        ) {
          var data = await doRequestGoogle(datalinks[i]);
          if (data) {
            count++;
          }
        } else if (datalinks[i].match(/bitporno/g)) {
          var data = await doRequestBitporno(datalinks[i]);
          if (data) {
            count++;
          }
        }
      }
      if (count == 0) {
        resolve(false);
      } else {
        console.log(count);
        resolve(true);
      }
    } catch (e) {
      reject();
    }
  });
}

function doRequestRepelisGo(id) {
  return new Promise(function (resolve, reject) {
    checkRepelis(id, function (result) {
      resolve(result);
    });
  });
}
//doRequestPremium
function doRequestPremium(url) {
  return new Promise(function (resolve, reject) {
    checkpremium(url, function (result) {
      resolve(result);
    });
  });
}
function doRequestBitporno(url) {
  return new Promise(function (resolve, reject) {
    checkbitporno(url, function (result) {
      resolve(result);
    });
  });
}
function doRequestJetload(url) {
  return new Promise(function (resolve, reject) {
    checkjetload(url, function (result) {
      resolve(result);
    });
  });
}
function doRequestM3u8(url) {
  return new Promise(function (resolve, reject) {
    checkM3u8(url, function (result) {
      resolve(result);
    });
  });
}
function doRequestVidlox(url) {
  return new Promise(function (resolve, reject) {
    checkvidlox(url, function (result) {
      resolve(result);
    });
  });
}
function doRequestOpen(url) {
  return new Promise(function (resolve, reject) {
    checkopenloade(url, function (result) {
      resolve(result);
    });
  });
}

function doRequestAws(url) {
  return new Promise(function (resolve, reject) {
    checkopenGoogle(url, function (result) {
      resolve(result);
    });
  });
}
function doRequestGoogle(url) {
  return new Promise(function (resolve, reject) {
    checkopenGoogle(url, function (result) {
      resolve(result);
    });
  });
}
function doRequestGounlimited(url) {
  return new Promise(function (resolve, reject) {
    checkGounlimited(url, function (result) {
      resolve(result);
    });
  });
}
function doRequestMystream(url) {
  return new Promise(function (resolve, reject) {
    checkMyStream(url, function (result) {
      resolve(result);
    });
  });
}
function doRequestMango(url) {
  return new Promise(function (resolve, reject) {
    checkstreamango(url, function (result) {
      resolve(result);
    });
  });
}
function doRequestCuevana(url) {
  return new Promise(function (resolve, reject) {
    checkcuevanavideo(url, function (result) {
      resolve(result);
    });
  });
}
function doRequestFembed(url) {
  return new Promise(function (resolve, reject) {
    checkfembed(url, function (result) {
      resolve(result);
    });
  });
}
function doRequestUqload(url) {
  return new Promise(function (resolve, reject) {
    checkuqload(url, function (result) {
      resolve(result);
    });
  });
}
function checkRepelis(id, callback) {
  /*  var form = {"query":"\n        query($movieId: ID!) {\n          movie: Movie (id: $movieId) {\n            ...MovieFields\n            key\n            tagline\n            originalTitle\n            overview\n            trailer\n            backdrop\n            released\n            collection { id movies { ...MovieFields backdrop } }\n            removed\n            genres { id slug name }\n            mirrors {\n              id\n              quality\n              audio\n              type\n              url\n              hostname\n            }\n          }\n          related: allMovies (\n            filter: { relatedTo: $movieId }\n            order: { creation: \"DESC\" }\n            first: 21\n          ) {\n            ...MovieFields\n          }\n          comments: allComments (\n            filter: { movieId: $movieId }\n            first: 50\n          ) {\n            id\n            authorName\n            message\n            originId\n            replyCount\n            pinned\n            reactions {\n              total\n              like\n              angry\n            }\n            createdAt\n          }\n          highlighted: List (id: \"7JARd\") {\n            movies { ...MovieFields duration }\n          }\n        }\n        fragment MovieFields on Movie {\n          id\n          slug\n          title\n          duration\n          rating\n          releaseDate\n          released\n          poster\n          nowPlaying\n        }\n      ","variables":{"movieId":id}}
   request({
      headers: {
        'Content-Type': 'application/json'
      },
      uri: 'https://repelisgo.net/graph',
      json: true,
      body: form,
      method: 'POST'
    }, function (err, res, body) {
      if (body.data == undefined) {
          return false;
      }
      var processlink = body.data.movie.mirrors.filter((e) => {
        if (e.type == "stream" && e.audio == "es-mx" && (e.hostname == "repelis.io" || e.hostname == "storage.googleapis.com")) {
          return true;
        }
        return false;
      });
      /*var processlink = body.data.movie.mirrors.filter((e) => {
        if (e.type == "download" && e.audio == "es-mx" && (e.hostname == "repelis.io" || e.hostname == "storage.googleapis.com")) {
          return true;
        }
        return false;
      });
      if (processlink.length == 0) {
         processlink = body.data.movie.mirrors.filter((e) => {
          if (e.type == "stream" && e.audio == "es-es" && (e.hostname == "repelis.io" || e.hostname == "storage.googleapis.com")) {
            return true;
          }
          return false;
        });
      }
      if (processlink.length == 0) {
        callback(false);
        return;
      }
      var url = "https://repelisgo.com" + processlink[0].url;
      callback({urldata : url, status: true});
      return;
    });*/
  callback(false);
}
function checkM3u8(url, callback) {
  request.get(url, (err, docs, body) => {
    if (err) {
      callback(false, "Cool");
    }
    if (body != null && body.length > 1000) {
      callback(true, "Cool");
    } else {
      callback(false, "Cool");
    }
  });
}
function checkbitporno(url, callback) {
  request.get(url, (err, docs, body) => {
    if (err) {
      callback(false, "Cool");
      return;
    }
    var check = body.match(/We are sorry/g);
    if (check != null) {
      callback(false, "Cool");
      return;
    }
    callback(true, "Cool");
  });
}
function checkMyStream(url, callback) {
  request.get(url, { timeout: 1700 }, (err, docs) => {
    if (err) {
      callback(false, "Enlace Roto");
      return;
    }
    var data = docs.body.toString();
    if (data.match(/Video not found/g)) {
      callback(false, "Enlace Roto");
    } else {
      callback(true, "Cool");
    }
  });
}
function checkpremium(url, callback) {
  console.log("PREMIUMMMMM TEST ========>" + url);
  request.get(url, { timeout: 1700 }, (err, docs) => {
    if (err) {
      callback(true, "Enlace Roto");
      return;
    }
    var data = docs.body.toString();
    if (data.match(/ERROR/g)) {
      callback(false, "Enlace Roto");
    } else {
      callback(false, "Cool");
    }
  });
}
function checkjetload(url, callback) {
  console.log("--------------------------_>" + url);
  request.get(url, { timeout: 1700 }, (err, docs) => {
    if (err) {
      callback(false, "Enlace Roto");
      return;
    }
    var data = docs.body.toString();
    if (data.match(/encoding_status/g)) {
      callback(false, "Enlace Roto");
    } else {
      callback(false, "Cool");
    }
  });
}
function checkvidlox(url, callback) {
  request.get(url, { timeout: 1600 }, (err, docs) => {
    if (err) {
      callback(true, "Enlace Roto");
      return;
    }
    var data = docs.body.toString();
    if (data.match(/The video was deleted/g)) {
      callback(false, "Enlace Roto");
    } else {
      callback(true, "Cool");
    }
  });
}
function checkGounlimited(url, callback) {
  console.log("CHECK VERY ===> " + url);
  request.get(url, { timeout: 2700 }, (err, docs) => {
    if (err) {
      callback(false, "Enlace Roto");
      return;
    }
    var data = docs.body.toString();
    if (data.match(/File was deleted/g)) {
      console.log("NO ENLACE");
      callback(false, "Enlace Roto");
    } else {
      callback(true, "Cool");
    }
  });
}
function checkopenloade(url, callback) {
  request.get(url, { timeout: 1700 }, (err, docs) => {
    if (err) {
      callback(false, "Enlace Roto");
      return;
    }
    var data = docs.body.toString();
    if (data.match(/re Sorry/g) | data.match(/We know/g)) {
      callback(false, "Enlace Roto");
    } else {
      callback(true, "Cool");
    }
  });
}
function checkopenGoogle(url, callback) {
  var c = 0;
  var r = request
    .get(url, { timeout: 1700 })
    .on("data", function (data) {
      c++;
      if (c > 6) {
        r.abort();
      }

      //console.log("Chunks " + data);
    })
    .on("response", function (response) {
      // unmodified http.IncomingMessage object
      response.on("data", function (data) {
        // compressed data as it is received
        //ProjectNotFound
        //InsufficientQuota
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
        }
        if (c > 5) {
          callback(true, "Cool");
        }
      });
    });
}
function checkcuevanavideo(url, callback) {
  console.log("======================>>>>>>>>   ENTER CUEVANA");
  var urldata = url.split("?link=");
  var host = urldata[0];
  var token = urldata[1];
  request.post(
    host,
    { form: { link: token }, timeout: 2700 },
    (err, header, body) => {
      if (err) {
        callback(false, "NO");
        return;
      }
      try {
        var data = JSON.parse(body);
        if (data.error != null) {
          callback(false, "YEAH");
          return;
        }
        callback(true, "YEAH");
      } catch (error) {
        callback(false, "NO");
      }
    }
  );
}
function checkstreamango(url, callback) {
  request.get(url, { timeout: 1700 }, (err, docs) => {
    if (err) {
      callback(false, "Enlace Roto");
      return;
    }
    var data = docs.body.toString();
    if (data.match(/Sorry/g)) {
      callback(false, "Enlace Roto");
    } else {
      callback(true, "Cool");
    }
  });
}
function checkfembed(url, callback) {
  request.get(url, { timeout: 1700 }, (err, docs) => {
    if (err) {
      callback(false, "Enlace Roto");
      return;
    }
    var data = docs.body.toString();
    if (err) {
      callback(false);
      return;
    }
    if (
      data.match(/Sorry this video does not exist/g) ||
      data.match(/404 error/g) ||
      data.match(/DMCA/g)
    ) {
      callback(false, "Enlace Roto");
    } else {
      callback(true, "Cool");
    }
  });
}
function checkuqload(url, callback) {
  //File was deleted
  request.get(url, { timeout: 1700 }, (err, docs) => {
    if (err) {
      callback(false, "Enlace Roto");
      return;
    }
    var data = docs.body.toString();
    if (err) {
      callback(false);
      return;
    }
    if (data.match(/File was deleted/g)) {
      callback(false, "Enlace Roto");
    } else if (data.match(/Origin is unreachable/g)) {
      callback(false, "523");
    } else if (data.match(/Uqload Team/g)) {
      callback(false, "Cool");
    } else {
      callback(true, "Cool");
    }
  });
}
