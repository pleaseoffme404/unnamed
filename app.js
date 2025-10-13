const express = require("express")
require('dotenv').config()
const mysql= require("mysql2")
const PORT = process.env.PORT
let bodyParser=require('body-parser')
let app=express()

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({
    extended:true
}))
app.use(express.static('public'))
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});
            app.listen(PORT,()=>{
                console.log('Servidor escuchando en el puerto  ' + PORT)
})