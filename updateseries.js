var request = require("request");
var mongoose = require("mongoose");
var tunnel = require("tunnel-ssh");
var idserie = "74ab7e8";
var urlserie = "https://magincio809.blogspot.com/2020/08/malcolm-en-el-medio.html";
var config = {
  username: "ubuntu",
  host: "3.13.42.15",
  agent: process.env.SSH_AUTH_SOCK,
  privateKey: require("fs").readFileSync(
    "/Users/Ditmar/peliscastserver/newserverditmar.pem"
  ),
  port: 22,
  dstPort: 27017,
  password: ""
};
var server = tunnel(config, function(error, server) {
  if (error) {
    console.log("SSH connection error: " + error);
  }
  mongoose.connect("mongodb://0.0.0.0:27017/moviedb", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  var db = mongoose.connection;
  db.on("error", console.error.bind(console, "DB connection error:"));
  db.once("open", async function() {
    console.log("CONNECT");
    var Schema = mongoose.Schema;
    var thingSchema = new Schema({}, { strict: false });
    seriesdb = mongoose.model("series", thingSchema);
    var seriesdata = await seriesdb.find({ idserie: idserie });
    var seriejson = seriesdata[0].toJSON();
    var json = await getLinks();
    //console.log(json)
    for (var i = 0; i < seriejson.seasons.length; i++) {
      var idstring = seriejson.seasons[i].season.match(/\d+/g);
      if (idstring != null) {
        let id = Number(idstring[0]);
        //console.log(id);
        for (var j = 0; j < seriejson.seasons[i].capitulos.length; j++) {
          var titlestring = seriejson.seasons[i].capitulos[j].titlename.match(
            /\d+/g
          );
          if (titlestring != null) {
            let idtitle = Number(titlestring[0]);
            //seriejson.seasons[i].capitulos[j].url = "";
            for (var k = 0; k < json.length; k++) {
              /*if (json[k]["capitulo"].match(/\d+/g) == null) {
                               continue;
                           }*/
              var idcap = json[k]["capitulo"].match(/\d+:/g);
              //console.log(idcap);
              //var idcap = Number(json[k]["capitulo"].match(/\d+:/g)[0]);
              if (json[k]["Temporada"].match(/\d+/g) != null) {
                var idtem = Number(json[k]["Temporada"].match(/\d+/g)[0]);
              }
              if (idcap != null) {
                idcap = Number(idcap[0].replace(/\:/g, ""));
              } else {
                  if (json[k]["capitulo"].match(/\d+/g) != null) {
                    idcap = Number(json[k]["capitulo"].match(/\d+/g)[0]);
                  }
              }
              //console.log("DB -> Temporada " + idtem + " capitulo "+idtitle );
              //console.log("JSON ->Temporada " + id + " capitulo "+idcap );
              //Agregar revision de temporada esta modidicado para animes
              //SOLO ANIMES
              //&& idtem == id
              if (idcap == idtitle && idtem == id) {
                //console.log("Temp " + idtem + " CAP " + idcap);
                //console.log(json[k]["urlEspanol"]);
                //json.splice(k,1);
                //Agregar revision de temporada esta modidicado para animes
                //SOLO ANIMES
                if (
                  json[k]["urlEspanol"] != null &&
                  json[k]["urlEspanol"] != ""
                ) {
                  seriejson.seasons[i].capitulos[j].url = json[k]["urlEspanol"];
                  console.log("Temporada "+idtem +" Capitulo " + idcap + " Espaniol");
                  seriejson.seasons[i].capitulos[j]["monetize"] = true;
                } else if (
                  json[k]["urlLatino"] != null &&
                  json[k]["urlLatino"] != ""
                ) {
                  seriejson.seasons[i].capitulos[j].url = json[k]["urlLatino"];
                  seriejson.seasons[i].capitulos[j]["monetize"] = true;
                  console.log("Capitulo " + idcap + " Latino");
                } else if (
                  json[k]["urlEnglish"] != null &&
                  json[k]["urlEnglish"] != ""
                ) {
                  seriejson.seasons[i].capitulos[j].url = json[k]["urlEnglish"];
                  seriejson.seasons[i].capitulos[j]["monetize"] = true;
                  console.log("Capitulo " + idcap + " Japones");
                }
              }
            }
          }
        }
      }
    }
    var r = await seriesdb.update({ idserie: idserie }, { $set: seriejson });
    console.log(r);
    console.log("Serie Actualizada");

    //console.log(seriejson.seasons[0].season);
    //update
    /*for (var i = 0; i < seriejson.ses) {

        }*/

    //console.log(json);
  });
});
function getLinks() {
  return new Promise((resolve, reject) => {
    request.get(urlserie, (err, request, body) => {
      var jsontags = body.toString().match(/\{[\s\S]{10,}?\}/g);
      var jsonparse = [];
      for (var i = 0; i < jsontags.length; i++) {
        try {
          var json = JSON.parse(jsontags[i].toString());
          jsonparse.push(json);
        } catch (err) {
          //console.log(jsontags[i].toString());
        }
      }
      resolve(jsonparse);
    });
  });
}
/**/
