var str = "Hi! i'm {name} and i'm {age} years old";
var data = {name: 'Pepe', age: 16};  // datos por los que reemplazar
console.log(dd);
var result = str.replace(/\{(.+?)\}/g, function(match, key) {
    console.log(key);
    return data[key];
});
console.log(result);