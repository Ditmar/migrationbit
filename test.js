const request = require("request");
const agent = request.defaults({jar: true})
const url = "https://www.bitporno.com/?c=login";
agent.get(url, (err, docs) => {
  console.log(docs.body);
  var result = docs.body.match(/\/simple-php-captcha[.]php\?.+\"/g);
  console.log(result);
});