"use strict";
import axios from "axios";
import sha1 from "sha1";
import jsdom from "jsdom";
import fs from "fs";
import cli from "cli-color";
import mongoose from "mongoose";
import tunnel from "tunnel-ssh";
var config = {
  username: "ubuntu",
  host: "3.131.211.196",
  agent: process.env.SSH_AUTH_SOCK,
  privateKey: fs.readFileSync(
    "/Users/Ditmar/peliscastserver/newserverditmar.pem"
  ),
  port: 22,
  dstPort: 27017,
  password: "",
};

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
    var movies = await moviesdb
      .find({ realurl: true, url: /pelisplushd.net/g })
      .sort({ _id: -1 })
      .skip(0);
    console.log(movies.length);
    for (var i = 183; i < 1000; i++) {
      var id = movies[i].toJSON().idmovie;
      console.log(i + ") movie " + movies[i].toJSON().title);
      console.log(i + ") movie " + movies[i].toJSON().urlpage);
      //var html = await makeRequest(movies[i].toJSON().urlpage);
      var html = "";
      while ((html = await makeRequest(movies[i].toJSON().urlpage)) == "error");
      var result = getDataMovie(html, movies[i].toJSON().urlpage);
      console.log(result);
      await moviesdb.findOneAndUpdate({ idmovie: id }, result);
      console.log("Update");
    }
  });
});

function getDataMovie(html, urlpage) {
  var url = "";
  var optinalurls = [];
  var streambs = /https:\/\/streamsb\.net\/[\w\-\.\=]+/g;
  var pelisplus = /https:\/\/pelisplushd\.net\/fembed[\?\w\-\.\=]+/g;
  var upstream = /https:\/\/upstream\.to\/[\w\-\.\=]+/g;
  var mystream = /https:\/\/embed.mystream.to\/[\w\-\.\=]+/g;
  var uqload = /https:\/\/uqload.com\/[\w\-\.\=]+/g;
  if (html.match(streambs) != null) {
    url = html.match(streambs)[0];
    const id = url.match(/embed\-\w+/g)[0].split("-")[1];
    url = `https://streamsb.net/play/${id}?auto=1&referer=&`;
    optinalurls.push({ url, web: url });
  }
  if (html.match(pelisplus) != null) {
    if (url == "") {
      url = html.match(pelisplus)[0];
    }
    optinalurls.push({
      url: html.match(pelisplus)[0],
      web: html.match(pelisplus)[0],
    });
  }
  if (html.match(upstream) != null) {
    optinalurls.push({
      url: html.match(upstream)[0],
      web: html.match(upstream)[0],
    });
  }
  if (html.match(mystream) != null) {
    if (url == "") {
      url = html.match(mystream)[0];
    }
    optinalurls.push({
      url: html.match(mystream)[0],
      web: html.match(mystream)[0],
    });
  }
  if (html.match(uqload) != null) {
    optinalurls.push({
      url: html.match(uqload)[0],
      web: html.match(uqload)[0],
    });
  }
  var movie = {
    url,
    optinalurls: optinalurls,
    monetize: true,
  };
  return movie;
}
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    axios
      .get(url)
      .then((response) => {
        resolve(response.data);
      })
      .catch(function (error) {
        // handle error
        resolve("error");
      })
      .then(function () {
        //resolve(response.data);
      });
  });
}
