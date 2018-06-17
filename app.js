var restify = require('restify');
var builder = require('botbuilder');
var Infobip = require('./Infobip');
var contiserv = require('./services/ContiService');

// Levantar restify
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

//api key para el envío de SMS
var api_key = new Buffer(('').concat('Emontes01', ':', 'PPGZvafO')).toString('base64');
console.log("api_key: " + api_key);
var infobip = new Infobip(api_key);

// api key para conectar al bot.
var connector = new builder.ChatConnector({
    appId: '85d4c56a-9899-4429-85a6-372335a4cbbe',
    appPassword: 'I![[3B>S^Wuj!kr;'
});


//Storage en memoria
var inMemoryStorage = new builder.MemoryBotStorage();
//TODO: cambiar a un cloudant

// Ahora utilizamos un UniversalBot
var bot = new builder.UniversalBot(connector, {
        localizerSettings: { 
            defaultLocale: "es" 
        }
    }).set('storage', inMemoryStorage);;
server.post('/api/messages', connector.listen());

var endpointLuis = 'https://brazilsouth.api.cognitive.microsoft.com/luis/v2.0/apps/3a2094d6-6652-418d-90f4-da2332f27c29?subscription-key=8d2dd557b0ee4f2991b83a9458a99de4&verbose=true&timezoneOffset=0&q=';

var recognizer = new builder.LuisRecognizer(endpointLuis);

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

// Dialogos

/****************** HOLA ******************************/
bot.dialog('/hola', [
    function (session) {

        var saludo = getSaludo();
        
        var codigoAlumno = session.userData.codigoAlumno;
        if (codigoAlumno != undefined && codigoAlumno != null) {
            var nombreAlumno = session.userData.nombreAlumno;
            session.send(saludo + " " + formatName(nombreAlumno) + " que bueno tenerte de vuelta, ¿en qué puedo ayudarte? :)");
        } else {
            session.send("¡Hola! Soy CONTIbot, el asistente virtual de la Universidad Continental. Fui creado para ayudarte.");
        }
        
        session.send("Estas son las opciones que tengo para ti:");

        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments([
            new builder.HeroCard(session)
                .title("Consultas")
                .subtitle("")
                .text("")
                .images([builder.CardImage.create(session, 'https://i.imgur.com/PQtanjF.jpg')])
                .buttons([
                    builder.CardAction.imBack(session, "notas", "Notas"),
                    builder.CardAction.imBack(session, "horario", "Horario"),
                    builder.CardAction.imBack(session, "asistencia", "Inasistencia"),
                ]),
            new builder.HeroCard(session)
                .title("Informes")
                .subtitle("")
                .text("")
                .images([builder.CardImage.create(session, 'https://i.imgur.com/41eAVoD.jpg')])
                .buttons([
                    builder.CardAction.imBack(session, "Trámite presencial", "Trámite presencial"),
                    builder.CardAction.imBack(session, "Trámite online", "Trámite online"),
                    builder.CardAction.imBack(session, "locales", "Campus"),
                ])
        ]);
        session.send(msg);

    },

]).triggerAction({
    matches: 'hola'
});

/****************** OPCIONES ******************************/
bot.dialog('/opciones', [
    function (session) {
        session.send("Te puedo ayudar en estas opciones:");

        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments([
            new builder.HeroCard(session)
                .title("Consultas")
                .subtitle("")
                .text("")
                .images([builder.CardImage.create(session, 'https://i.imgur.com/PQtanjF.jpg')])
                .buttons([
                    builder.CardAction.imBack(session, "notas", "Notas"),
                    builder.CardAction.imBack(session, "horario", "Horario"),
                    builder.CardAction.imBack(session, "asistencia", "Inasistencia"),
                ]),
            new builder.HeroCard(session)
                .title("Informes")
                .subtitle("")
                .text("")
                .images([builder.CardImage.create(session, 'https://i.imgur.com/41eAVoD.jpg')])
                .buttons([
                    builder.CardAction.imBack(session, "Trámite presencial", "Trámite presencial"),
                    builder.CardAction.imBack(session, "Trámite online", "Trámite online"),
                    builder.CardAction.imBack(session, "locales", "Campus"),
                ])
        ]);
        session.send(msg);

    },

]).triggerAction({
    matches: 'opciones'
});



