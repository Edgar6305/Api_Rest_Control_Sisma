const express = require('express');
const router = express.Router();
const axios = require('axios');
const colors = require('colors');
const sql = require('mssql');
const bot = require("./telegram.js")
const jwt = require("jsonwebtoken")

// Base de Datos SQL SERVER
const config = {
    user: 'sa',
    password: 'A$123bcd',
    database: 'RIVHER',
    server: '18.229.172.128',
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 1000
    },
    options: {
        encrypt: true, // for azure
        trustServerCertificate: true // change to true for local dev / self-signed certs
    }
};

router.post('/Registro', async (req, res) => {
    var newData = req.body
    var user = {
        empresa: req.body.empresa,
        aplicacion: req.body.aplicacion,
        serie: req.body.serie
    }
    try {
        await sql.connect(config)
        var result = await sql.query`Select IdInstalacion From Instalaciones WHERE Empresa= ${newData.empresa} AND CodigoAplicacion= ${newData.aplicacion} AND  serie= ${newData.serie}`

        if (result.rowsAffected[0] == 0) {
            res.status(500).json({ "status": "No data" })
            var botMessage = "Se Solicito Token con credenciales erradas"
            bot.sendBot(bot.idChatBaseUno, botMessage)
        } else {
            var token = jwt.sign({ user }, 'my_secret_key')
            res.status(200).json({ "status": "Succes", "token": token })
            var botMessage = "Se envió Token Solicitado"
            bot.sendBot(bot.idChatBaseUno, botMessage)
        }
        return
    } catch (err) {
        var botMessage = "Error Descarga  " + err.message
        bot.sendBot(bot.idChatBaseUno, botMessage)
        const response = { status: err }
        res.status(401).json({ "status": "failed" })
    }
})

router.post('/login', ensureToken, async (req, res) => {
    var newData = req.body
    //console.log(req)
    try {
        res.json({ status: 'Succes', data: req.token.user })
    } catch (err) {
        var botMessage = "Error Descarga  " + err.message
        bot.sendBot(bot.idChatBaseUno, botMessage)
        const response = { status: err }
        res.status(401).json({ "status": "failed" })
    }
})

router.post('/movimiento', ensureToken, async (req, res) => {
    //console.log(req.body)
    //console.log(req.token.user.serie)
    var comentario = ""
    try {
        await sql.connect(config)
        var mysql = "SELECT * FROM ChequeoUsuarios WHERE Empresa='" + req.body.empresa + "' AND CodigoAplicacion='" + req.body.aplicacion + "' AND SerieCliente='" + req.body.serie + "'"
        var result = await sql.query(mysql)
        if (result.rowsAffected[0] == 0) {
            comentario += "Equipo SIN Registro"
        } else {
            comentario += "Revisión terminada Satisfactoriamente"
        }

        await sql.connect(config)
        result = await sql.query`INSERT INTO  Movimientos Values(${req.body.empresa}, ${req.body.aplicacion}, ${req.body.serie}, GetDate(), ${comentario}, ${req.body.usuario} )`
        if (result.rowsAffected[0] == 0) {
            var botMessage = "Error al Grabar Revisión Empresa " & req.body.empresa & " Aplicación" & req.body.aplicacion
            bot.sendBot(bot.idChatBaseUno, botMessage)
            res.status(500).json({ "status": "ERROR" })
        } else {
            var botMessage = "Se Grabo Revisión Empresa " + req.token.user.empresa + " " + comentario
            bot.sendBot(bot.idChatBaseUno, botMessage)
            if (comentario == "Equipo SIN Registro") {
                res.status(200).json({ "status": 'FAILED' })
            } else {
                res.status(200).json({ "status": 'OK' })
            }
        }
    }
    catch (err) {
        var botMessage = "Error Descarga  " + err.message
        bot.sendBot(bot.idChatBaseUno, botMessage)
        const response = { status: err }
        res.status(401).json({ "status": "FAILED" })
    }
})


