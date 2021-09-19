var request = require("request");
var fs = require("fs");
var regularparse = /\{[\s\S]+?\}/g;
var url = "http://barriokalenton.com/jsonpeliculas/peliculas.txt";
var json = [];
var request = require("request");
var mongoose = require('mongoose');
var tunnel = require('tunnel-ssh');
var filename = "./database.json";
var config = {
    username:'ubuntu',
    host:'3.13.42.15',
    agent : process.env.SSH_AUTH_SOCK,
    privateKey:require('fs').readFileSync('/Users/Ditmar/peliscastserver/newserverditmar.pem'),
    port:22,
    dstPort:27017,
    password:''
};
var server = tunnel(config, function (error, server) {
    if(error){
        console.log("SSH connection error: " + error);
    }
    mongoose.connect('mongodb://0.0.0.0:27017/moviedb', { useNewUrlParser: true, useUnifiedTopology:true});
    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'DB connection error:'));
    db.once('open', async function() {
        console.log("DB connection successful!");
        var Schema = mongoose.Schema;
        var thingSchema = new Schema({}, { strict: false });
        moviesdb = mongoose.model('movies', thingSchema);
        console.log("Try do query");

        readfile(filename, async (body) => {
            var cad = body;
            var result = JSON.parse(cad);
            //var result = cad.match(regularparse);
            console.log(result);
            for (var u = 0; u < result.length; u++) {
                try {
                    var son = (result[u])
                    son.title = son.title.replace(/\(.+?\)/g,"");
                    var regular1 = new RegExp("^" + son.title + "$", "g");
                    var regular2 = new RegExp(son.title.toLowerCase(), "g");
                    var moviesdata1 = await moviesdb.find({      title : regular1, realurl: true}).sort({count:-1});
                    var moviesdata2 = await moviesdb.find({searchtitle : regular2, realurl: true}).sort({count:-1});
                    
                    var moviesdata3 = await moviesdb.find({spanishtitle : regular1, realurl: true}).sort({count:-1});
                    var moviesdata4 = await moviesdb.find({spanishtitle_search : regular2, realurl: true}).sort({count:-1});
                    
                    
                    if (moviesdata1.length == 0 && moviesdata2.length == 0 &&
                        moviesdata3.length == 0 && moviesdata4.length == 0) {
                            console.log("==> NO ENCONTRO " + son.title);
                            console.log(son.opcion1);
                    } 
                    if (moviesdata1.length == 1 && moviesdata1[0].toJSON().token != "PLAY") {
                        console.log("ENCONTRO link 1 " + u)
                        console.log(son.title);
                        var m = moviesdata1[0].toJSON();
                        console.log(m.title);
                        if (son.opcion1 != "") {
                            moviesdb.findOneAndUpdate({idmovie: m.idmovie}, {url : son.opcion1, token: "PLAY"}, (err, docs) => {
                                console.log("Actualizado el enlace " + m.idmovie);
                              });
                        } else {
                            console.log("NO tiene el enlace en latino -- REVISA " + m.idmovie);
                            console.log(son.opcion1);
                        }
                        
                        continue;
                    }
                    if (moviesdata2.length == 1 && moviesdata2[0].toJSON().token != "PLAY") {
                        console.log("ENCONTRO link 2"+ u)
                        console.log(son.title);
                        var m = moviesdata2[0].toJSON();
                        console.log(m.searchtitle);
                        if (son.opcion1 != "") {
                            moviesdb.findOneAndUpdate({idmovie: m.idmovie}, {url : son.opcion1, token: "PLAY"}, (err, docs) => {
                                console.log("Actualizado el enlace " + m.idmovie);
                              });
                        } else {
                            console.log("NO tiene el enlace en latino -- REVISA " + m.idmovie);
                            console.log(son.opcion1);
                        }
                        continue;
                    }

                    if (moviesdata3.length == 1 && moviesdata3[0].toJSON().token != "PLAY") {
                        console.log("ENCONTRO link 3 "+ u)
                        console.log(son.title);
                        var m = moviesdata3[0].toJSON();
                        console.log(m.spanishtitle);
                        if (son.opcion1 != "") {
                            moviesdb.findOneAndUpdate({idmovie: m.idmovie}, {url : son.opcion1, token: "PLAY"}, (err, docs) => {
                                console.log("Actualizado el enlace " + m.idmovie);
                              });
                        } else {
                            console.log("NO tiene el enlace en latino -- REVISA " + m.idmovie);
                            console.log(son.opcion1);
                        }
                        continue;
                    }

                    if (moviesdata4.length == 1 && moviesdata4[0].toJSON().token != "PLAY") {
                        console.log("ENCONTRO link 4 "+ u)
                        console.log(son.title);
                        var m = moviesdata4[0].toJSON();
                        console.log(m.spanishtitle_search);
                        if (son.opcion1 != "") {
                            moviesdb.findOneAndUpdate({idmovie: m.idmovie}, {url : son.opcion1, token: "PLAY"}, (err, docs) => {
                                console.log("Actualizado el enlace " + m.idmovie);
                              });
                        } else {
                            console.log("NO tiene el enlace en latino -- REVISA " + m.idmovie);
                            console.log(son.opcion1);
                        }
                        continue;
                    }
                } catch(err) {
        
                }
                
            }
        });
        //var moviesdata = await moviesdb.find({"realurl" : true}).sort({count:-1});
    });
});
function readfile (path, callback) {
    var data = fs.readFileSync(path);
    callback(data.toString());
}