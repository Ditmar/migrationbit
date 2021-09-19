const request = require("request");
var mongoose = require("mongoose");
var tunnel = require("tunnel-ssh");
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
    var count = 900;
    var movies = await moviesdb
      .find({ realurl: true, url: /googleapis/i })
      .sort({ update: -1 })
      .skip(0);
    console.log(movies.length);
    for (var i = 0; i < 20; i++) {
      var title = movies[i].toJSON().title;
      var poster = movies[i].toJSON().poster;
      var url = await getLink(title);
      var data = {
        title,
        poster,
        url: url,
      };
      console.log(data);
    }
  });
});
function getLink(title) {
  return new Promise((resolve, reject) => {
    var data = {
      query:
        "\n        query($term: String!, $first: Int!) {\n          results: allMovies (search: $term, first: $first) {\n            id\n            slug\n            title\n            duration\n            rating\n            releaseDate\n            poster\n          }\n        }\n      ",
      variables: { term: title, first: 1 },
    };
    var req = {
      url: "https://repelis.io/graph",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      json: data,
    };

    request(req, (error, response, body) => {
      var url = "none";
      if (body.data.results.length == 1) {
        url =
          "https://repelis.io/pelicula/" +
          body.data.results[0].slug +
          "-" +
          body.data.results[0].id;
      }
      resolve(url);
    });
  });
}
