var http = require("http");
    fs = require('fs');
var data = fs.readFileSync('./googleresult.html');
var regularexpresion = /data-iurl=\"https:\/\/[\w\-.\/?=%]+/g;
var listimages = data.match(regularexpresion);
var eventodeservidor = function (request, response) {
    response.writeHeader(200, {'Content-Type':'text/html'});
    
    response.write(data);
    response.end();
}
var server = http.createServer(eventodeservidor);

var port = 8080;
server.listen(port, function () {
    console.log("Corriendo en " + port);
});