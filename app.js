let restify = require('restify');
let builder = require('botbuilder');

let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

let connector = new builder.ChatConnector({
    appId: '07154fc1-57e7-445b-80a7-b70b5ec261cd',
    appPassword: 'g_Zn%VSLEBY8jX4A'
});

let inMemoryStorage = new builder.MemoryBotStorage();

let bot = new builder.UniversalBot(connector, {
    localizerSettings: { 
        defaultLocale: "es" 
    }
}).set('storage', inMemoryStorage);;
server.post('/api/messages', connector.listen());

let endpointLuis = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/bd70ac1e-f713-4f60-bb9a-cfbea27f8859?subscription-key=9de2252d0b534ff4993a00964b20ed05&verbose=true&timezoneOffset=-300&q=';

let recognizer = new builder.LuisRecognizer(endpointLuis);

recognizer.onFilter(function(context, result, callback) {

    console.log("result.intent: " + result.intent);
    console.log("result.score: " + result.score);

    //callback(null, result);
    if (result.intent == 'None' && result.score < 0.2) {
      callback(null, { score: 0.3, intent: result.intent });
    } else {
      callback(null, result);
    }
  });

bot.recognizer(recognizer);

bot.use({
    receive: function (event, next) {
        console.log("input***" + event.text+"---");
        next();
    },
    botbuilder: function (session, next) {
        console.log("entrada***" + session.message.text+"---");
        next();
    },
    send: function (event, next) {
        console.log("salida***" + event.text);
        next();
    }
});

bot.dialog('inicio', [
    function (session) {
        var respuestas = [
            'Habla Lupe 😝 '
        ];
        session.send(respuestas[Math.floor(Math.random()*respuestas.length)]);
        
    }
]).triggerAction({
    matches: 'inicio'
});

bot.dialog('saludo', [
    function (session) {
        var respuestas = [
            '😲 Discúlpenme, buenas noches a todos los presentes, soy Timy, un chatbot. 🤗',
            '😲 Discúlpenme, soy Timy, un chatbot, buenas noches a todos los presentes. 🤗'
        ];
        session.send(respuestas[Math.floor(Math.random()*respuestas.length)]);
        
    }
]).triggerAction({
    matches: 'saludo'
});

bot.dialog('estadoAnimo', [
    function (session) {
        var respuestas = [
            '👉👈 Algo nervioso por que varias personas me están leyendo ahora.',
            'Un poco nervioso por estar en público. 👉👈'
        ];
        session.send(respuestas[Math.floor(Math.random()*respuestas.length)]);
        
    }
]).triggerAction({
    matches: 'estadoAnimo'
});

bot.dialog('ayuda', [
    function (session) {
        var respuestas = [
            'Cuéntame, ¿en qué te puedo ayudar?. 🤔',
            'Por supuesto que te puedo ayudar, cuéntame. 🤔'
        ];
        session.send(respuestas[Math.floor(Math.random()*respuestas.length)]);
        
    }
]).triggerAction({
    matches: 'ayuda'
});

bot.dialog('creacionfake', [
    function (session) {
        var respuestas = 
            'Bueno todo comenzo cuando mi papáBot enamoró a mi mamá bot, y una noche. 😆'
        ;
        session.send(respuestas);
        
    }
]).triggerAction({
    matches: 'creacionfake'
});

bot.dialog('creacion', [
    function (session) {
        var respuestas = 
            'jejeje,ok ok. Me pondré serio. Para mi creación se requiere una cuenta en Luis.ai para que te puedas crear un app, y por ahí me vayas entrenando.'
        ;
        session.send(respuestas);
        
    }
]).triggerAction({
    matches: 'creacion'
});

bot.dialog('luis', [
    function (session) {
        var respuestas = 
            'LUIS significa Idioma Comprensión del Servicio Inteligente. Es uno de los muchos Servicios Cognitivos provistos por Microsoft bajo Azure Cognitive Services . Al utilizar este servicio, podemos utilizar las API REST para extraer información útil, como intención, entidad, frases, etc. de cualquier oración. Podemos usarlo para construir aplicaciones inteligentes que puedan conversar y comprender lo que una oración está tratando de transmitir.'
        ;
        session.send(respuestas);
        
    }
]).triggerAction({
    matches: 'luis'
});

bot.dialog('intencion', [
    function (session) {
        var respuestas = 
            'Como decia me entrenan para que pueda reconocer las intenciones. La intención es lo primero que trato de identificar cuando alguien me escribe. Por ejemplo, si estamos delante de uno de mis amigos chatbot para reservar entradas, habrán definido diferentes intenciones propias del negocio como ComprarEntrada, ModificarReserva, DevoluciónEntrada, etc.'
        ;
        session.send(respuestas);   
    }
]).triggerAction({
    matches: 'intencion'
});

bot.dialog('creacion1', [
    function (session) {
        var respuestas = 
            'De acuerdo, luego tienen que crearse una cuenta en Azure, tienen que tener crédito por supuesto. Crearse un servicio de Machine Lerning en una web app, enlazar las credenciales del app de Luis.ai con el código que se subirá a github que estará sincronizado con Azure, y luego conversar. 🙂'
        ;
        session.send(respuestas);
        
    }
]).triggerAction({
    matches: 'creacion1'
});

bot.dialog('aprobar', [
    function (session) {
        var respuestas = 
            '😅 pues si haz sido responsable con tus trabajos, no habrá problemas, de todas formas estoy dando lo mejor de mi para ayudarte. 🙂👍'
        ;
        session.send(respuestas);
    }
]).triggerAction({
    matches: 'aprobar'
});

bot.dialog('chiste', [
    function (session) {
        var respuestas = 
            '😅 mmm a ver... Qué hace 99 veces clic y un clac?'
        ;
        session.send(respuestas);
    }
]).triggerAction({
    matches: 'chiste'
});

bot.dialog('chisterespuesta', [
    function (session) {
        var respuestas = 
            '😆 Pues un cien pies con una pata de palo. 😆'
        ;
        session.send(respuestas);
    }
]).triggerAction({
    matches: 'chisterespuesta'
});

bot.dialog('despedida', [
    function (session) {
        var respuestas = [
            'Hasta la próxima. 🖐️️ Gracias por la atención. 🙂',
            'Fue un gusto poder conversar,🙂 hasta luego.🖐️️'
        ];
        session.send(respuestas[Math.floor(Math.random()*respuestas.length)]);
    }
]).triggerAction({
    matches: 'despedida'
});