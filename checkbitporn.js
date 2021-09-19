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
    privateKey:require('fs').readFileSync('/Users/Ditmar/peliscastserver/newserverditmar.pem'),
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
        console.log("DB connection successful!");
        var Schema = mongoose.Schema;
        var thingSchema = new Schema({}, { strict: false });
        moviesdb = mongoose.model('movies', thingSchema);
        console.log("Try do query");
        var moviesdata = await moviesdb.find({"optinalurls.url" : /bitporno/}).sort({count:-1});
        for (var i = 0; i < moviesdata.length; i++) {
            var json = moviesdata[i].toJSON();
            for (var j = 0; j < json.optinalurls.length; j++) {
                if (json.optinalurls[j].url.match(/bitporno/)) {
                    var result = await review(json, j);
                    console.log(result);
                }
            }
        }
    });
});

var suma = 0;

async function review (json, j) {
    return new Promise((resolve, reject) => {
        request(json.optinalurls[j].url, function (err, request, body) {
            if (err) {
                resolve("Error ==> " +json.title + "                              cantidad = " + json.count + " Id= " + json.idmovie);
                return;
            }
            if (body.match(/<title>404<\/title>/g) != null) {
                resolve("Error ==> " +json.title + "                              cantidad = " + json.count + " Id= " + json.idmovie);
                //console.log(json.title + " " + json.idmovie);
                return;
            }
            suma += json.count;
            resolve("OK ==> " +json.title + "                        cantidad = " + json.count + " Id= " + json.idmovie + "Total = " + suma );
        });
    });
}


