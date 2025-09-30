const express = require("express")
const mysql= require("mysql2")

let bodyParser=require('body-parser')
let app=express()
let con=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'n0m3l0',
    database:'unnamed'
})
con.connect();

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({
    extended:true
}))
app.use(express.static('public'))
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});
app.listen(5000,()=>{
    console.log('Servidor escuchando en el puerto 5000')
})