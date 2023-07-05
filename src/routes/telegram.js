const telegraf = require("telegraf")
const middleware = require("./middleware.js")
const idChatBaseUno="1228075428"

// TELEGRAM
const bot = new telegraf("1952725201:AAFksA3nRto-cIncvbxGKkFFQslCgt0tKLU") //BaseUno
bot.launch()

bot.start((ctx) => {
    ctx.reply(`Welcome ${ctx.from.first_name} ${ctx.from.last_name}`)
     // console.log(ctx)
})

bot.command(['avisos','Avisos','AVISOS'], (ctx)=>{
    middleware.ActivacionRevision(0)
    ctx.reply(`${ctx.from.first_name}  Aviso REVISION Actualizado para su ejecución`)
})

function sendBot(idChad, message){
    bot.telegram.sendMessage(idChad,message);
}

bot.telegram.sendMessage(idChatBaseUno, `Bienvenido al Control Aplicaciones SISMA `);   

module.exports={
    sendBot,
    idChatBaseUno
}
 