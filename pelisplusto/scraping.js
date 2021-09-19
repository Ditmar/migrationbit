"use strict";
import axios from "axios";
import sha1 from "sha1";
import jsdom from "jsdom";
import fs from "fs";
import cli from "cli-color";
import mongoose from "mongoose";
import tunnel from "tunnel-ssh";
var urls = "https://pelisplushd.net/";
/*var urls =
  "https://pelisplushd.net/anime/los-caballeros-del-zodiaco-la-saga-de-hades";*/
var stdin = process.openStdin();
var page = 1;
class Scrapping {
  constructor() {
    this.config = {
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
  }
  async runNosshScrapping() {
    mongoose.connect("mongodb://0.0.0.0:27017/moviedb", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    var db = mongoose.connection;
    db.on("error", console.error.bind(console, "DB connection error:"));
    db.once("open", async () => {
      console.log("succes connecto to server");
      console.log("Init Scrapping");
      var Schema = mongoose.Schema;
      var thingSchema = new Schema({}, { strict: false });
      var moviesdb = mongoose.model("movies", thingSchema);
      const html = await this.makeRequest(urls);
      const result = html.match(
        /https:\/\/pelisplushd\.net\/pelicula\/[\w\-]+/g
      );
      if (result != null) {
        result.forEach(async (urlpage) => {
          console.log("Get Data from " + urlpage);
          var html = await this.makeRequest(urlpage);
          var movieData = this.getDataMovie(html, urlpage);
          var mov = new moviesdb(movieData);
          mov.save().then(() => {
            console.log("Insertado!");
            return;
          });
        });
      } else {
        console.log("La pelicula ya existe!");
      }
    });
  }
  async runScraping() {
    tunnel(this.config, (error, server) => {
      if (error) {
        console.log("SSH connection error: " + error);
      }
      mongoose.connect("mongodb://0.0.0.0:27017/moviedb", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      var db = mongoose.connection;
      db.on("error", console.error.bind(console, "DB connection error:"));
      db.once("open", async () => {
        console.log("succes connecto to server");
        console.log("Init Scrapping");
        var Schema = mongoose.Schema;
        var thingSchema = new Schema({}, { strict: false });
        var moviesdb = mongoose.model("movies", thingSchema);
        for (var i = page; i > 0; i--) {
          console.log("Scrapping to " + urls + i);
          //var html = await this.makeRequest(urls + i);
          var html = await this.makeRequest(urls);
          const result = html.match(
            /https:\/\/pelisplushd\.net\/pelicula\/[\w\-]+/g
          );
          if (result != null) {
            for (var j = 0; i < result.length; j++) {
              var urlpage = result[j];
              console.log("Get Data from " + urlpage);
              html = await this.makeRequest(urlpage);
              var movieData = this.getDataMovie(html, urlpage);

              var checkmovie = await moviesdb.findOne({
                idmovie: movieData.idmovie,
              });
              if (checkmovie == null) {
                var mov = new moviesdb(movieData);
                var r = await mov.save();
                console.log(r);
                console.log("Insertado");
              }
            }
          }
        }
      });
    });
  }
  async onlyOneMovie(urlpage) {
    tunnel(this.config, (error, server) => {
      if (error) {
        console.log("SSH connection error: " + error);
      }
      mongoose.connect("mongodb://0.0.0.0:27017/moviedb", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      var db = mongoose.connection;
      db.on("error", console.error.bind(console, "DB connection error:"));
      db.once("open", async () => {
        console.log("succes connecto to server");
        console.log("Init Scrapping");
        console.log("One Movie code start");
        var Schema = mongoose.Schema;
        var thingSchema = new Schema({}, { strict: false });
        var moviesdb = mongoose.model("movies", thingSchema);
        var html = await this.makeRequest(urlpage);
        var movieData = this.getDataMovie(html, urlpage);

        var checkmovie = await moviesdb.findOne({
          idmovie: movieData.idmovie,
        });
        if (checkmovie == null) {
          var mov = new moviesdb(movieData);
          var r = await mov.save();
          console.log(r);
          console.log("Insertado");
        } else {
          console.log("the movie already exist!");
        }
      });
    });
  }
  getDataMovie(html, urlpage) {
    const dom = new jsdom.JSDOM(html);
    const title = dom.window.document.querySelector("h1").textContent;
    const sinopsis =
      dom.window.document.getElementsByClassName("text-large")[0].textContent;
    //p-v-20 p-h-15 text-center
    //font-size-18 text-info text-semibold
    const genere = dom.window.document.getElementsByClassName(
      "p-v-20 p-h-15 text-center"
    )[0].textContent;
    var category = genere.trim().split(/\n+/g);
    const date = dom.window.document.getElementsByClassName(
      "font-size-18 text-info text-semibold"
    )[0].textContent;
    const englishtitle = dom.window.document.getElementsByClassName(
      "text-opacity m-b-20 font-size-13"
    )[0].textContent;
    const poster = dom.window.document.getElementsByTagName("img")[0].src;
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
      urlpage: urlpage,
      count: 0,
      realpath: "",
      token: "",
      poster,
      spanishtitle: title,
      spanishtitle_search: title.toLocaleLowerCase(),
      title,
      searchtitle: englishtitle,
      date,
      duration: "-",
      sinopsis,
      category,
      idmovie: sha1(urlpage).substr(0, 7),
      active: true,
      realurl: true,
      language: "-",
      update: new Date(),
      url,
      optinalurls: optinalurls,
      monetize: true,
    };
    return movie;
  }
  makeRequest(url) {
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
}
const scrapping = new Scrapping();
//scrapping.runScraping();
scrapping.onlyOneMovie(
  "https://pelisplushd.net/pelicula/space-jam-nuevas-leyendas"
);
