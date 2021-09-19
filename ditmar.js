var request = require("request");
init();
async function init () {
    var data = await doRequestGoogle("https://storage.googleapis.com/mov-serie-ani.appspot.com/Peliculas/Latino/Ver%20American%20Curious%20(2018)%20Online%20-%20Cuevana%203%20Peliculas%20Online.mp4");
    console.log(data);
}
function doRequestGoogle (url) {
    return new Promise(function (resolve, reject) {
      checkopenGoogle(url, function(result) {
       // try {
          resolve(result);
       // } catch(error) {
          //reject();
        //}
        
      })
    });
  }

  function checkopenGoogle (url, callback) {
    var c = 0;
    console.log(url);
    var r = request.get(url,{timeout:1700}).on("data", function (data) {
    c++;
    if (c > 7) {
      //callback(false);
      r.abort();
      console.log("ABORT")
      //return;
    }
  }).on('response', function(response) {
      // unmodified http.IncomingMessage object
      response.on('data', function(data) {
        // compressed data as it is received
        if (c == 0 &&  data.toString().match(/NoSuchBucket/g) != null |  data.toString().match(/key does not exist/g) != null | data.toString().match(/AccessDenied/g) != null | data.toString().match(/ExpiredToken/) != null | data.toString().match(/InsufficientQuota/g) != null) {
          console.log("FALLA")
          callback(false, "Enlace Roto");
        }
        if (c > 5) {
          console.log("SI")
          callback(true, "Cool");
        }
      })
    });
  }
