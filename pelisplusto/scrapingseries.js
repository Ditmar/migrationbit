"use strict";
import axios from "axios";
import sha1 from "sha1";
import jsdom from "jsdom";
import fs from "fs";
import cli from "cli-color";
import mongoose from "mongoose";
import tunnel from "tunnel-ssh";
//var urls = "https://pelisplushd.net/peliculas?page=";
var urls = "https://pelisplushd.net/serie/rick-and-morty";
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
      var seriesdb = mongoose.model("series", thingSchema);
      console.log("Request Url");
      const html = await this.makeRequest(urls);

      this.getDataSeries(html, urls);
      const result = html.match(
        /https:\/\/pelisplushd\.net\/(serie|anime)\/[\w\-]+\/\w+\/\d\/\w+\/\d{1,2}/g
      );
      /*if (result != null) {
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
      }*/
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
        var serieDb = mongoose.model("series", thingSchema);
        const html = await this.makeRequest(urls);
        var serieData = this.getDataSeries(html, urls);
        const caps = html.match(
          /https:\/\/pelisplushd\.net\/(serie|anime)\/[\w\-]+\/temporada\/\d\/\w+\/\d{1,2}/g
        );
        var serieData = await this.createSeassons(serieData, caps);
        console.log(serieData);
        var serie = new serieDb(serieData);
        serie.save().then(() => {
          console.log("Insertado!");
          return;
        });
      });
    });
  }
  async createSeassons(serieData, caps) {
    return new Promise(async (resolve, reject) => {
      var capsForTemp = {};
      for (var i = 0; i < caps.length; i++) {
        var item = caps[i];
        if ((data = item.match(/temporada\/\d/g)) != null) {
          var key = data[0].replace(/\//g, " ");
          key =
            key.toLocaleUpperCase().substr(0, 1) + key.substr(1, key.length);
          if (capsForTemp[key] == null) {
            capsForTemp[key] = new Array();
          }
          var html = "";
          while ((html = await this.makeRequest(item)) == "error");
          console.log(html.substr(0, 30));
          var data = this.getDataMovie(html, item);
          capsForTemp[key].push(data);
        }
      }
      var keys = Object.keys(capsForTemp);
      for (var i = 0; i < keys.length; i++) {
        serieData.seasons.push({
          season: keys[i],
          capitulos: capsForTemp[keys[i]].reverse(),
        });
      }
      resolve(serieData);
    });
  }
  getDataSeries(html, urlpage) {
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
    var serieObject = {
      idserie: sha1(urlpage).substr(0, 7),
      visible: false,
      title,
      uploadDate: new Date(),
      poster: poster,
      originaltitle: englishtitle,
      year: date,
      sinopsis: sinopsis,
      repart: "",
      category: category,
      seasons: new Array(),
    };
    return serieObject;
    /*
    "idserie" : "74ab7e8",
	"visible" : true,
	"title" : "Malcolm",
	"uploadDate" : ISODate("2020-08-30T21:26:26.035-04:00"),
	"poster" : "https://static.noimg.net/serie/cover/original/878f5da13f4b8ac18c31c57fa6721798.jpg",
	"originaltitle" : "Malcolm in the Middle",
	"year" : "2000",
	"sinopsis" : "Sitcom familiar que aborda los divertidos problemas y situaciones de una familia americana de clase media en la que el hijo Malcolm (Frankie Muniz) parece ser el único sensato... o al menos el único que da señales de cordura. La familia está compuesta por sus neuróticos padres Hal (Bryan Cranston) y Lois (Jane Kaczmarek), el hermano mayor Francis (Christopher Kennedy Masterson) y sus otros dos hermanos, Reese (Justin Berfield) y Dewey (Erik Per Sullivan) !!!.",
	"repart" : "Bryan Cranston, Christopher Masterson, Erik Per Sullivan, Frankie Muniz, Jane Kaczmarek",
    */
  }
  getDataMovie(html, urlpage) {
    console.log("--> " + urlpage);
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
    var cap = urlpage.match(/\d{1,2}/g);

    var movie = {
      titlename: "Capítulo " + cap[1],
      urlpage: urlpage,
      count: 0,
      poster,
      spanishtitle: title.replace(/\n/g, ""),
      spanishtitle_search: title.toLocaleLowerCase(),
      title: title.replace(/\n/g, ""),
      searchtitle: englishtitle.replace(/\n/g, ""),
      date,
      sinopsis: sinopsis.replace(/\n/g, ""),
      category,
      idcap: sha1(urlpage).substr(0, 7),
      realurl: true,
      language: "-",
      update: new Date(),
      url,
      optionalurls: optinalurls,
      monetize: true,
    };
    return movie;
  }
  makeRequest(url) {
    //.get(url)
    return new Promise((resolve, reject) => {
      axios({
        method: "get",
        url: url,
        timeout: 5 * 1000,
      })
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          // handle error
          resolve("error");
        });
    });
  }
}
const scrapping = new Scrapping();
scrapping.runScraping();