router.post('/avisos', ensureToken, async (req, res) => {
    var newData = req.token.user
    console.log(req.body.empresa) // Aqui Pasa el Usuario que hace la peticio
    try {
        await sql.connect(config)
        const xSql =`Select Tipo, Aviso, NombreAplicacion, Permanencia From Avisos WHERE Empresa='${newData.empresa}' AND CodigoAplicacion='${newData.aplicacion}' AND Estado='AC'`
        var result = await sql.query (xSql)
        //console.log(result.recordset)
        if (result.rowsAffected[0] == 0){
            var botMessage ="NO hay Avisos para " + " Empresa " + newData.empresa + " Usuario " +  req.body.empresa
            bot.sendBot(bot.idChatBaseUno, botMessage)
            res.status(500).json({ "status": "No data" })
        }else{
            const Persiste=result.recordset[0].Permanencia
            const myTipo=result.recordset[0].Tipo
            if(Persiste == 0) {
                const xSql =`Update Avisos Set Estado='IN' WHERE Empresa='${newData.empresa}' AND CodigoAplicacion='${newData.aplicacion}' AND Tipo='${myTipo}'`
                var resultUP = await sql.query (xSql)
            }
            res.status(200).json({ "status": "Succes", "Persistencia":"IN","aviso": result.recordset})
            var botMessage ="Aviso Solicitado " + myTipo + " Empresa" + newData.empresa + " Usuario " +  req.body.empresa
            bot.sendBot(bot.idChatBaseUno, botMessage)
        }    
        return        
    } catch (err) {
        var botMessage ="Error Descarga  " + err.messages
        bot.sendBot(bot.idChatBaseUno, botMessage)
        const response = { status: err}
        res.status(401).json({ "status": "FAILED", "error" : err.message})
    }    
})

router.post('/usuarios', ensureToken, async (req, res) => {
    //console.log(req.body )
    console.log(`INSERT INTO  Licencias Values(${req.token.user.empresa}, ${req.token.user.aplicacion}, ${req.body.usuariosActivos}, ${req.body.usuariosInactivos}, ${req.body.loginActivos}, GetDate())`)
    try {
        await sql.connect(config)
        var result = await sql.query`INSERT INTO  Licencias Values(${req.token.user.empresa}, ${req.token.user.aplicacion}, ${req.body.usuariosActivos}, ${req.body.usuariosInactivos}, ${req.body.loginActivos}, GetDate())`

        if (result.rowsAffected[0] == 0) {
            var botMessage = "Error al Grabar Revisión Empresa " & req.body.empresa
            bot.sendBot(bot.idChatBaseUno, botMessage)
            res.status(500).json({ "status": "No data" })
        } else {
            var botMessage = "Se Grabo Revisión de Usuarios " + req.token.user.empresa + "Aplicación " + req.token.user.aplicacion
            bot.sendBot(bot.idChatBaseUno, botMessage)
            res.status(200).json({ "status": "OK" })
        }
    }
    catch (err) {
        var botMessage = "Error Descarga  " + err.message
        bot.sendBot(bot.idChatBaseUno, botMessage)
        const response = { status: err }
        res.status(401).json({ "status": "failed" })
    }
})

function ensureToken(req, res, next) {
    //console.log(req.headers.token)
    jwt.verify(req.headers.token, 'my_secret_key', (err, data) => {
        if (err) {
            var botMessage = "Error Consulta de Token " + req.body.empresa
            bot.sendBot(bot.idChatBaseUno, botMessage)
            res.status(401).json({ "status": "FAILED", "error": err })
            //console.log(req.token)
        } else {
            //var botMessage = "Consulta Token Empresa " + data.user.empresa + " Aplicación " + data.user.aplicacion + " Usuario " + req.body.usuario
            //bot.sendBot(bot.idChatBaseUno, botMessage)
            //console.log(req.token)
            req.token = data
            next()
        }
    })
}


module.exports = router;
