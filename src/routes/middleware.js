const express = require('express');
const router = express.Router();
const axios = require('axios');
const colors = require('colors');
const sql = require('mssql');

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


async function ActivacionRevision(intervalo){
    try {
        await sql.connect(config)
        var result = await sql.query `SELECT Movimientos.Nit, Movimientos.CodigoAplicacion, MIN(DATEDIFF(DAY, Movimientos.Fecha, GETDATE())) AS dias FROM Movimientos INNER JOIN  Empresas ON Movimientos.Nit = Empresas.NIT WHERE Empresas.Estado='AC' GROUP BY Movimientos.Nit, Movimientos.CodigoAplicacion`
        //console.log(result)
        if (result.rowsAffected[0] > 0){
            var contador=result.rowsAffected[0] 
            for(i=0; i<contador ; i++ ){
                if(result.recordset[i].dias >= intervalo){
                    console.log (i,result.recordset[i].dias, intervalo)
                    var xSql =`UPDATE Avisos SET Estado='AC' WHERE Empresa='${result.recordset[i].Nit}' AND CodigoAplicacion='${result.recordset[i].CodigoAplicacion}' AND Tipo='REVISION'`
                    var resultupdate = await sql.query (xSql)
                    console.log(resultupdate)
                    if (resultupdate.rowsAffected[i] > 0){
                        var botMessage ="UPDATE Para Revision, Nit " + result.recordset[i].Nit + ' Aplicacion ' + result.recordset[i].CodigoAplicacion
                        midbot.sendBot(midbot.idChatBaseUno, botMessage)
                    }else{
                        var botMessage ="ERROR UPDATE Para Revision, Nit " + result.recordset[i].Nit + ' Aplicacion ' + result.recordset[i].CodigoAplicacion
                        midbot.sendBot(midbot.idChatBaseUno, botMessage)
                    }
                }
            }
        }    
    } catch (err) {
        console.log('Error'+ err)
        var botMessage ="ERROR UPDATE Para Revision " + err
        //midbot.sendBot(midbot.idChatBaseUno, botMessage)
    }
    return    
}

function makeid(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@*?%&$#" 
    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

module.exports={
    ActivacionRevision,
    makeid
}