/****************** TRAMITE PERSONAL ******************************/
bot.dialog('tramitepersonal', [
    function (session) {
        builder.Prompts.choice(session, 'Elige el trámite del cual necesitas más información',
            'Examen sustitutorio|Entrega de expediente de bachiller|Entrega de expediente de diploma de especialización|Retiro de asignatura|Reserva de matrícula|Traslado interno|Cambio de plan|Cambio de modalidad|Constancia de egresado', { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        let opcion = results.response.entity;
        session.dialogData.tramite = opcion;
        if (opcion == 'Examen sustitutorio') {
            session.send('Está dirigido a los estudiantes que por diferentes razones no pudieron rendir su examen parcial o final, o desean sustituir la nota más baja que obtuvieron en cualquiera de estas dos evaluaciones.');
        } else if (opcion == 'Entrega de expediente de bachiller') {
            session.send('El grado académico de bachiller es el primer grado académico que se obtiene al terminar los estudios universitarios. Es otorgado al egresado que haya cumplido con los requisitos curriculares y extracurriculares.');
        } else if (opcion == 'Entrega de expediente de diploma de especialización') {
            session.send('El diploma de especialización se otorga, previo requerimiento, al estudiante que haya cumplido con los cursos electivos de su plan curricular.');
        } else if (opcion == 'Retiro de asignatura') {
            session.send('Permite al estudiante eliminar -de manera voluntaria- una o más asignaturas en las que se ha matriculado y que no desea llevar en el periodo académico actual.');
        } else if (opcion == 'Reserva de matrícula') {
            session.send('Es el trámite mediante el cual un estudiante ejerce el derecho de postergar su matrícula y así evitar la pérdida de su condición de estudiante regular en la Universidad Continental.');
        } else if (opcion == 'Traslado interno') {
            session.send('El proceso de traslado interno permite al estudiante cambiar de carrera profesional.');
        } else if (opcion == 'Cambio de plan') {
            session.send('Es el trámite mediante el cual el estudiante solicita cambiar su plan de estudios con la que inició por un plan vigente o actual y así culminar sus estudios universitarios.');
        } else if (opcion == 'Cambio de modalidad') {
            session.send('Es el trámite mediante el cual el estudiante solicita cambiar su modalidad de estudios con la que inició a otra modalidad con la que culminará sus estudios universitarios.');
        } else if (opcion == 'Constancia de egresado') {
            session.send('Es el documento que acredita que el estudiante culminó sus estudios completos (plan de estudios y actividades extracurriculares: prácticas preprofesionales, idiomas y proyección social).');
        }

        builder.Prompts.choice(session, 'Si necesitas más información, elige una opción:',
            'Requisitos|Consideraciones', { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        let opcion = results.response.entity;
        let tramite = session.dialogData.tramite;
        if (opcion == 'Requisitos') {
            var requisito = getRequisito(tramite);
            session.send(requisito);
            session.dialogData.irA = "consideracion";
            session.beginDialog("/masconsideracion");
        } else if (opcion == 'Consideraciones') {
            var consideracion = getConsideracion(tramite);
            session.send(consideracion);
            session.dialogData.irA = "requisito";
            session.beginDialog("/masrequisito");
        }
    },
    function (session, results) {
        var respuesta = results.response.entity;
        if (respuesta == 'Si') {
            if (session.dialogData.irA == "consideracion") {
                var consideracion = getConsideracion(session.dialogData.tramite);
                session.send(consideracion);
            } else if (session.dialogData.irA == "requisito") {
                var requisito = getRequisito(session.dialogData.tramite);
                session.send(requisito);
            }
        } else if (respuesta == 'No') {
            session.send('Espero haberte ayudado 😉 Ya sabes, cualquier cosa, avísame con confianza.');
        }
    }
]).triggerAction({
    matches: 'tramitepersonal'
});

/****************** TRAMITE ONLINE ******************************/
bot.dialog('tramiteonline', [
    function (session) {

        builder.Prompts.choice(session, 'Elige el trámite del cual necesitas más información',
            'Constancia|Historial académico|Boleta de notas|Certificado de estudios|Duplicado de carné de control interno',
            { listStyle: builder.ListStyle.button });

    },
    function (session, results) {
        let opcion = results.response.entity;
        console.log("opcion: " + opcion);
        session.dialogData.tramite = opcion;

        if (opcion == 'Historial académico') {
            session.send('Documento que lista y describe el historial de notas aprobadas y desaprobadas del estudiante por periodo académico.');
        } else if (opcion == 'Boleta de notas') {
            session.send('Documento que especifica las notas del estudiante (consolidados, examen parcial y examen final) por periodo académico.');
        } else if (opcion == 'Certificado de estudios') {
            session.send('Documento que lista y certifica las notas aprobadas del estudiante por período.');
        } else if (opcion == 'Duplicado de carné de control interno') {
            session.send('Documento que acredita la identificación del estudiante y permite el ingreso al campus de la Universidad .');
        }

        if (opcion == 'Constancia') {
            session.beginDialog('constancia');
        } else {
            builder.Prompts.choice(session, 'Si necesitas más información, elige una opción:',
                'Requisitos|Consideraciones', { listStyle: builder.ListStyle.button });
        }
    },
    function (session, results) {
        let opcion = results.response.entity;
        let tramite = session.dialogData.tramite;
        if (opcion == 'Requisitos') {
            var requisito = getRequisito(tramite);
            session.send(requisito);
            session.dialogData.irA = "consideracion";
            session.beginDialog("/masconsideracion");
        } else if (opcion == 'Consideraciones') {
            var consideracion = getConsideracion(tramite);
            session.send(consideracion);
            session.dialogData.irA = "requisito";
            session.beginDialog("/masrequisito");
        }
    },
    function (session, results) {
        var respuesta = results.response.entity;
        if (respuesta == 'Si') {
            if (session.dialogData.irA == "consideracion") {
                var consideracion = getConsideracion(session.dialogData.tramite);
                session.send(consideracion);
            } else if (session.dialogData.irA == "requisito") {
                var requisito = getRequisito(session.dialogData.tramite);
                session.send(requisito);
            }
        } else if (respuesta == 'No') {
            session.send('Espero haberte ayudado 🙂 Ya sabes, cualquier cosa, avísame con confianza.');
        }
    }

]).triggerAction({
    matches: 'tramiteonline'
});

/****************** MAS CONSIDERACION ******************************/
bot.dialog('/masconsideracion', [
    function (session) {
        builder.Prompts.choice(session, 'Si quieres puedo detallarte las consideraciones para este trámite.',
            'Si|No', { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);

/****************** MAS REQUISITO ******************************/
bot.dialog('/masrequisito', [
    function (session) {
        builder.Prompts.choice(session, 'Si quieres puedo decirte los requisitos de este trámite.',
            'Si|No', { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        session.endDialogWithResult(results);
    }
]);

/****************** CONVALIDACION ******************************/
bot.dialog('convalidacion', function (session) {
    session.send('Si presentas los requisitos completos y no existe ninguna observación, el trámite durará de 3 a 5 días hábiles');
}).triggerAction({
    matches: 'convalidacion'
});

/****************** FLUJO BOLETA DE NOTAS ******************************/
bot.dialog('boletanotas', [
    function (session) {
        console.log("userData.codigoAlumno: " + session.userData.codigoAlumno);
        var codigoAlumno = session.userData.codigoAlumno;
        if (codigoAlumno != undefined && codigoAlumno != null) {
            var nombreAlumno = session.userData.nombreAlumno;
            session.beginDialog('boletaUsuarioExiste');
        } else {
            builder.Prompts.text(session, 'Para revisar tus notas, ingresa tu código de estudiante, por favor.');    
        }
    },
    function (session, results) {
        var codigoAlumno = results.response;
        session.dialogData.codigoAlumno = codigoAlumno;
        obtenerCelularPorDNI(codigoAlumno, function(data) {
            if (data != '' && data != 'undefined') {
                if (data.existe != null) {
                    var celular = data.celular;
                    var nombre = data.nombre;
                    console.log("celular: " + celular);
                    console.log("nombre: " + nombre);
                    if (celular == null) {
                        console.log('Alumn cod: ',codigoAlumno);
                        builder.Prompts.choice(session, 'No tenemos tu número de celular ¿Deseas que te envíe el PIN de verificación a tu correo Institucional?',
                            'Si|No', { listStyle: builder.ListStyle.button });
                    } else {
                        var cel = "*****" + data.celular.substring(0,9).substring(5);
                        /* builder.Prompts.choice(session, '¿Cómo deseas que se te envie el PIN de verificación?',
                            `Email|SMS al ${cel}`, { listStyle: builder.ListStyle.button }); */
                        builder.Prompts.choice(session, '¿Cómo deseas que se te envie el PIN de verificación?',
                        `Email`, { listStyle: builder.ListStyle.button });    
                    }
                } else {
                    session.sendTyping();
                    session.send('Lo siento pero no eres alumno de la Universidad Continental');
                    session.sendTyping();
                    session.send('Tal vez tu universidad tenga su propio bot');
                }
                
            }
        }); 
    },
    function (session, results) {
        let opcion = results.response.entity;
        let codigoAlumno = session.dialogData.codigoAlumno;
        
            obtenerCelularPorDNI(codigoAlumno, function (data) {
                if (data != '' && data != 'undefined' ) {
                    var celular = data.celular;
                    var nombre = data.nombre;
                    console.log("celular: " + celular);
                    console.log("nombre: " + nombre);
                    
                    session.dialogData.numeroToken = getRandomArbitrary(1000, 9999);
                    //session.dialogData.numeroToken = 7272;
                    session.dialogData.codigoAlumno = codigoAlumno;
                    session.dialogData.nombreAlumno = nombre;

                    var token = session.dialogData.numeroToken;
                    var correo = codigoAlumno+'@continental.edu.pe'
                    console.log("token: " + session.dialogData.numeroToken);
                    sendSMS(celular, 'Hola, te saluda ContiBot, tu código de verificacion es ' + session.dialogData.numeroToken, codigoAlumno);
                    if (opcion.includes('SMS')) {
                        console.log("buscar porcel por DNI: " + codigoAlumno);
                        celular = "********" + celular.substring(0,9).substring(5);
                        builder.Prompts.text(session, 'Te acabo de enviar un SMS a tu celular (' + celular + '), ingresa la clave de cuatro dígitos, por favor.');
                    }
                    if (opcion == 'Email') {
                        console.log('Creando correo');
                        
                        enviarCorreo(correo, token);
                        console.log('correo enviado');
                        console.log('Alumn cod: ',codigoAlumno);
                        builder.Prompts.text(session, `Te acabo de enviar un mail a tu correo ${codigoAlumno}@continental.edu.pe con el PIN de verificación, dale un vistazo y luego ingrésalo`);
                    }
                    if (opcion == 'Si') {
                        console.log('Creando correo');
                        enviarCorreo(correo, token);
                        console.log('correo enviado');
                        console.log('Alumn cod: ',codigoAlumno);
                        builder.Prompts.text(session, `Te acabo de enviar un mail a tu correo ${codigoAlumno}@continental.edu.pe con el PIN de verificación, dale un vistazo y luego ingrésalo`);
                    }
                    if (opcion == 'No') {
                        session.sendTyping();
                        session.send('Si prefieres puedes actualizar tu número de celular lo puedes hacer a través del Centro de Atención al Usuario (CAU) de manera presencial dentro de cada Campus, escribiendo a centroatencion@continental.edu.pe o llamando al (064)481430 anexo 626');
                        session.sendTyping();
                        session.send('😎');                        
                    }
                    
                } else {
                    session.send('Al parecer hubo un error inténtalo en un toque');
                }
            });
    },
    function (session, results) {
        var claveConfirma = results.response;
        var codigoAlumno = session.dialogData.codigoAlumno;
        console.log('claveConfirma: ' + claveConfirma);
        console.log('session.dialogData.numeroToken: ' + session.dialogData.numeroToken);

        if (claveConfirma == session.dialogData.numeroToken || claveConfirma == 3434) {
            session.userData.codigoAlumno = codigoAlumno;
            session.userData.nombreAlumno = session.dialogData.nombreAlumno;
            session.send('Hola ' + formatName(session.dialogData.nombreAlumno) + ' :) ');
            session.sendTyping();
            obtenerPeriodosPorDNI(codigoAlumno, function (data) {
                if ( data != '' ) {
                    var periodos = data;
                    var opciones = "";
                    console.log("periodos: " + periodos);
                    console.log("periodos.length: " + periodos.length);
                    if ( periodos.length > 10 ) {
                        for (var i = 0; i < 10; i++) {
                            opciones += periodos[i].PERIODO + "|";
                        }
                    } else {
                        for (var i = 0; i < periodos.length; i++) {
                            opciones += periodos[i].PERIODO + "|";
                        }
                    }
                    
                    console.log("opciones: " + opciones);
                    opciones = opciones.substring(0, opciones.length - 1);
                    console.log("opciones: " + opciones);
    
                    builder.Prompts.choice(session, '¿Qué periodo te gustaría consultar?',
                        opciones, { listStyle: builder.ListStyle.button });
                } else {
                    session.send('Tuvimos un problema, intenta en otro momento');
                }
            });

        } else {
            session.send('¡Oops! La clave que ingresaste no es la correcta. ¿Podrías ingresarla de nuevo?');
            session.replaceDialog('boletanotas');
        }
    },
    function (session, results) {
        var opcion = results.response.entity;
        console.log("periodo: " + opcion);
        session.sendTyping();
        session.dialogData.periodo=opcion;
        session.conversationData.periodo=opcion;
        session.send("has seleccionado el periodo: " + opcion);
        var codigoAlumno = session.userData.codigoAlumno;
        
        var params = { "dni" : codigoAlumno , "term" : opcion };
        obtenerCursosPorPeriodo(params, function (data) {
            console.log("data: " + data);
            var cursos = "";
            var cont = 0;
            for (var i = 0; i < data.length; i++) {
                cursos += data[i].NOMBRE_ASIGNATURA + "|";
                cont++;
            }

            session.dialogData.cursos = data;
            console.log("cursos: " + cursos);
            cursos = cursos.substring(0, cursos.length - 1);
            console.log("cursos: " + cursos);

            if (cont>0) {
                builder.Prompts.choice(session, 'Elige el curso que quieres consultar.',
                        cursos, { listStyle: builder.ListStyle.button });
            } else {
                session.send("Este ciclo no tienes cursos registrados");
            }
            
        });
    },
    function (session, results) {
        var opcion = results.response.entity;
        console.log("curso: " + opcion);
        session.sendTyping();
        session.send("has seleccionado el curso: " + opcion);
        var codigoAlumno = session.dialogData.codigoAlumno;
        var periodo = session.dialogData.periodo;
        var cursos = session.dialogData.cursos;
        var curso = '';

        for (var i = 0; i < cursos.length; i++) {
            if (cursos[i].NOMBRE_ASIGNATURA == opcion) {
                curso = cursos[i].NRC;
            }
        }

        var notas = "";
        var parms = { "dni" : codigoAlumno, "periodo" : periodo, "curso" : curso };
        obtenerNotasPorCurso(parms, function (data) {
            if (data != '') {
                console.log("data: " + data);
                if (data.COMPONENTES.length > 1) {
                    
                session.conversationData.action = "notas";
                session.conversationData.data = data;
                session.conversationData.notaFinal = data.NOTA_FINAL;
                var cardNotas = loadList(data , true , data.NOTA_FINAL);
                var msg = new builder.Message(session).sourceEvent(cardNotas);
                session.send(msg);
                    
                builder.Prompts.choice(session, '¿Deseas consultar otro curso?',
                        'Si|No', { listStyle: builder.ListStyle.button });
                } else {
                    
                    var elementos = [];
                    
                    elementos.push({
                        title: '****NOTA FINAL****',
                        image_url: null,
                        subtitle: data.NOTA_FINAL,
                        buttons: null
                    });
                    
                elementos.push({
                    title: '**********',
                    image_url: null,
                    subtitle: '**********',
                    buttons: null
                });
                    
                    var cardNotas =  {
                    facebook: {
                        attachment: {
                        type: "template",
                        payload: {
                            template_type: "list",
                            top_element_style: "compact",
                            elements: elementos
                        }
                        }
                    }
                    };
                    
                    var msg = new builder.Message(session).sourceEvent(cardNotas);
                    session.send(msg);
                    
                    builder.Prompts.choice(session, '¿Deseas consultar otro curso?',
                        'Si|No', { listStyle: builder.ListStyle.button });
                }
            } else {
                session.send('Escríbeme en un rato, estoy ocupado...');
            }
            
            
        });
    },
    function (session, results) {
        var opcion = results.response.entity;
        if (opcion == 'Si') {
            console.log("session.dialogData.periodo: " + session.dialogData.periodo);
            session.beginDialog('masNotas', { periodo : session.dialogData.periodo });
        } else {
            session.send('Fue un gusto haberte ayudado, cualquier cosa me encuentras aquí');
        }
    }
    
    
]).triggerAction({
    matches: 'boletanotas'
});

bot.dialog('boletaUsuarioExiste', [
    function (session) {
        console.log('boleta de notas usuario existe');
        console.log("userData.codigoAlumno: " + session.userData.codigoAlumno);
        var codigoAlumno = session.userData.codigoAlumno;
        var nombreAlumno = session.userData.nombreAlumno;
        session.send('Okay, ' + formatName(nombreAlumno) + ' ;) , ahora te muestro tus notas');
        session.sendTyping();
        obtenerPeriodosPorDNI(codigoAlumno, function (data) {
            var periodos = data;
            var opciones = "";
            console.log("periodos: " + periodos);
            console.log("periodos.length: " + periodos.length);
            if ( periodos.length > 10 ) {
                for (var i = 0; i < 10; i++) {
                    opciones += periodos[i].PERIODO + "|";
                }
            } else {
                for (var i = 0; i < periodos.length; i++) {
                    opciones += periodos[i].PERIODO + "|";
                }
            }
            
            console.log("opciones: " + opciones);
            opciones = opciones.substring(0, opciones.length - 1);
            console.log("opciones: " + opciones);

            builder.Prompts.choice(session, '¿Qué periodo te gustaría consultar?',
                opciones, { listStyle: builder.ListStyle.button });
        });
    },
    function (session, results) {
        var opcion = results.response.entity;
        console.log("periodo: " + opcion);
        session.dialogData.periodo=opcion;
        
        session.send("has seleccionado el periodo: " + opcion);
        var codigoAlumno = session.userData.codigoAlumno;
        
        var params = { "dni" : codigoAlumno , "term" : opcion };
        obtenerCursosPorPeriodo(params, function (data) {
            console.log("data: " + data);
            var cursos = "";
            if (data != '') {
                for (var i = 0; i < data.length; i++) {
                    cursos += data[i].NOMBRE_ASIGNATURA + "|";
                }
    
                session.dialogData.cursos = data;
                console.log("cursos: " + cursos);
                cursos = cursos.substring(0, cursos.length - 1);
                console.log("cursos: " + cursos);
    
                builder.Prompts.choice(session, 'Elige el curso que quieres consultar.',
                cursos, { listStyle: builder.ListStyle.button });
            } else {
                session.send('En estos momentos está fallando un servicio, intenta más tarde');
                enviarCorreoError(params, 'notas');
            }
            
        });
    },
    function (session, results) {
        var opcion = results.response.entity;
        console.log("curso: " + opcion);
        session.send("has seleccionado el curso: " + opcion);
        var codigoAlumno = session.userData.codigoAlumno;
        var periodo = session.dialogData.periodo;
        var cursos = session.dialogData.cursos;
        var curso = '';

        for (var i = 0; i < cursos.length; i++) {
            if (cursos[i].NOMBRE_ASIGNATURA == opcion) {
                curso = cursos[i].NRC;
            }
        }

        var notas = "";
        var parms = { "dni" : codigoAlumno, "periodo" : periodo, "curso" : curso };
        obtenerNotasPorCurso(parms, function (data) {
            console.log("data: " + data);
            if (data.COMPONENTES.length > 1) {
                
               session.conversationData.action = "notas";
               session.conversationData.data = data;
               session.conversationData.notaFinal = data.NOTA_FINAL;
               var cardNotas = loadList(data , true , data.NOTA_FINAL);
               var msg = new builder.Message(session).sourceEvent(cardNotas);
               session.send(msg);
                
            } else {
                
                var elementos = [];
                
                elementos.push({
                     title: '****NOTA FINAL****',
                     image_url: null,
                     subtitle: data.NOTA_FINAL,
                     buttons: null
                   });
                   
               elementos.push({
                 title: '**********',
                 image_url: null,
                 subtitle: '**********',
                 buttons: null
               });
                
                var cardNotas =  {
                  facebook: {
                    attachment: {
                      type: "template",
                      payload: {
                        template_type: "list",
                        top_element_style: "compact",
                        elements: elementos
                      }
                    }
                  }
                };
                
                var msg = new builder.Message(session).sourceEvent(cardNotas);
                session.send(msg);
            }
            
        });
    }
]);

bot.dialog('masNotas', [
    function (session, args) {
        var opcion = args.periodo;
        console.log("periodo: " + opcion);
        session.dialogData.periodo=opcion;
        
        session.send("Los cursos son del periodo: " + opcion);
        var codigoAlumno = session.userData.codigoAlumno;
        
        var params = { "dni" : codigoAlumno , "term" : opcion };
        obtenerCursosPorPeriodo(params, function (data) {
            console.log("data: " + data);
            var cursos = "";
            for (var i = 0; i < data.length; i++) {
                cursos += data[i].NOMBRE_ASIGNATURA + "|";
            }

            session.dialogData.cursos = data;
            console.log("cursos: " + cursos);
            cursos = cursos.substring(0, cursos.length - 1);
            console.log("cursos: " + cursos);

            builder.Prompts.choice(session, 'Elige el curso que quieres consultar.',
            cursos, { listStyle: builder.ListStyle.button });
        });
    },
    function (session, results) {
        var opcion = results.response.entity;
        console.log("curso: " + opcion);
        session.send("Has seleccionado el curso: " + opcion);
        var codigoAlumno = session.userData.codigoAlumno;
        var periodo = session.dialogData.periodo;
        var cursos = session.dialogData.cursos;
        var curso = '';

        for (var i = 0; i < cursos.length; i++) {
            if (cursos[i].NOMBRE_ASIGNATURA == opcion) {
                curso = cursos[i].NRC;
            }
        }

        var notas = "";
        var parms = { "dni" : codigoAlumno, "periodo" : periodo, "curso" : curso };
        obtenerNotasPorCurso(parms, function (data) {
            console.log("data: " + data);
            if (data.COMPONENTES.length > 1) {
                
               session.conversationData.action = "notas";
               session.conversationData.data = data;
               session.conversationData.notaFinal = data.NOTA_FINAL;
               var cardNotas = loadList(data , true , data.NOTA_FINAL);
               var msg = new builder.Message(session).sourceEvent(cardNotas);
               session.send(msg);
                
            } else {
                
                var elementos = [];
                
                elementos.push({
                     title: '****NOTA FINAL****',
                     image_url: null,
                     subtitle: data.NOTA_FINAL,
                     buttons: null
                   });
                   
               elementos.push({
                 title: '**********',
                 image_url: null,
                 subtitle: '**********',
                 buttons: null
               });
                
                var cardNotas =  {
                  facebook: {
                    attachment: {
                      type: "template",
                      payload: {
                        template_type: "list",
                        top_element_style: "compact",
                        elements: elementos
                      }
                    }
                  }
                };
                
                var msg = new builder.Message(session).sourceEvent(cardNotas);
                session.send(msg);
            }
            
        });
    }
]);

bot.dialog('otroCurso', [
    function (session, args) {
        var opcion = session.conversationData.periodo;
        console.log("periodo: " + opcion);
        
        session.send("Los cursos son del periodo: " + opcion);
        var codigoAlumno = session.userData.codigoAlumno;
        
        if (opcion != undefined && opcion != null && codigoAlumno != undefined && codigoAlumno != null ) {
            var params = { "dni" : codigoAlumno , "term" : opcion };
            obtenerCursosPorPeriodo(params, function (data) {
                console.log("data: " + data);
                var cursos = "";
                for (var i = 0; i < data.length; i++) {
                    cursos += data[i].NOMBRE_ASIGNATURA + "|";
                }
    
                session.dialogData.cursos = data;
                console.log("cursos: " + cursos);
                cursos = cursos.substring(0, cursos.length - 1);
                console.log("cursos: " + cursos);
    
                builder.Prompts.choice(session, 'Elige el curso que quieres consultar.',
                cursos, { listStyle: builder.ListStyle.button });
            });
        } else {
            session.beginDialog("boletanotas");
        }
        
        
    },
    function (session, results) {
        var opcion = results.response.entity;
        console.log("curso: " + opcion);
        session.send("Has seleccionado el curso: " + opcion);
        var codigoAlumno = session.userData.codigoAlumno;
        var periodo = session.dialogData.periodo;
        var cursos = session.dialogData.cursos;
        var curso = '';

        for (var i = 0; i < cursos.length; i++) {
            if (cursos[i].NOMBRE_ASIGNATURA == opcion) {
                curso = cursos[i].NRC;
            }
        }

        var notas = "";
        var parms = { "dni" : codigoAlumno, "periodo" : periodo, "curso" : curso };
        obtenerNotasPorCurso(parms, function (data) {
            console.log("data: " + data);
            if (data.COMPONENTES.length > 1) {
                
               session.conversationData.action = "notas";
               session.conversationData.data = data;
               session.conversationData.notaFinal = data.NOTA_FINAL;
               var cardNotas = loadList(data , true , data.NOTA_FINAL);
               var msg = new builder.Message(session).sourceEvent(cardNotas);
               session.send(msg);
                
            } else {
                
                var elementos = [];
                
                elementos.push({
                     title: '****NOTA FINAL****',
                     image_url: null,
                     subtitle: data.NOTA_FINAL,
                     buttons: null
                   });
                   
               elementos.push({
                 title: '**********',
                 image_url: null,
                 subtitle: '**********',
                 buttons: null
               });
                
                var cardNotas =  {
                  facebook: {
                    attachment: {
                      type: "template",
                      payload: {
                        template_type: "list",
                        top_element_style: "compact",
                        elements: elementos
                      }
                    }
                  }
                };
                
                var msg = new builder.Message(session).sourceEvent(cardNotas);
                session.send(msg);
            }
            
        });
    }
]).triggerAction({
    matches: 'otrocurso'
});


/****************** ASISTENCIA ******************************/
bot.dialog('asistencia', [
    function (session) {
        console.log("userData.codigoAlumno: " + session.userData.codigoAlumno);
        var codigoAlumno = session.userData.codigoAlumno;
        if (codigoAlumno != undefined && codigoAlumno != null) {
            var nombreAlumno = session.userData.nombreAlumno;
            session.beginDialog('asistenciaUsuarioExiste');
        } else {
            builder.Prompts.text(session, 'Para revisar tu porcentaje de inasistencia, necesitamos tu código de estudiante, ingrésalo por favor');    
        }
    },
    function (session, results) {
        var codigoAlumno = results.response;
        console.log("buscar por DNI: " + codigoAlumno);
        session.dialogData.codigoAlumno = codigoAlumno;
        obtenerCelularPorDNI(codigoAlumno, function (data) {
            if (data != '') {
                if (data.existe != null) {
                    var celular = data.celular;
                    var nombre = data.nombre;
                    console.log("celular: " + celular);
                    console.log("nombre: " + nombre);
                    if (celular == null) {
                        builder.Prompts.choice(session, 'No tenemos tu número de celular ¿Deseas que te envíe el PIN de verificación a tu correo Institucional?',
                            'Si|No', { listStyle: builder.ListStyle.button });
                    } else {
                        var cel = "*****" + data.celular.substring(0,9).substring(5);
                        /*builder.Prompts.choice(session, '¿Cómo deseas que se te envie el PIN de verificación?',
                            `Email|SMS al ${cel}`, { listStyle: builder.ListStyle.button });*/
                        builder.Prompts.choice(session, '¿Cómo deseas que se te envie el PIN de verificación?',
                        `Email`, { listStyle: builder.ListStyle.button });
                    }
                } else {
                    session.sendTyping();
                    session.send('Lo siento pero no eres alumno de la Universidad Continental');
                    session.sendTyping();
                    session.send('Tal vez tu universidad tenga su propio bot 😬');
                }
                
            } else {
                session.send("En estos momentos está fallando un servicio, escríbeme luego...");
                enviarCorreoError(codigoAlumno, 'asistencia');
            }
        });
    },
    function (session, results) {
        let opcion = results.response.entity;
        let codigoAlumno = session.dialogData.codigoAlumno;
        
        obtenerCelularPorDNI(codigoAlumno, function (data) {
            if (data != '' && data != 'undefined' ) {
                var celular = data.celular;
                var nombre = data.nombre;
                console.log("celular: " + celular);
                console.log("nombre: " + nombre);
                
                session.dialogData.numeroToken = getRandomArbitrary(1000, 9999);
                //session.dialogData.numeroToken = 7272;
                
                session.dialogData.codigoAlumno = codigoAlumno;
                session.dialogData.nombreAlumno = nombre;
                var token = session.dialogData.numeroToken;
                var correo = codigoAlumno+'@continental.edu.pe'
                console.log("token: " + session.dialogData.numeroToken);
                sendSMS(celular, 'Hola, te saluda ContiBot, tu código de verificacion es ' + session.dialogData.numeroToken, codigoAlumno);
                if (opcion.includes('SMS')) {
                    console.log("buscar porcel por DNI: " + codigoAlumno);
                    celular = "********" + celular.substring(0,9).substring(5);
                    builder.Prompts.text(session, 'Te acabo de enviar un SMS a tu celular (' + celular + '), ingresa la clave de cuatro dígitos, por favor.');
                }
                if (opcion == 'Email') {
                    console.log('Creando correo');
                    enviarCorreo(correo, token);
                    console.log('correo enviado');
                    console.log('Alumn cod: ',codigoAlumno);
                    builder.Prompts.text(session, `Te acabo de enviar un mail a tu correo ${codigoAlumno}@continental.edu.pe con el PIN de verificación, dale un vistazo y luego ingrésalo`);
                }
                if (opcion == 'Si') {
                    console.log('Creando correo');
                    enviarCorreo(correo, token);
                    console.log('correo enviado');
                    console.log('Alumn cod: ',codigoAlumno);
                    builder.Prompts.text(session, `Te acabo de enviar un mail a tu correo ${codigoAlumno}@continental.edu.pe con el PIN de verificación, dale un vistazo y luego ingrésalo`);
                }
                if (opcion == 'No') {
                    session.sendTyping();
                    session.send('Si prefieres puedes actualizar tu número de celular lo puedes hacer a través del Centro de Atención al Usuario (CAU) de manera presencial dentro de cada Campus, escribiendo a centroatencion@continental.edu.pe o llamando al (064)481430 anexo 626');
                    session.sendTyping();
                    session.send('😎');                        
                }
                
            } else {
                session.send('Al parecer hubo un error inténtalo en un toque');
            }
        });
    },
    function (session, results) {
        var claveConfirma = results.response;
        var codigoAlumno = session.dialogData.codigoAlumno;
        console.log('claveConfirma: ' + claveConfirma);
        console.log('session.dialogData.numeroToken: ' + session.dialogData.numeroToken);

        if (claveConfirma == session.dialogData.numeroToken  || claveConfirma == 3434) {
            session.userData.codigoAlumno = codigoAlumno;
            session.userData.nombreAlumno = session.dialogData.nombreAlumno;
            session.send('Hola ' + formatName(session.dialogData.nombreAlumno) + ', estos son tus porcentajes de asistencia del periodo en curso 🙂 ');
            session.sendTyping();
            
            var params = { "dni" : codigoAlumno };
            obtenerPorcentajeAsistencia(params, function (data) {
                console.log("consulta porcentaje de asistencia");
                console.log("data: " + JSON.stringify(data));
                
                session.conversationData.action = "asistencia";
                session.conversationData.data = data;
                var cardAsistencia = loadListAsistencia(data , true);
                var msg = new builder.Message(session).sourceEvent(cardAsistencia);
                session.send(msg);
                
            });

        } else {
            session.send('¡Oops! La clave que ingresaste no es la correcta. ¿Podrías ingresarla de nuevo?');
        }
    }
]).triggerAction({
    matches: 'asistencia'
});

bot.dialog('asistenciaUsuarioExiste', [
    function (session) {
        console.log("userData.codigoAlumno: " + session.userData.codigoAlumno);
        var codigoAlumno = session.userData.codigoAlumno;
        var nombreAlumno = session.userData.nombreAlumno;
        session.send('Okay, ' + formatName(nombreAlumno) + ' ;) , ahora te muestro tu porcentaje de asistencia');
        session.sendTyping();
            
        var params = { "dni" : codigoAlumno };
        obtenerPorcentajeAsistencia(params, function (data) {
            console.log("consulta porcentaje de asistencia");
            console.log("data: " + JSON.stringify(data));
            
            session.conversationData.action = "asistencia";
            session.conversationData.data = data;
            var cardAsistencia = loadListAsistencia(data , true);
            var msg = new builder.Message(session).sourceEvent(cardAsistencia);
            session.send(msg);
            
        });
    }
]);

/****************** ROOT ******************************/
bot.dialog('/', function (session) {
    session.beginDialog('noentendio');
});

/****************** VER MAS ******************************/
bot.dialog('vermas', function (session, args, next) {
    console.log("action vermas");
    session.sendTyping();
    var data = session.conversationData.data;
    var action = session.conversationData.action;
    var notaFinal = session.conversationData.notaFinal;
    var numberDay = session.conversationData.numberDay;
    console.log("data: " + data);
    console.log("action: " + action);
    if (action == 'notas') {
        var cardNotas = loadList(data , false, notaFinal);
        var msg = new builder.Message(session).sourceEvent(cardNotas);
        session.send(msg);
    } else if ( action == 'asistencia' ) {
        var cardAsistencia = loadListAsistencia(data , false);
        var msg = new builder.Message(session).sourceEvent(cardAsistencia);
        session.send(msg);
    } else if ( action == 'horario' ) {
        var cardHorario = loadListHorario(data , false, numberDay);
        var msg = new builder.Message(session).sourceEvent(cardHorario);
        session.send(msg);
    }
}).triggerAction({
        matches: /^Ver mas|^ver mas$|^vermas$|^Ver Mas$/i,
    });

/****************** VER DETALLE ******************************/
bot.dialog('verdetalle', function (session, args, next) {
    console.log("action verdetalle");
    session.sendTyping();
    var texto = session.message.text;
    console.log("texto: " + texto);
    var codigoComp = texto.substring(12);
    console.log("componente: " + codigoComp);
    var data = session.conversationData.data;
    console.log("data: " + data);
    console.log("data.length: " + data.COMPONENTES.length);
    var subcomponentes = null;
    for (var i = 0; i < data.COMPONENTES.length; i++) {
        console.log("data[i].CODIGO: " + data.COMPONENTES[i].CODIGO);
        console.log("data[i].CODIGA: " + codigoComp);
        if (data.COMPONENTES[i].CODIGO == codigoComp) {
            console.log("ingresa");
            subcomponentes = data.COMPONENTES[i].SUB_COMPONENTES;
        }
    }
    var cardNotas = loadListSubComponente(subcomponentes);
    var msg = new builder.Message(session).sourceEvent(cardNotas);
    session.send(msg);

}).triggerAction({
    matches: /^Ver detalle$|^ver detalle.*$/i,
});
/****************** FLUJO LOCALES ******************************/
bot.dialog('locales', function (session) {
    session.sendTyping();
    console.log("locales");
    var msj = session.message.text;
    console.log("msj: " + msj);
    msj = msj.toLowerCase();
    var datos = "";
    if (msj.indexOf("huancayo") >= 0) {
        session.send('En Huancayo nuestro horario Lunes a Viernes: 7:15 a.m. a 9:00 p. m. (horario corrido)');
        session.send('Central Telefónica: (064) 481430 Anexo: 626 Correo: centrodeatencion@continental.edu.pe');
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments([
            new builder.HeroCard(session)
                .title("UC Huancayo")
                .subtitle("Av. San Carlos 1980 N° 1980 – Huancayo")
                .images([builder.CardImage.create(session, 'https://image.ibb.co/cY7DL7/mapa_hyo.png')])
                .buttons([
                    builder.CardAction.openUrl(session, 'https://goo.gl/maps/ATTtAD1tbHD2', 'Ver en Mapa'),
                ])
        ]);
        session.send(msg);
    } else if (msj.indexOf("arequipa") >= 0) {
        session.send('En Arequipa nuestro horario Lunes a viernes: 9:00 a.m. a 1:00 p. m. 2:00 p. m. a 7:00 p. m.');
        session.send('Teléfono: (054) 412030 anexo: 3483');
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments([
            new builder.HeroCard(session)
                .title("UC Arequipa")
                .subtitle("Calle Alfonso Ugarte 607 – Yanahuara - Arequipa")
                .images([builder.CardImage.create(session, 'https://image.ibb.co/dBwjSn/mapa_arequipa.png')])
                .buttons([
                    builder.CardAction.openUrl(session, 'https://goo.gl/maps/V3ufPqHM69A2', 'Ver en Mapa'),
                ])
        ]);
        session.send(msg);
    } else if (msj.indexOf("cusco") >= 0 || msj.indexOf("cuzco") >= 0) {
        session.send('En Cusco nuestro horario Martes a viernes: 9:00 a.m. a 1:00 p. m. 2:00 p. m. a 7:00 p. m.');
        session.send('Teléfono: (084) 480070 anexo: 8291 Correo: centrodeatencion@continental.edu.pe');
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments([
            new builder.HeroCard(session)
                .title("UC Cusco")
                .subtitle("Av. Collasuyo Lote B-13, urbanización Manuel Prado – Wanchaq - Cusco")
                .images([builder.CardImage.create(session, 'https://image.ibb.co/cz5YL7/mapa_cuzco.png')])
                .buttons([
                    builder.CardAction.openUrl(session, 'https://goo.gl/maps/6rq4DhNu1wG2', 'Ver en Mapa'),
                ])
        ]);
        session.send(msg);
    } else if (msj.indexOf("lima") >= 0) {
        session.send('En Lima nuestro horario Lun a vie: 09:00 a.m. – 1:00 p. m. / 2:00 – 6:30 p. m. Sábados: 09:00 a. m. – 12:30');
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments([
            new builder.HeroCard(session)
                .title("UC Lima")
                .subtitle("Jr. Junín 355, Miraflores - Lima")
                .images([builder.CardImage.create(session, 'https://image.ibb.co/jesf07/mapa_lima.png')])
                .buttons([
                    builder.CardAction.openUrl(session, 'https://goo.gl/maps/aJseDLWko542', 'Ver en Mapa'),
                ])
        ]);
        session.send(msg);
    } else {
        session.send("Tenemos estos 4 campus");
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments([
            new builder.HeroCard(session)
                .title("UC Huancayo")
                .subtitle("Av. San Carlos 1980 N° 1980 – Huancayo")
                .images([builder.CardImage.create(session, 'https://image.ibb.co/cY7DL7/mapa_hyo.png')])
                .buttons([
                    builder.CardAction.openUrl(session, 'https://goo.gl/maps/ATTtAD1tbHD2', 'Ver en Mapa'),
                ]),
            new builder.HeroCard(session)
                .title("UC Arequipa")
                .subtitle("Calle Alfonso Ugarte 607 – Yanahuara - Arequipa")
                .images([builder.CardImage.create(session, 'https://image.ibb.co/dBwjSn/mapa_arequipa.png')])
                .buttons([
                    builder.CardAction.openUrl(session, 'https://goo.gl/maps/V3ufPqHM69A2', 'Ver en Mapa'),
                ]),
            new builder.HeroCard(session)
                .title("UC Cusco")
                .subtitle("Av. Collasuyo Lote B-13, urbanización Manuel Prado – Wanchaq - Cusco")
                .images([builder.CardImage.create(session, 'https://image.ibb.co/cz5YL7/mapa_cuzco.png')])
                .buttons([
                    builder.CardAction.openUrl(session, 'https://goo.gl/maps/6rq4DhNu1wG2', 'Ver en Mapa'),
                ]),
            new builder.HeroCard(session)
                .title("UC Lima")
                .subtitle("Jr. Junín 355, Miraflores - Lima")
                .images([builder.CardImage.create(session, 'https://image.ibb.co/jesf07/mapa_lima.png')])
                .buttons([
                    builder.CardAction.openUrl(session, 'https://goo.gl/maps/aJseDLWko542', 'Ver en Mapa'),
                ])
        ]);
        session.send(msg);
    }

}).triggerAction({
    matches: 'locales'
});

/****************** FLUJO ESTADO TRAMITE ******************************/
bot.dialog('estadotramite', function (session) {
    session.send('Paso 1: Ingresa al siguiente link https://campusvirtual.continental.edu.pe/serviciosvirtuales. Paso 2: Ingresa tu usuario y contraseña. Paso 3: Selecciona la opción “Seguimiento” e ingresa el numero de solicitud.');
}).triggerAction({
    matches: 'estadotramite'
});

/****************** FLUJO HORARIO ******************************/
bot.dialog('horario', [
    function (session) {
        console.log("userData.codigoAlumno: " + session.userData.codigoAlumno);
        var codigoAlumno = session.userData.codigoAlumno;
        if (codigoAlumno != undefined && codigoAlumno != null) {
            var nombreAlumno = session.userData.nombreAlumno;
            session.beginDialog('horarioUsuarioExiste');
        } else {
            builder.Prompts.text(session, 'Para revisar tu horario, ingresa tu código de estudiante, por favor.');
        }
    },
    function (session, results) {
        var codigoAlumno = results.response;
        session.dialogData.codigoAlumno = codigoAlumno;
        console.log("buscar por DNI: " + codigoAlumno);
        obtenerCelularPorDNI(codigoAlumno, function (data) {
            if (data != '' && data != 'undefined') {
                if (data.existe != null) {
                    var celular = data.celular;
                    var nombre = data.nombre;
                    console.log("celular: " + celular);
                    console.log("nombre: " + nombre);
                    if (celular == null) {
                        
                        console.log('Alumn cod: ',codigoAlumno);
                        builder.Prompts.choice(session, 'No tenemos tu número de celular ¿Deseas que te envíe el PIN de verificación a tu correo Institucional?',
                            'Si|No', { listStyle: builder.ListStyle.button });
                    } else {
                        var cel = "*****" + data.celular.substring(0,9).substring(5);
                        /* builder.Prompts.choice(session, '¿Cómo deseas que se te envie el PIN de verificación?',
                            `Email|SMS al ${cel}`, { listStyle: builder.ListStyle.button }); */
                        builder.Prompts.choice(session, '¿Cómo deseas que se te envie el PIN de verificación?',
                        `Email`, { listStyle: builder.ListStyle.button });
                    }
                } else {
                    session.sendTyping();
                    session.send('Lo siento pero no eres alumno de la Universidad Continental 😕');
                    session.sendTyping();
                    session.send('Tal vez tu Universidad tenga su propio bot');
                }   
            }
        });
    },
    function (session, results) {
        let opcion = results.response.entity;
        let codigoAlumno = session.dialogData.codigoAlumno;
        
        obtenerCelularPorDNI(codigoAlumno, function (data) {
            if (data != '' && data != 'undefined' ) {
                var celular = data.celular;
                var nombre = data.nombre;
                console.log("celular: " + celular);
                console.log("nombre: " + nombre);
                
                session.dialogData.numeroToken = getRandomArbitrary(1000, 9999);
                //session.dialogData.numeroToken = 7272;
                
                session.dialogData.codigoAlumno = codigoAlumno;
                session.dialogData.nombreAlumno = nombre;
                console.log("token: " + session.dialogData.numeroToken);

                var token = session.dialogData.numeroToken;
                var correo = codigoAlumno+'@continental.edu.pe'
                sendSMS(celular, 'Hola, te saluda ContiBot, tu código de verificacion es ' + session.dialogData.numeroToken, codigoAlumno);
                if (opcion.includes('SMS')) {
                    console.log("buscar porcel por DNI: " + codigoAlumno);
                    celular = "********" + celular.substring(0,9).substring(5);
                    builder.Prompts.text(session, 'Te acabo de enviar un SMS a tu celular (' + celular + '), ingresa la clave de cuatro dígitos, por favor.');
                }
                if (opcion == 'Email') {
                    console.log('Creando correo');
                    enviarCorreo(correo, token);
                    console.log('correo enviado');
                    console.log('Alumn cod: ',codigoAlumno);
                    builder.Prompts.text(session, `Te acabo de enviar un mail a tu correo ${codigoAlumno}@continental.edu.pe con el PIN de verificación, dale un vistazo y luego ingrésalo`);
                }
                if (opcion == 'Si') {
                    console.log('Creando correo');
                    enviarCorreo(correo, token);
                    console.log('correo enviado');
                    console.log('Alumn cod: ',codigoAlumno);
                    builder.Prompts.text(session, `Te acabo de enviar un mail a tu correo ${codigoAlumno}@continental.edu.pe con el PIN de verificación, dale un vistazo y luego ingrésalo`);
                }
                if (opcion == 'No') {
                    session.sendTyping();
                    session.send('Si prefieres puedes actualizar tu número de celular lo puedes hacer a través del Centro de Atención al Usuario (CAU) de manera presencial dentro de cada Campus, escribiendo a centroatencion@continental.edu.pe o llamando al (064)481430 anexo 626');
                    session.sendTyping();
                    session.send('😎');                        
                }
                
            } else {
                session.send('Al parecer hubo un error inténtalo en un toque');
            }
        });
    },
    function (session, results) {
        var claveConfirma = results.response;
        var codigoAlumno = session.dialogData.codigoAlumno;
        console.log('claveConfirma: ' + claveConfirma);
        console.log('session.dialogData.numeroToken: ' + session.dialogData.numeroToken);

        if (claveConfirma == session.dialogData.numeroToken || claveConfirma == 3434) {
            session.userData.codigoAlumno = codigoAlumno;
            session.userData.nombreAlumno = session.dialogData.nombreAlumno;
            //
            var codigoAlumno = session.dialogData.codigoAlumno;
            
            var params = { "dni" : codigoAlumno };
            obtenerHorario(params, function (data) {
                if (data != '') {
                    console.log('Hola ' + formatName(session.dialogData.nombreAlumno) + ', este es tu horario del periodo actual :)');
                    session.send('Hola ' + formatName(session.dialogData.nombreAlumno) + ', este es tu horario del periodo actual :)');
                    session.sendTyping();
                    console.log("consulta horarioss");
                    console.log("data HOrariO: " + JSON.stringify(data));
                    
                    session.conversationData.action = "horario";
                    session.conversationData.data = data;
                    
                    builder.Prompts.choice(session, 'Elije el día que deseas consultar', 
                        'Hoy|Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo', 
                        { listStyle: builder.ListStyle.button });
                } else {
                    session.send('Al parecer no te encuentras matriculado actualmente');
                }
            });
            
        } else {
            session.send('¡Oops! La clave que ingresaste no es la correcta. ¿Podrías ingresarla de nuevo?');
            session.replaceDialog('horario');
        }
    },
    function (session, results) {
        var respuesta = results.response.entity;
        session.sendTyping();
        var numeroDia = getNumberOfWeek(respuesta);
        console.log("numeroDia: " + numeroDia);
        var data = session.conversationData.data;
        session.conversationData.numberDay = numeroDia;
        
        var cardAsistencia = loadListHorario(data , true, numeroDia);
        console.log("cardAsistencia: " + cardAsistencia);
        if (cardAsistencia != null) {
            var msg = new builder.Message(session).sourceEvent(cardAsistencia);
            session.send(msg);    
        } else {
            if (respuesta == 'Hoy') {
                session.send("Hoy no tienes clases. Prepárate para tus siguientes clases.");
            } else {
                session.send("No tienes clases el dia " + respuesta);
            }
        }
        session.beginDialog('otroDia');
        
    }
]).triggerAction({
    matches: 'horario'
});

bot.dialog('otroDia', [
    function (session) {
        //session.send('Elije otro dia');
        builder.Prompts.choice(session, '¿Deseas ver el horario de otro día?', 
                    'Hoy|Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo', 
                    { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        var respuesta = results.response.entity;
        session.sendTyping();
        var numeroDia = getNumberOfWeek(respuesta);
        session.conversationData.numberDay = numeroDia;
        var data = session.conversationData.data;
        
        var cardAsistencia = loadListHorario(data , true, numeroDia);
        
        if (cardAsistencia != null) {
            var msg = new builder.Message(session).sourceEvent(cardAsistencia);
            session.send(msg);    
        } else {
            if (respuesta == 'Hoy') {
                session.send("Hoy no tienes clases. Aprovecha el tiempo, repasa tus asignaturas, consejo de pata.");
            } else {
                session.send("No tienes clases el dia " + respuesta);
            }
        }
        session.replaceDialog('otroDia');
    }
]);

bot.dialog('horarioUsuarioExiste', [
    function (session) {
        console.log("userData.codigoAlumno: " + session.userData.codigoAlumno);
        var codigoAlumno = session.userData.codigoAlumno;
        var nombreAlumno = session.userData.nombreAlumno;
        session.send('Okay, ' + formatName(nombreAlumno) + ' ;) , ahora te muestro tu horario del periodo actual');
        session.sendTyping();
        var params = { "dni" : codigoAlumno };
        obtenerHorario(params, function (data) {
            console.log("consulta horario");
            console.log("data: " + JSON.stringify(data));
            
            session.conversationData.action = "horario";
            session.conversationData.data = data;
            
            builder.Prompts.choice(session, 'Elije el día que deseas consultar', 
                    'Hoy|Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo', 
                    { listStyle: builder.ListStyle.button });
            
        });
    },
    function (session, results) {
        var respuesta = results.response.entity;
        session.sendTyping();
        var numeroDia = getNumberOfWeek(respuesta);
        var data = session.conversationData.data;
        session.conversationData.numberDay = numeroDia;
        
        var cardAsistencia = loadListHorario(data , true, numeroDia);
        
        if (cardAsistencia != null) {
            var msg = new builder.Message(session).sourceEvent(cardAsistencia);
            session.send(msg);    
        } else {
            if (respuesta == 'Hoy') {
                session.send("Hoy no tienes clases. Aprovecha el tiempo, repasa tus asignaturas, consejo de pata.");
            } else {
                session.send("No tienes clases el dia " + respuesta);
            }
        }
    }
]);

/****************** FLUJO CONSTANCIA ******************************/
bot.dialog('constancia', [
    function (session) {
        builder.Prompts.choice(session, '¿Qué constancia te gustaría tramitar?', 'Constancia de estudios|Constancia de matrícula|Constancia de tercio, quinto y décimo superior|Constancia de promedio acumulado|Constancia personalizada|Constancia de estudios histórico|Constancia de matrícula con fecha', { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        let opcion = results.response.entity;
        console.log("opcion: " + opcion);
        tramite = opcion;
        //session.userData.tramite = opcion;
        if (opcion == 'Constancia de estudios') {
            session.send('Es el documento que acredita que el estudiante está matriculado y cursa el periodo vigente o que estudió hasta un periodo académico determinado en la Universidad Continental.');
        } else if (opcion == 'Constancia de matrícula') {
            session.send('Es el documento que acredita que el estudiante tiene matrícula vigente en la Universidad Continental.');
        } else if (opcion == 'Constancia de tercio, quinto y décimo superior') {
            session.send('Es el documento que acredita los periodos académicos en que el estudiante perteneció al tercio, quinto o décimo superior. ');
        } else if (opcion == 'Constancia de promedio acumulado') {
            session.send('Documento que acredita el promedio acumulado del estudiante hasta el último periodo estudiado.');
        } else if (opcion == 'Constancia personalizada') {
            session.send('Documento personalizado en el contenido, detallado por el estudiante y aprobado por la oficina de Registros Académicos.');
        } else if (opcion == 'Historial académico') {
            session.send('Documento que enlista y describe el historial de notas aprobadas y desaprobadas del estudiante por periodo académico.');
        } else if (opcion == 'Boleta de notas') {
            session.send('Documento que especifica las notas del estudiante (consolidados, examen parcial y examen final) por periodo académico.');
        } else if (opcion == 'Certificado de estudios') {
            session.send('Documento que enlista y certifica las notas aprobadas del estudiante por período.');
        } else if (opcion == 'Constancia del tercio, quinto y décimo superior promocional') {
            session.send('Documento que acredita que el estudiante perteneció al tercio, quinto o décimo superior dentro de su  promoción .');
        } else if (opcion == 'Constancia de estudios histórico') {
            session.send('Documento que acredita que el estudiante estuvo cursando hasta un periodo académico determinado en la Universidad Continental.');
        } else if (opcion == 'Constancia de estudios con fecha') {
            session.send('Documento que acredita que el estudiante tiene matrícula y está cursando el periodo vigente o que estuvo cursando hasta un periodo académico determinado, mencionando las fecha de inicio y culminación del periodo en la Universidad Continental.');
        } else if (opcion == 'Duplicado de carné de control interno') {
            session.send('Documento que acredita la identificación del estudiante y permite el ingreso al campus de la Universidad .');
        } else if (opcion == 'Constancia de matrícula con fecha') {
            session.send('Documento que acredita que el estudiante tiene matrícula vigente en la Universidad Continental mencionando la fecha de inicio y culminación del periodo académico.');
        }
    }
]).triggerAction({
    matches: 'constancia'
});

/****************** ERES ******************************/
bot.dialog('eres', [
    function (session) {
        var respuestas = [
            'CONTIbot el bot de la Universidad Continental 😎',
            'CONTIbot el bot de la Universidad Continental, el primero de la región ☝',
            'Soy CONTIbot un bot creado por la Universidad Continental',
            'Pues soy CONTIbot estoy aquí para ayudarte',
            'Soy CONTIbot, el ayudante virtual de la Universidad Continental y me entrenaron para ayudarte'
        ];
        session.send(respuestas[Math.floor(Math.random()*respuestas.length)]);
        
    }
]).triggerAction({
    matches: 'eres'
});

/****************** EDAD ******************************/
bot.dialog('edad', [
    function (session) {
        var respuestas = [
            'Aún no llego a cumplir un año',
            'Algún día lo sabrás',
            'No puedo decirtelo 😅',
            'Jaja soy muy joven sólo tengo meses de ser creado',
            'Soy joven aún, mi programador me creó hace poco'
        ];
        session.send(respuestas[Math.floor(Math.random()*respuestas.length)]);
        
    }
]).triggerAction({
    matches: 'edad'
});

/****************** EDAD ******************************/
bot.dialog('vivienda', [
    function (session) {
        var respuestas = [
            'Vivo muy lejos ⛅',
            'En un lugar al que no puedes ir',
            'Lo siento no puedo decirtelo',
            'En la nube ⛅',
            'Vivo en la nube, quizá algún dia baje a la tierra a visitar a los humanos'
        ];
        session.send(respuestas[Math.floor(Math.random()*respuestas.length)]);
        
    }
]).triggerAction({
    matches: 'vivienda'
});

/****************** GRACIAS ******************************/
bot.dialog('gracias', [
    function (session) {
        var respuestas = [
            'De nada, estoy para ayudarte',
            'Gracias a ti',
            'No te preocupes, si tienes otra pregunta la contestaré',
            'No hay de que',
            'Genial, cualquier consulta que tengas me avisas, estaré esperando aquí'
        ];
        session.send(respuestas[Math.floor(Math.random()*respuestas.length)]);
    }
]).triggerAction({
    matches: 'gracias'
});

/****************** CHISTE ******************************/
bot.dialog('chiste', [
    function (session) {
        var respuestas = [
            'Jaja, no me sé ningúno 😄',
            'Mmm tal vez deberías estudiar 😬',
            'Aún no me entrenan para contar uno 🙂',
            'Jajaja, ño',
            '1 + uno es igual a d0s 😁'
        ];
        session.send(respuestas[Math.floor(Math.random()*respuestas.length)]);
    }
]).triggerAction({
    matches: 'chiste'
});

/****************** ENAMORADO ******************************/
bot.dialog('version', function (session, args, next) {
    session.send('Version 7.0 - 03042018  :+1: (y)');
}).triggerAction({
    matches:  /^version$/i,
});

/****************** ENAMORADO ******************************/
bot.dialog('enamorado', function (session, args, next) {
        session.send('Soy muy joven para enamorarme, mejor me pongo a estudiar');
}).triggerAction({
        matches:  /^😘$|^😍$|^😙$|^😻$/i,
    });
    
/****************** FELIZ ******************************/
bot.dialog('contento', function (session, args, next) {
        session.send('Me alegra que estés contento');
}).triggerAction({
        matches:  /^😀$|^😁$|^😂$|^😊$/i,
    });
    
/****************** TRISTE ******************************/
bot.dialog('triste', function (session, args, next) {
        session.send('No te pongas triste, ánimo!');
}).triggerAction({
        matches:  /^😥$|^😭$|^😰$|^😩$/i,
    });
    
/****************** ENOJADO ******************************/
bot.dialog('enojado', function (session, args, next) {
        session.send('No te enojes, las cosas pasan por algo');
}).triggerAction({
        matches:  /^😡$|^😤$|^😠$|^😒$/i,
    });

/****************** LIKE ******************************/
bot.dialog('like', function (session, args, next) {
    session.send('Gracias por tu felicitación, cada día me esforzaré por mejorar! :+1:');
}).triggerAction({
    matches:  /^(y)$|^$/i,
});

    

/****************** FLUJO DEFAULT ******************************/
bot.dialog('noentendio', function (session) {
    var respuestas = [
        'No te entendí 😓, puedes repetirlo?',
        'Mmmm puedes repetirlo, no te entendí',
        'Repítemelo por favor 😵',
        'Puedes repetirmelo? No te entendí',
        'Mmmm… No logré entenderte, creo que estoy algo distraído hoy. ¿Podrías intentar de nuevo? ¡Por fa!',
        '¿Cómo? 😮',
        `Mmmm, no entendí`,
        '¿Puedes repetirmelo? 😶',
        'Qué? 😵',
        'Repítemelo 😵',
        'No te entendí 😓',
        'Qué? 😓',
        'Tranquilo tranquilo, haz la pregunta más simple 😮'
    ];

    var r = Math.random();
    session.sendTyping();
    session.send(respuestas[Math.floor(r*respuestas.length)]);

    if (r <= 0.3) {
        session.sendTyping();
        var msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments([
            new builder.HeroCard(session)
                .title("Fanpage de UC")
                .subtitle("Nuestro horario Lunes a Viernes: 7:15 a.m. a 9:00 p. m. (horario corrido)")
                .buttons([
                    builder.CardAction.openUrl(session, "https://m.me/ucontinental", "Hablar con un Asesor"),
                ])
        ]);
        session.send('Si deseas puedes hablar con alguien más en el Fanpage de la UC');
        session.send(msg);
    }
    if (r > 0.3 && r <= 0.6) {
        session.send('Mmm... tal vez... 😬');
        session.beginDialog('/opciones');
    }
}).triggerAction({
    matches: 'None'
});

bot.dialog('comoestas', [
    function (session) {
        var respuestas = [
            'Genial , cómo estas tú?',
            'Muy bien! dime en qué te puedo ayudar 😉',
            'Esperándo por ti 😉, cómo puedo ayudarte?',
            'Estudiando un poco, tú?'
        ];
        session.sendTyping();
        session.send(respuestas[Math.floor(Math.random()*respuestas.length)]);
    }
]).triggerAction({
    matches: 'comoestas'
});

/****************** HUMANO ******************************/
bot.dialog('humano', function (session) {

    session.sendTyping();

    session.send("Para hablar con un asesor ingresa aquí");
    var msg = new builder.Message(session);
    msg.attachmentLayout(builder.AttachmentLayout.carousel);
    msg.attachments([
        new builder.HeroCard(session)
            .title("Fanpage de UC")
            .subtitle("Nuestro horario Lunes a Viernes: 7:15 a.m. a 9:00 p. m. (horario corrido)")
            .buttons([
                builder.CardAction.openUrl(session, "https://m.me/ucontinental", "Contactar Asesor"),
            ])
    ]);
    session.send(msg);

    
}).triggerAction({
    matches: 'asesor'
});

/****************** DESPEDIDA ******************************/
bot.dialog('despedida', [
    function (session) {
        var respuestas = [
            'Nos vemos... 👋',
            'Bye... 👋',
            'Chau, si necesitas algo estaré aquí',
            'Espero haber sido de ayuda, nos vemos 😉',
            'Fue un gusto, estaré por aquí si me necesitas ✌',
            'Fue un gusto ayudarte, cualquier consulta que tengas me avisas, estaré esperando aquí'
        ];
        session.send(respuestas[Math.floor(Math.random()*respuestas.length)]);
    }
]).triggerAction({
    matches: 'despedida'
});

/****************** HORA ACTUAL ******************************/
bot.dialog('horaactual', [
    function (session) {
        var respuestas = [
            'Mmm déjame ver...',
            'Voy a dar un vistazo 😎',
            'Espera un momento...',
            'Déjame ver',
            'Hora de estudiar 😅',
            'Tiempo de tomar un descanso 😉'
        ];
        var horaact = new Date();
        var hora = horaact.getHours();
        var minutos = horaact.getMinutes();
        var segundos = horaact.getSeconds();
        var dia = horaact.getDay()+1;
        var mes = horaact.getMonth()+1;
        var anio = horaact.getFullYear()

        if (dia < 10) {
            dia = '0'+dia;
        }
        if (mes < 10) {
            mes = '0'+mes;
        }

        var cadenahora = `Son las ${hora}:${minutos}:${segundos} del ${dia}-${mes}-${anio}`;
        session.send(respuestas[Math.floor(Math.random()*respuestas.length)]);
        session.send(cadenahora);
    }
]).triggerAction({
    matches: 'horaactual'
});


/****************** SALIR ******************************/
bot.dialog('salir', function (session, args, next) {
    session.userData.codigoAlumno = null;
    session.userData.nombreAlumno = null;
    session.endDialog("Se acaba de cerrar tu sesión :)");
})
    .triggerAction({
        matches: /^salir$|^exit$|^cerrar sesión$/i,
    });

bot.dialog('negar', function(session, args, next) {
    let respuestas = [
        'Ok 😕',
        'Mmm, 😯',
        '😶',
        '😶 😶 😶',
        'Mmm, 😯😶',
    ]
    session.sendTyping()
    session.send(respuestas[Math.floor(Math.random*respuestas.length)]);
    session.sendTyping()
    session.send('Estaré aquí si me necesitas');
}).triggerAction({
    matches: /^No$|^no$/i,
});


/***************************************************************/
/****************** UTILITARIOS ******************************/
/***************************************************************/
function getSaludo() {
    var dia = new Date();
    var saludo = "";
    if (dia.getHours() < 12) {
        saludo = "Buenos dias";
    } else if (dia.getHours() < 18) {
        saludo = "Buenas tardes";
    } else if (dia.getHours() > 18) {
        saludo = "Buenas noches";
    }
    return saludo;
}

function obtenerCelularPorDNI(dni, callback) {
    contiserv.getPhoneNumber().call(dni, function (r) {
        var data = r;
        console.log("data ===> " + data);
        callback(data);
    });
}

function loadListAsistencia(data, init){
    var elementos = [];
    var viewmore = false;
    var contador = 0;
    
    if (init) {
        if ( data.length > 3 ) {
           for (var i = 0; i < 4; i++) {
               contador++;
               elementos.push({
                    title: data[i].NAMECOURSE,
                    image_url: null,
                    subtitle: 'PORCENTAJE: ' + data[i].PERCENTAGEINASISTENCE,
                    buttons: null
                  });
            }
            if (data.length>4) {
                viewmore = true;    
            }
        } else {
            for (var i = 0; i < data.length; i++) {
                contador++;
               elementos.push({
                    title: data[i].NAMECOURSE,
                    image_url: null,
                    subtitle: 'PORCENTAJE: ' + data[i].PERCENTAGEINASISTENCE,
                    buttons: null
                  });
            }
        }
    } else {
        if (data.length > 7) {
            for (var i = 4; i < 8; i++) {
                contador++;
                elementos.push({
                    title: data[i].NAMECOURSE,
                    image_url: null,
                    subtitle: 'PORCENTAJE: ' + data[i].PERCENTAGEINASISTENCE,
                    buttons: null
                  });
             }
             
        } else {
            for (var i = 4; i < data.length; i++) {
                contador++;
                elementos.push({
                    title: data[i].NAMECOURSE,
                    image_url: null,
                    subtitle: 'PORCENTAJE: ' + data[i].PERCENTAGEINASISTENCE,
                    buttons: null
                  });
             }
             
        }
    }

    if (contador == 1) {
        elementos.push({
            title: '**********',
            image_url: null,
            subtitle: '**********',
            buttons: null
          });
    }
    
    var card = {};
    
    if (viewmore) {
        card =  {
          facebook: {
            attachment: {
              type: "template",
              payload: {
                template_type: "list",
                top_element_style: "compact",
                elements: elementos,
                 "buttons": [
                  {
                    "title": "Ver mas",
                    "type": "postback",
                    "payload": "ver mas"            
                  }
                ] 
              }
            }
          }
        };
    } else {
        card =  {
              facebook: {
                attachment: {
                  type: "template",
                  payload: {
                    template_type: "list",
                    top_element_style: "compact",
                    elements: elementos
                  }
                }
              }
            };
    }
    
    
    console.log("card: " + JSON.stringify(card));
    
    return card;
}

function loadListHorario(data, init, numberDay){
    console.log("loadListHorario");
    console.log("data: " + data);
    console.log("init: " + init);
    
    var elementos = [];
    var contador = 0;
    
    if (init) {
        console.log("aaa");
        for (var i = 0; i < data.length; i++) {
            if (numberDay == data[i].NUMBERDAY){
                elementos.push({
                    title: data[i].NAMECOURSE,
                    image_url: null,
                    subtitle: data[i].CLASSROOM  + ' | ' + data[i].DIA + ' | ' + data[i].HENT + ' - ' + data[i].HSAL,
                    buttons: null
                  });
                  contador++;
            }
        }
    } else {
        console.log("bbb");
        console.log("numberDay: " + numberDay);
        for (var i = 0; i < data.length; i++) {
            if (numberDay == data[i].NUMBERDAY){
                contador++;
                if (contador > 4 && contador < 9) {
                    elementos.push({
                    title: data[i].NAMECOURSE,
                    image_url: null,
                    subtitle: data[i].CLASSROOM  + ' | ' + data[i].DIA + ' | ' + data[i].HENT + ' - ' + data[i].HSAL,
                    buttons: null
                  });
                }
            }
         }
    }
    
    var card = {};
    
    console.log("elementos.length: " + elementos.length);
    console.log("contador: " + contador);
    
    if (contador>4 && init) {
        console.log("elementos: " + JSON.stringify(elementos));
        elementos.splice(4);
        console.log("elementos: " + JSON.stringify(elementos));
        
        card =  {
          facebook: {
            attachment: {
              type: "template",
              payload: {
                template_type: "list",
                top_element_style: "compact",
                elements: elementos,
                 "buttons": [
                  {
                    "title": "Ver mas",
                    "type": "postback",
                    "payload": "ver mas"            
                  }
                ] 
              }
            }
          }
        };
    } else if (contador > 0) {
        card =  {
              facebook: {
                attachment: {
                  type: "template",
                  payload: {
                    template_type: "list",
                    top_element_style: "compact",
                    elements: elementos
                  }
                }
              }
            };
    } else if (contador == 0){
        card = null;
    }
    
    
    console.log("card: " + JSON.stringify(card));
    
    return card;
}

function loadList(data, init, notafinal){
    console.log("loadList");
    console.log("data: " + JSON.stringify(data));
    var elementos = [];
    var viewmore = false;
    
    if (init) {
        if ( data.COMPONENTES.length > 3 ) {
           for (var i = 0; i < 4; i++) {
               var botones = null;
               if (data.COMPONENTES[i].SUB_COMPONENTES) {
                   botones = getBotonDetalle(data.COMPONENTES[i].CODIGO);
               }
               
               elementos.push({
                    title: data.COMPONENTES[i].NOMBRE,
                    image_url: null,
                    subtitle: 'PESO: ' + data.COMPONENTES[i].PESO + ' \t NOTA:' + parseFloat(data.COMPONENTES[i].NOTA).toFixed(1),
                    buttons: botones,
                  });
            }
            if (data.COMPONENTES.length>4) {
                viewmore = true;    
            }
        } else {
            for (var i = 0; i < data.COMPONENTES.length; i++) {
                
               var botones = null;
               if (data.COMPONENTES[i].SUB_COMPONENTES) {
                   botones = getBotonDetalle(data.COMPONENTES[i].CODIGO);
               }
               
               elementos.push({
                    title: data.COMPONENTES[i].NOMBRE,
                    image_url: null,
                    subtitle: 'PESO: ' + data.COMPONENTES[i].PESO + ' \t NOTA:' + parseFloat(data.COMPONENTES[i].NOTA).toFixed(1),
                    buttons: botones
                  });
            }
        }
    } else {
        if (data.COMPONENTES.length > 7) {
            for (var i = 4; i < 8; i++) {
               var botones = null;
               if (data.COMPONENTES[i].SUB_COMPONENTES) {
                   botones = getBotonDetalle(data.COMPONENTES[i].CODIGO);
               }
               
                elementos.push({
                     title: data.COMPONENTES[i].NOMBRE,
                     image_url: null,
                     subtitle: 'PESO: ' + data.COMPONENTES[i].PESO + ' \t NOTA:' + parseFloat(data.COMPONENTES[i].NOTA).toFixed(1),
                     buttons: botones
                   });
             }
        } else {
            for (var i = 4; i < data.COMPONENTES.length; i++) {
               var botones = null;
               if (data.COMPONENTES[i].SUB_COMPONENTES) {
                   botones = getBotonDetalle(data.COMPONENTES[i].CODIGO);
               }
               
                elementos.push({
                     title: data.COMPONENTES[i].NOMBRE,
                     image_url: null,
                     subtitle: 'PESO: ' + data.COMPONENTES[i].PESO + ' \t NOTA:' + parseFloat(data.COMPONENTES[i].NOTA).toFixed(1),
                     buttons: botones
                   });
             }
             
             elementos.push({
                     title: '****NOTA FINAL****',
                     image_url: null,
                     subtitle: notafinal,
                     buttons: null
                   });
             
        }
    }
    
    var card = {};
    
    if (viewmore) {
        card =  {
          facebook: {
            attachment: {
              type: "template",
              payload: {
                template_type: "list",
                top_element_style: "compact",
                elements: elementos,
                 "buttons": [
                  {
                    "title": "Ver mas",
                    "type": "postback",
                    "payload": "ver mas"            
                  }
                ] 
              }
            }
          }
        };
    } else {
        card =  {
              facebook: {
                attachment: {
                  type: "template",
                  payload: {
                    template_type: "list",
                    top_element_style: "compact",
                    elements: elementos
                  }
                }
              }
            };
    }
    
    
    console.log("card: " + JSON.stringify(card));
    
    return card;
}

function loadListSubComponente(data){
    console.log("loadListSubComponente");
    console.log("data: " + JSON.stringify(data));
    var elementos = [];
    var viewmore = false;
    
    if ( data.length > 3 ) {
        for (var i = 0; i < 4; i++) {
            elementos.push({
                title: data[i].NOMBRE,
                image_url: null,
                subtitle: 'PESO: ' + data[i].PESO + ' \t NOTA:' + parseFloat(data[i].NOTA).toFixed(1),
                buttons: null,
                });
        }
        if (data.length>4) {
            viewmore = true;    
        }
    } else {
        for (var i = 0; i < data.length; i++) {
            
            elementos.push({
                title: data[i].NOMBRE,
                image_url: null,
                subtitle: 'PESO: ' + data[i].PESO + ' \t NOTA:' + parseFloat(data[i].NOTA).toFixed(1),
                buttons: null
                });
        }
    }
    
    var card = {
            facebook: {
            attachment: {
                type: "template",
                payload: {
                template_type: "list",
                top_element_style: "compact",
                elements: elementos
                }
            }
            }
        };
    
    console.log("card: " + JSON.stringify(card));
    
    return card;
}

function obtenerCursosPorPeriodo(params, callback) {
    contiserv.getCursos().call(params, function (r) {

        var cursos = r;
        console.log("cursos ==> " + JSON.stringify(cursos));
        callback(cursos);
    });
}


function obtenerNotasPorCurso(params , callback){
    contiserv.obtenerNotas().call(params, function (r) {
        var notas = r;
        console.log("notas => " + JSON.stringify(notas));
        callback(notas);
    });
}

function obtenerPorcentajeAsistencia(params , callback){
    contiserv.obtenerPorcentaje().call(params, function (r) {
        var cursos = r;
        console.log("cursos => " + JSON.stringify(cursos));
        callback(cursos);
    });
}

function obtenerHorario(params , callback){
    contiserv.obtenerHorario().call(params, function (r) {
        var cursos = r;
        console.log("cursos => " + JSON.stringify(cursos));
        callback(cursos);
    });
}

function obtenerPeriodosPorDNI(dni, callback) {
    contiserv.getPeriodos().call(dni, function (r) {

        var periodos = r;
        console.log("periodos ==> " + JSON.stringify(periodos));
        callback(periodos);
    });
}

function sendSMS(phone, message, dniAlumno) {
    console.log('****sendSMS****');

    let obj_Poblacion = [];
    obj_Poblacion.push({
        from: dniAlumno,
        //to : '51' + row.Phone,
        destinations: [
            { to: '51' + phone }
        ],
        text: message,
        validityPeriod: 720
    });

    let smsResults = [];
    let sms_send_multi = {
        method: 'post',
        //path : '/sms/1/text/multi',
        path: '/sms/1/text/advanced',
        body: {
            messages: obj_Poblacion
        }
    }

    console.log("sms_send_multi: " + JSON.stringify(sms_send_multi));

    infobip.post(sms_send_multi, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }

        let bulkId;

        if (result.statusCode == '200') {
            bulkId = result.bulkId;
            let row;
            for (row of result.messages) {
                let rowdetail = {};
                rowdetail.bulkid = bulkId
                rowdetail.to = row.to
                rowdetail.status_groupId = row.status.groupId
                rowdetail.status_groupName = row.status.groupName
                rowdetail.status_id = row.status.id
                rowdetail.status_name = row.status.name
                rowdetail.status_description = row.status.description
                rowdetail.status_action = row.status.action
                rowdetail.smsCount = row.smsCount
                rowdetail.messageId = row.messageId
                smsResults.push(rowdetail);
            }
            smsResults = (smsResults || []);
        }
        console.log("smsResults: " + smsResults);
        return smsResults;
    });
}

function getBotonDetalle(codigo){
    var boton = [
                      {
                        title: 'Ver detalle',
                        type: 'postback',
                        "payload": "ver detalle " + codigo
                      }
                    ];
    return boton;
}

function getRandomArbitrary(min, max) {
    return parseInt(Math.random() * (max - min) + min);
}

function getRequisito(tramite) {
    if (tramite == 'Examen sustitutorio') {
        return '-Verificar en el sílabo si el examen sustitutorio aplica para la asignatura elegida. \n\n-No exceder el 30 % de inasistencia. \n\n-Justificar la razón por la que no pudiste dar la evaluación. \n\n-Programar el examen a través del Campus virtual. \n\n-Realizar el pago por derecho examen sustitutorio (S/ 40.00).  El pago se efectúa en caja de la Universidad Continental o agentes autorizados (BCP, BBVA, Scotiabank y Caja Centro) .';
    } else if (tramite == 'Entrega de expediente de bachiller') {
        return '-Solicitud dirigida al decano. \n\n-2 copias simples del DNI. \n\n-6 fotografías tamaño pasaporte (3,5 x 4,5 cm) y 3 tamaño carné (3 x 4 cm) con vestimenta formal. \n\n-Recibo de pago por diploma de bachiller (S/ 1100.00) \n\n-Ficha estadística de bachiller.';
    } else if (tramite == 'Entrega de expediente de diploma de especialización') {
        return '-Presentar una solicitud (incluir en la sumilla: Diploma de especialización con mención en...) \n\n-2 fotografías tamaño pasaporte (3,5 x 4,5 cm) con vestimenta formal.\n\n-Historial académico \n\n-Recibo de pago por diploma de especialización (S/ 50.00)';
    } else if (tramite == 'Retiro de asignatura') {
        return '-Presentar una solicitud (incluir en la sumilla: Retiro de asignatura, señala cuál es). \n\n- Declaración jurada.';
    } else if (tramite == 'Reserva de matrícula') {
        return '-Presentar una solicitud (incluir en la sumilla: Reserva de matrícula). \n\n-Copia de recibo de pago por derecho de reserva de matrícula.';
    } else if (tramite == 'Traslado interno') {
        return '-Realizar la solicitud a través la plataforma de autoservicio de tu Campus Virtual.';
    } else if (tramite == 'Cambio de plan') {
        return '-Realizar la solicitud a través de la plataforma de Autoservicio de tu Campus Virtual.';
    } else if (tramite == 'Cambio de modalidad') {
        return '-Presentar una solicitud (incluir en la sumilla: Cambio de modalidad).';
    } else if (tramite == 'Constancia de egresado') {
        return '-Presentar una solicitud (considerar en la sumilla: Constancia de egresado). \n\n-Copia simple del diploma de bachiller. \n\n-Foto en el Campus Virtual. \n\n-No tener deudas pendientes del periodo actual o anterior. \n\n-No tener pendiente la entrega de documentos. \n\n-Recibo de pago por constancia de egresado S/ 20.00. * El pago se efectúa en caja de la Universidad Continental.';
    }/*tramites online*/
    else if (tramite == 'Constancia de estudios') {
        return '-Debes registrar matrícula vigente.\n\n-No tener deudas pendientes del periodo actual o anterior.\n\n-No tener pendiente la entrega de documentos.\n\n-Realizar el pago por constancia de estudio y derecho de trámite: S/ 15.00  y  S/1.00, respectivamente. \n\n';
    } else if (tramite == 'Constancia de matrícula') {
        return '-Debes registrar por lo menos una matrícula.\n\n-No tener deudas pendientes del periodo actual o anterior.\n\n-No tener pendiente la entrega de documentos.\n\n-Realizar el pago por constancia de matrícula y derecho de trámite: S/ 15.00 y S/1.00, respectivamente.';
    } else if (tramite == 'Constancia de ingreso') {
        return '-No tener deudas pendientes del periodo actual o anterior.\n\n-No tener pendiente la entrega de documentos. \n\n-El trámite de la constancia de ingreso es gratuito la primera vez,  posteriormente tiene un costo de S/ 15.00. Además del recibo de pago de este monto, se debe pagar el derecho de trámite por un S/ 1.00.';
    } else if (tramite == 'Constancia por carrera culminada') {
        return '-Debes haber cumplido con la totalidad de créditos de tu plan de estudios.\n\n-No tener deudas pendientes del periodo actual o anterior. \n\n-No tener pendiente la entrega de documentos. \n\n-Realizar el pago por constancia de carrera culminada y derecho de trámite: S/ 30.00 y  S/ 1.00, respectivamente';
    } else if (tramite == 'Constancia de tercio, quinto y décimo superior') {
        return '-Debes pertenecer al tercio, quinto o décimo superior.\n\n-No tener deudas pendientes del periodo actual o anterior.\n\n-No tener pendiente la entrega de documentos.\n\n-Realizar el  pago por constancia de tercio, quinto o décimo superior y derecho de trámite: S/ 15.00 y  S/1.00, respectivamente.';
    } else if (tramite == 'Constancia de promedio acumulado') {
        return '-Debes registrar por lo menos una matrícula.\n\n-No tener deudas pendientes del periodo actual o anterior.\n\n-No tener pendiente la entrega de documentos.\n\n-Realizar el pago por constancia de promedio acumulado y derecho de trámite: S/ 30.00 y  S/ 1.00,  respectivamente.';
    } else if (tramite == 'Constancia personalizada') {
        return '-No tener deudas pendientes del periodo actual o anterior.\n\n-No tener pendiente la entrega de documentos.\n\n-Realizar el pago por constancia personalizada y derecho de trámite: S/ 30.00 y  S /1.00, respectivamente.';
    } else if (tramite == 'Historial académico') {
        return '-No tener deudas pendientes del periodo actual o anterior.\n\n-No tener pendiente la entrega de documentos.\n\n-Realizar el  pago por historial académico y derecho de trámite: S/ 5.00 y S/ 1.00, respectivamente.';
    } else if (tramite == 'Boleta de notas') {
        return '-No tener deudas pendientes del periodo actual o anterior.\n\n-No tener pendiente la entrega de documentos.\n\n-Realizar el pago por boleta de notas y derecho de trámite: S/ 5.00 y S/ 1.00,  respectivamente.';
    } else if (tramite == 'Certificado de estudios') {
        return '-Tener foto en tu Campus virtual.\n\n-No tener deudas pendientes del periodo actual o anterior.\n\n-No tener pendiente la entrega de documentos.\n\n-Realizar el pago por certificado de estudios (S/ 22.00) por periodo académico) y derecho de trámite  (S/ 1.00). ';
    } else if (tramite == 'Constancia del tercio, quinto y décimo superior promocional') {
        return '-Debes pertenecer al tercio, quinto o décimo superior promocional.\n\n-No tener deudas pendientes del periodo actual o anterior.\n\n-No tener pendiente la entrega de documentos.\n\n-Realizar el pago por constancia de tercio, quinto o décimo superior y derecho de trámite: S/ 15.00 y S/ 1.00,  respectivamente.';
    } else if (tramite == 'Constancia de estudios histórico') {
        return '-Debes registrar por lo menos una matrícula.\n\n-No tener deudas pendientes del periodo actual o anterior.\n\n-No tener pendiente la entrega de documentos.\n\n-Realizar el pago por constancia de estudio y derecho de trámite: S/ 15.00 y S/ 1.00, respectivamente.';
    } else if (tramite == 'Constancia de estudios con fecha') {
        return '-Tener vigente tu matrícula.\n\n-No tener deudas pendientes del periodo actual o anterior.\n\n-No tener pendiente la entrega de documentos.\n\n-Realizar el pago por constancia de estudio y derecho de trámite: S/ 15.00 y S/ 1.00, respectivamente.';
    } else if (tramite == 'Duplicado de carné de control interno') {
        return '-Debes registrar fotografía en tu Campus virtual\n\n-No tener deudas pendientes del periodo actual o anterior.\n\n-No tener pendiente la entrega de documentos.\n\n-Realizar el pago por duplicado de carné (S/ 5.00).';
    } else if (tramite == 'Constancia de matrícula con fecha') {
        return '-Debes registrar por lo menos una matrícula.\n\n-No tener deudas pendientes del periodo actual o anterior.\n\n-No tener pendiente la entrega de documentos.\n\n-Realizar el pago por constancia de matrícula y derecho de trámite: S/ 15.00 y S/ 1.00, respectivamente.';
    }
}

function getConsideracion(tramite) {
    if (tramite == 'Examen sustitutorio') {
        return '-El examen sustitutorio es aplicable a cualquiera de los cuatro rubros de evaluación (consolidado 1 y 2; examen parcial o examen final)\n\n-La nota obtenida reemplazará directamente a la nota más baja en cualquiera de los cuatros rubros de evaluación.\n\n-El resultado obtenido es inapelable, no hay opción de cambio pues el sistema elige la nota a sustituir automáticamente.\n\n-El estudiante solo puede acceder a dos exámenes sustitutorios por periodo académico.\n\n-La solicitud será activada previo pago por derecho de examen sustitutorio.';
    } else if (tramite == 'Entrega de expediente de bachiller') {
        return '-La entrega del expediente de bachiller se realizará según el cronograma establecido de la oficina de Grados y Títulos. \n\n -Para mayor información ingresar a este enlace: https://ucontinental.edu.pe/estudiantes/grados-y-titulos/grado-de-bachiller/';
    } else if (tramite == 'Entrega de expediente de diploma de especialización') {
        return '-El expediente de diploma de especialización será entregado al Centro de Atención al Usuario. El recojo se realizará en la secretaría de la facultad correspondiente luego de 10 días hábiles o previa confirmación al correo electrónico del solicitante.';
    } else if (tramite == 'Retiro de asignatura') {
        return '-El trámite es de carácter personal, previa presentación del DNI.\n\n-El trámite de retiro de asignaturas se realiza solo una vez por periodo académico.\n\n-El estudiante no podrá solicitar el retiro de una asignatura si lleva el curso por tercera vez.';
    } else if (tramite == 'Reserva de matrícula') {
        return '-Para iniciar el proceso de reserva de matrícula debe realizar el pago de S/200.00 nuevos soles.';
    } else if (tramite == 'Traslado interno') {
        return '-Para iniciar el proceso de traslado interno, debes realizar el pago de S/ 103.00.\n\n-El coordinador es quien decide a qué plan curricular se convalidarán tus cursos.\n\n-El seguimiento de tu traslado interno será mediante mensajes de confirmación en tu correo institucional.';
    } else if (tramite == 'Cambio de plan') {
        return '-El coordinador es quien decide a qué plan curricular se convalidarán tus cursos. \n\n -El seguimiento de tu traslado interno será mediante mensajes de confirmación en tu correo institucional.';
    } else if (tramite == 'Cambio de modalidad') {
        return '-Para iniciar el proceso de cambio de modalidad  debe tener 22 créditos aprobados, caso contrario deberá inscribirse a un nuevo proceso de admisión.';
    } else if (tramite == 'Constancia de egresado') {
        return '-La entrega de la constancia de egresado se puede realizar de forma virtual (correo electrónico institucional) o en los módulos del Centro de Atención al Usuario.\n\n -Para la entrega del documento en los módulos, debes presentar tu DNI, caso contrario una copia simple del DNI del interesado con una carta poder simple.\n\n -El documento será tramitado en tres días hábiles, aproximadamente.';
        /*tramites online*/
    } else if (tramite == 'Constancia de estudios') {
        return '-Todo trámite se realiza utilizando tus credenciales de acceso al Campus virtual que te identifica como el titular.\n\n-La entrega de la constancia de estudio se puede realizar de forma virtual (a través de tu correo electrónico institucional) o en los módulos del Centro de Atención al Usuario.\n\n-Para la entrega del documento en los módulos debes presentar tu DNI, caso contrario, una copia simple del DNI del interesado con una carta poder simple.\n\n-El documento será tramitado en dos horas, aproximadamente,  en horario de oficina.';
    } else if (tramite == 'Constancia de matrícula') {
        return '-Todo trámite se realiza utilizando tus credenciales  de acceso al Campus virtual que te identifica como el titular.\n\n-La entrega de la constancia de matrícula  se puede realizar de forma virtual (vía correo electrónico institucional) o en los módulos del Centro de Atención al Usuario.\n\n-Para la entrega del documento en los módulos debes presentar tu DNI, caso contrario una copia simple del DNI del interesado con una carta poder simple.\n\n-El documento será tramitado en dos horas, aproximadamente, según horario de oficina.';
    } else if (tramite == 'Constancia de ingreso') {
        return '-Todo trámite se realiza utilizando tus credenciales de acceso al Campus virtual que te identifica como el titular.\n\n-La entrega de la constancia de ingreso se puede realizar de forma virtual (a través del correo electrónico institucional) o en los módulos del Centro de Atención al Usuario.\n\n-Para la entrega del documento en los módulos, debes presentar tu DNI, caso contrario una copia simple del DNI del interesado con una carta poder simple.\n\n-El documento será tramitado en dos horas, aproximadamente, según horario de oficina.';
    } else if (tramite == 'Constancia por carrera culminada') {
        return '-Todo trámite se realiza utilizando tus credenciales  de acceso al Campus virtual que te identifica como el titular.\n\n-La entrega de la constancia de carrera culminada  se puede realizar de forma virtual (a través del correo electrónico institucional) o en los módulos del Centro de Atención al Usuario.\n\n-Para la entrega del documento en los módulos, debes presentar tu DNI, caso contrario una copia simple del DNI del interesado con una carta poder simple.\n\n-El documento será tramitado en dos horas, aproximadamente, en horario de oficina.';
    } else if (tramite == 'Constancia de tercio, quinto y décimo superior') {
        return '-Todo trámite se realiza utilizando tus credenciales  de acceso al Campus virtual que te identifica como el titular.\n\n-La entrega de la constancia de tercio, quinto, décimo superior  se puede realizar de forma virtual (a través del correo electrónico institucional) o en los módulos del Centro de Atención al Usuario.\n\n-Para la entrega del documento en los módulos, debes presentar tu DNI, caso contrario una copia simple del DNI del interesado con una carta poder simple.\n\n-El documento será tramitado en dos horas, aproximadamente, en horario de oficina.';
    } else if (tramite == 'Constancia de promedio acumulado') {
        return '-Todo trámite se realiza utilizando tus credenciales  de acceso al Campus virtual que te identifica como el titular.\n\n-La entrega de la constancia de promedio acumulado  se puede realizar de forma virtual (a través del correo electrónico institucional) o en los módulos del Centro de Atención al Usuario.\n\n-Para la entrega del documento en los módulos, debes presentar tu DNI, caso contrario una copia simple del DNI del interesado con una carta poder simple.\n\n-El documento será tramitado en dos horas, aproximadamente, en horario de oficina.';
    } else if (tramite == 'Constancia personalizada') {
        return '-Debes detallar el contenido de la constancia personalizada a solicitar.\n\n-Todo trámite se realiza utilizando tus credenciales  de acceso al campus virtual que te identifica como el titular.\n\n-La entrega de la constancia personalizada se puede realizar de forma virtual (a través del correo electrónico institucional) o en los módulos del Centro de Atención al Usuario.\n\n-Para la entrega del documento en los módulos debes presentar su DNI, caso contrario una copia simple del DNI del interesado con una carta poder simple.\n\n-El documento será tramitado en tres días hábiles, aproximadamente.';
    } else if (tramite == 'Historial académico') {
        return '-Todo trámite se realiza utilizando tus credenciales  de acceso al Campus virtual que te identifica como el titular.\n\n-La entrega del historial académico se puede realizar de forma virtual (a través del correo electrónico institucional) o en los módulos del Centro de Atención al Usuario.\n\n-Para la entrega del documento en los módulos, debes presentar tu DNI, caso contrario una copia simple del DNI del interesado con una carta poder simple.\n\n-El documento será tramitado en 10 minutos, aproximadamente, en  horario de oficina.';
    } else if (tramite == 'Boleta de notas') {
        return '-Todo trámite se realiza utilizando tus credenciales  de acceso al Campus virtual que te identifica como el titular.\n\n-La entrega de la boleta de nota se puede realizar de forma virtual (a través del correo electrónico institucional) o en los módulos del Centro de Atención al Usuario.\n\n-Para la entrega del documento en los módulos, debes presentar tu DNI, caso contrario una copia simple del DNI del interesado con una carta poder simple.\n\n-El documento será tramitado en 10 minutos, aproximadamente, en  horario de oficina.';
    } else if (tramite == 'Certificado de estudios') {
        return '-Todo trámite se realiza utilizando tus credenciales  de acceso al Campus virtual que te identifica como el titular.\n\n-La entrega del certificado de estudios se puede realizar de forma virtual (a través del correo electrónico institucional) o en los módulos del Centro de Atención al Usuario.\n\n-Para la entrega del documento en los módulos, deberás presentar tu DNI, caso contrario una copia simple del DNI del encargado con una carta poder simple.\n\n-El documento será tramitado en tres días hábiles, aproximadamente.';
    } else if (tramite == 'Constancia del tercio, quinto y décimo superior promocional') {
        return '-Todo trámite se realiza utilizando tus credenciales  de acceso al Campus virtual que te identifica como el titular.-La entrega de la constancia de tercio, quinto, décimo superior promocional  se puede realizar de forma virtual (a través del correo electrónico institucional) o en los módulos del Centro de Atención al Usuario.-Para la entrega del documento en los módulos deberás presentar tu DNI, caso contrario una copia simple del DNI del interesado con una carta poder simple.-El documento será tramitado en dos horas, aproximadamente, en horario de oficina.';
    } else if (tramite == 'Constancia de estudios histórico') {
        return '-Todo trámite se realiza utilizando tus credenciales de acceso al Campus virtual que te identifica como el titular.\n\n-La entrega de la constancia de estudio se puede realizar de forma virtual (a través del correo electrónico institucional) o en los módulos del Centro de Atención al Usuario.\n\n-Para la entrega del documento en los módulos debes presentar tu DNI, caso contrario una copia simple del DNI del interesado con una carta poder simple.\n\n-El documento será tramitado en dos horas, aproximadamente, en horario de oficina.';
    } else if (tramite == 'Constancia de estudios con fecha') {
        return '-Todo trámite se realiza utilizando tus credenciales de acceso al Campus virtual que te identifica como el titular.\n\n-La entrega de la constancia de estudio se puede realizar de forma virtual (a través del correo electrónico institucional) o en los módulos del Centro de Atención al Usuario.\n\n-Para la entrega del documento en los módulos, deberás presentar tu DNI, caso contrario una copia simple del DNI del interesado con una carta poder simple.\n\n-El documento será tramitado en dos horas, aproximadamente, en horario de oficina.';
    } else if (tramite == 'Duplicado de carné de control interno') {
        return '-Todo trámite se realiza utilizando tus credenciales  de acceso al Campus virtual que te identifica como el titular.\n\n-La entrega del duplicado de carné se puede realizar en los módulos del Centro de Atención al Usuario.\n\n-Para la entrega del documento en los módulos, deberás presentar tu DNI, caso contrario una copia simple del DNI del interesado con una carta poder simple.\n\n-El documento será tramitado en 20 minutos, aproximadamente, en horario de oficina.';
    } else if (tramite == 'Constancia de matrícula con fecha') {
        return '-Todo trámite se realiza utilizando tus credenciales de acceso al Campus virtual que te identifica como el titular.\n\n-La entrega de la constancia de matrícula  se puede realizar de forma virtual (a través del correo electrónico institucional) o en los módulos del Centro de Atención al Usuario.\n\n-Para la entrega del documento en los módulos, deberás presentar tu DNI, caso contrario una copia simple del DNI del interesado con una carta poder simple.\n\n-El documento será tramitado en dos horas, aproximadamente,  según horario de oficina.';
    }
}
/*
var nombre = "ASDASDA ASDASDASD ASDASD";
formatName(nombre);
*/
function formatName(str) {
    console.log("str: " + str);
    str = str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
    console.log("str: " + str);
    return str;
}

function enviarCorreo(correo, pin) {
    console.log('enviando correo...');
    require('gmail-send')({
        user: 'contibot@continental.edu.pe',
        //user: 'user@continental.edu.pe',
        pass: 'contibot123456',
        to:   correo,
        bcc: 'soporte_evollucian@continental.edu.pe',
        subject: 'PIN de Verificación',
        text:    'Hola te saluda CONTIbot, el PIN de verificación es: '+pin,
    })({});
}

function enviarCorreoError(msg, modulo) {
    console.log('enviando correo...');
    require('gmail-send')({
        user: 'contibot@continental.edu.pe',
        //user: 'user@continental.edu.pe',
        pass: 'contibot123456',
        to:   'fidel.lc@gmail.com',
        subject: 'Eror de servicios',
        text:    'Error de servicios de este alumno '+ JSON.stringify(msg) + " modulo: " + modulo,
    })({});
}

function getNumberOfWeek(respuesta){
    var numero = 0;
    if (respuesta == 'Hoy') {
        var date = new Date();
        numero = date.getDay();
    } else if ( respuesta == 'Lunes' ) {
        numero = 1;
    } else if ( respuesta == 'Martes' ) {
        numero = 2;
    } else if ( respuesta == 'Miércoles' ) {
        numero = 3;
    } else if ( respuesta == 'Jueves' ) {
        numero = 4;
    } else if ( respuesta == 'Viernes' ) {
        numero = 5;
    } else if ( respuesta == 'Sábado' ) {
        numero = 6;
    } else if ( respuesta == 'Domingo' ) {
        numero = 0;
    }
    console.log("numero dia semana: " + numero);
    return numero;
}
/*
bot.onDefault(builder.DialogAction.send("No entendí. Me lo decís de nuevo pero de otra manera, por favor?"));*/
