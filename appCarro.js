

const express = require('express');
const mysql = require('mysql');
const app = express();
const puerto = process.env.PORT ? process.env.PORT : 3000; //es un if ternario, y consulta existe en el entorno algun PORT disponible?, si es asi lo uso y sino uso el puerto 3000.
const bcrypt = require('bcrypt');
const util = require('util');
const jwt = require('jsonwebtoken');
const { send } = require('process');
const unless = require('express-unless');
//const cors = require('corse');
//import autenticacion from ('autenticacion.js');

app.use(express.json()); // permite el mapeo(la transformacion) de la peticion json a obejto javascript
app.use(express.urlencoded());// permite el mapeo con fformularios
//app.use(cors());
//Conexion con mysql
const conexion = mysql.createConnection({ //esta variable crea la conexion con la base de datos

  host: 'localhost',
  user: 'root',
  password: '',
  database: 'listacompras'
});
conexion.connect((error) => {
  if (error) {
    throw error;
  }
  console.log('conexion con la base de datos mysql establecida');
});

const qy = util.promisify(conexion.query).bind(conexion);// permite el uso de asyn-await en la conexion mysql

// paso 1 Registro
app.post('/registro', async (req, res) => {
  try {
    if (!req.body.usuario || !req.body.clave || !req.body.email || !req.body.celular) {
      throw new Error('no eviaste todos los datos que son requeridos');
    }

    // verifico que no exista el nombre del usuario
    let query = 'SELECT * FROM registro WHERE usuario = ?';
    let respuesta = await qy(query, [req.body.usuario]);
    if (respuesta.length > 0) {
      throw new Error('el usuario utilizado ya existe');
    }
    //si esta todo bien, ahora encripto la clave, siempre guardar las claves en la base de datos, encriptadas
    const claveEncriptada = await bcrypt.hash(req.body.clave, 10); // el 10 es una valor de referencia para bcrypt 
    // guardo el usuario con la clave encriptada
    const nuecoUsuario = {
      usuario: req.body.usuario,
      clave: claveEncriptada,
      email: req.body.email,
      celular: req.body.celular
    }
    query = 'INSERT INTO registro (usuario,clave,email,celular) VALUES (?,?,?,?)',
      respuesta = await qy(query, [req.body.usuario, claveEncriptada, req.body.email, req.body.celular]);

    //query = 'INSERT INTO login (usuario,clave) VALUES(?,?)';
    //respuesta = await qy(query, [req.body.usuario, claveEncriptada]);
    //res.send({ message: 'se ha registrado con exito tu cuenta' });
  }
  catch (e) {
    res.status(413).send({ "message": e.message });
  }
});

// Paso 2 Login
app.post('/login', async (req, res) => {
  try {
    if (!req.body.usuario || !req.body.clave) {
      throw new Error('no enviaste los datos o los datos son incorrectos');
    }
    // paso 1: encuentro el usuario
    let query = 'SELECT * FROM registro WHERE usuario = ?';
    let respuesta = await qy(query, [req.body.usuario]);
    if (respuesta.length == 0) {
      throw new Error('el usuario ingresado no existe')
    }
    // paso 2: verificar la clave
    query = 'SELECT * FROM registro WHERE clave = ?'
    respuesta = await qy(query,[req.body.clave]);
   if (!bcrypt.compareSync(req.body.clave, claveEncriptada)) {
      throw new Error('la contraseña es incorrecta');
    }
  
// Paso 3 SESION
    // agrego sesion al usuario, que se hace generando un Token. Generamos una sesion
    const tokenData = {
      usuario: req.body.usuario,
      clave: claveEncriptada,
      mail: req.body.email,
      celular: req.body.celular
    }
    const token = jwt.sign(tokenData, 'Secret', {
      expiresIn: 60 * 60 * 24 // expira en 24hrs
    })
    res.send({ token });
    res.send({ "message": 'felicitaciones te has logiado con exito' });
    console.log('loguiado con existo');
  }
  catch (e) {
    res.status(413).send({ "message": e.message });
  }

});







//LOGIN siempre usamos metodo POST para enviar un login.
/**app.post('/login', (req, res)=>{
try{
  if(!req.body.user || !req.body.pass){
    send.res({"error":'Tu usuario o contraseña no fueron enviados'});
    return;
  }
  if(req.body.user == 'franco' && req.body.pass == 'asddsa'){
    const tokenData ={
      nombre:'lala',
      apellido:'lele'
    }
    const token = jwt.sign(tokenData,'Secret', {expiresIn: 60*60*24}) //expira en 24hrs
  
    res.send({token});
  }
  else{
    res.send({error:'usuario y/o clave incorrectos'})
  }
}
catch(e){
  console.error(e.message)
  res.status(413).send({"error": e.message});
}

});**/

// Registro y Autenticacion
//const cuenta = autenticacion();
//app.use(verificador);
// Desarrollo de la logica de negocio

/* CATEGORIAS DE PRODUCTOS 
  GET para devovler todas las categorias
  GET id para devoler una sola
  POST guardar una categoria nueva
  PUT para modificar una categoria existente
  DELETE para borrar una categoria existente

  * Definir la ruta -> /categoria
*/
app.get('/categoria', async (req, res) => {
  // try y catch. intentamos hacer algo y sino se puede hacemos lo otro
  try {
    const query = 'SELECT * FROM categoria';
    const respuesta = await qy(query);
    res.send({ "respuesta": respuesta });


  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});

app.get('/categoria/:id', async (req, res) => {
  try {
    const query = 'SELECT * FROM categoria WHERE id = ?';
    const respuesta = await qy(query, [req.params.id]);
    res.send({ 'respuesta': respuesta });

  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});
app.post('/categoria', async (req, res) => {
  try {
    // valido si existe nombre, en este caso si no existe directamente salto al catch 
    if (!req.body.nombre) {
      throw new Error('falta enviar el nombre');
    }
    const nombre = req.body.nombre; //

    // verifico que no exista previamente esa categoria
    let query = 'SELECT id FROM categoria WHERE nombre = ?';
    let respuesta = await qy(query, [nombre]);
    if (respuesta.length > 0) {
      throw new Error('La categoria enviada ya esxiste');
    }

    // guardo la nueva categoria
    query = 'INSERT INTO categoria (nombre) VALUE (?)'
    respuesta = await qy(query, [nombre]);

    res.send({ 'respuesta': respuesta.insertId });
  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});

app.put('/categoria/:id', async (req, res) => {
  try {
    if (!req.body.nombre) {
      throw new Error('No eviaste el nombre')
    }
    let query = 'SELECT * FROM categoria WHERE nombre = ? AND id <> ?';

    let respuesta = await qy(query, [req.body.nombre, req.params.id]);
    console.log('respuesta para ver:', respuesta)
    if (respuesta.length > 0) {
      throw new Error('El nombre que intentas agregar ya existe');
    }
    query = 'UPDATE categoria SET nombre = ? WHERE id = ?';
    respuesta = await qy(query, [req.body.nombre, req.params.id]);

    console.log('que pasa:', respuesta);
    res.send({ "respuesta": respuesta })

  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});

app.delete('/categoria/:id', async (req, res) => {
  try {
    let query = 'SELECT * FROM producto WHERE categoria_id = ?';
    let respuesta = await qy(query, [req.params.id]);
    if (respuesta.length > 0) {
      throw new Error('Esta categoria tiene un productos asociados, no se puede eliminar');
    }

    query = 'DELETE FROM categoria WHERE id = ?';
    respuesta = await qy(query, [req.params.id]);
    res.send({ "respuesta": respuesta });

  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});





/* PRODUCTOS 
ruta -> /producto 
*/
app.get('/producto', async (req, res) => {
  try {
    let query = 'SELECT * FROM producto';
    let respuesta = await qy(query);

    res.send({ "respuesta": respuesta });


  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});

app.get('/producto/:id', async (req, res) => {
  try {
    let query = 'SELECT * FROM producto WHERE id = ?';
    let respuesta = await qy(query, [req.params.id]);
    res.send({ 'respuesta': respuesta });

  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});





app.post('/producto', async (req, res) => {
  try {
    if (!req.body.nombre || !req.body.categoria_id) {
      throw new Error('No enviaste todos los datos necesarios');
    }
    let query = 'SELECT * FROM categoria WHERE id = ?'
    let respuesta = await qy(query, [req.body.categoria_id]);
    if (respuesta.length == 0) {
      throw new Error('Esa categoria no existe');
    }
    query = 'SELECT * FROM producto WHERE nombre = ?';
    respuesta = await qy(query, [req.body.nombre]);

    if (respuesta.length > 0) {
      throw new Error('ese producto ya existe');
    }
    let descripcion = ' ';
    if (req.body.descripcion) {
      descripcion = req.body.descripcion;
    }

    query = 'INSERT INTO producto (nombre, descripcion, categoria_id) VALUES (?,?,?)';
    respuesta = await qy(query, [req.body.nombre, descripcion, req.body.categoria_id]);

    res.send({ "respuesta": respuesta.insertId });
  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});

app.put('/producto/:id', async (req, res) => {
  try {
    if (!req.body.nombre || !req.body.categoria_id) {
      throw new Error('No eviaste la informacion completa');
    }
    let query = 'SELECT * FROM categoria WHERE nombre = ? AND id <> ?';

    let respuesta = await qy(query, [req.body.nombre, req.params.id]);
    console.log('respuesta para ver:', respuesta)
    if (respuesta.length > 0) {
      throw new Error('El nombre que intentas agregar ya existe');
    }
    query = 'UPDATE categoria SET nombre = ? WHERE id = ?';
    respuesta = await qy(query, [req.body.nombre, req.params.id]);

    console.log('que pasa:', respuesta);
    res.send({ "respuesta": respuesta })

  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});

app.delete('/producto/:id', async (req, res) => {
 
  try {
    if (!req.params.id) {
      throw new Error('No enviaste el id del producto')
    }
    let query = 'SELECT * FROM producto WHERE id = ?'
    let respuesta = await qy(query,[req.params.id]);
    if (respuesta.length==0){

      throw new Error('ese producto no existe');
    }
    
    
    query = 'DELETE FROM producto WHERE id = ?';
    respuesta = await qy(query, [req.params.id]);
    res.send({ "respuesta": respuesta });
    res.send('su producto a sido eliminado');

  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});


/*LISTAS DE COMPRA
ruta -> /listaencabezado
*/
app.get('/listaencabezado', async (req, res) => {
  try {
    let query = 'SELECT * FROM listaencabezado';
    let respuesta = await qy(query);

    res.send({ "respuesta": respuesta });
  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }

});
app.get('/listaencabezado/:id', async (req, res) => { // /:id este id es el que viene en el req.params.id
  try {
    let query = 'SELECT * FROM listaencabezado WHERE id = ?';
    let respuesta = await qy(query, [req.params.id]);

    res.send({ "respuesta": respuesta });
  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});
app.post('/listaencabezado', async (req, res) => {
  try {
    if (!req.body.nombre) {
      throw new Error('No enviaste el nombre de tu lista');
    }

    let query = 'SELECT * FROM listaencabezado WHERE nombre = ?';
    let respuesta = await qy(query, [req.body.nombre]);

    if (respuesta.length > 0) {
      throw new Error('ese nombre de lista ya existe');
    }

    query = 'INSERT INTO listaencabezado (nombre) VALUES (?)';
    respuesta = await qy(query, [req.body.nombre]);

    res.send({ "respuesta": respuesta.insertId });
  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});
app.put('/listaencabezado/:id', async (req, res) => {
  try {
    if (!req.body.nombre) {
      throw new Error('No eviaste la informacion completa');
    }
    let query = 'SELECT * FROM listaencabezado WHERE nombre = ? AND id <> ?';
    let respuesta = await qy(query, [req.body.nombre, req.params.id]);

    if (respuesta.length > 0) {
      throw new Error('El nombre que intentas agregar ya existe');
    }
    query = 'UPDATE listaencabezado SET nombre = ? WHERE id = ?';
    respuesta = await qy(query, [req.body.nombre, req.params.id]);
    res.send({ "respuesta": respuesta })

  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});
app.delete('/listaencabezado/:id', async (req, res) => {
  try {
    if (!req.params.id) {
      throw new Error('Ese producto no existe')
    }
    let query = 'DELETE FROM listaencabezado WHERE id = ?';
    let respuesta = await qy(query, [req.params.id]);
    res.send({ "respuesta": respuesta });

  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});
// RUTA --> /listaitems


app.get('/listaitems', async (req, res) => {
  try {
    let query = 'SELECT * FROM listaitems';
    let respuesta = await qy(query);

    res.send({ "respuesta": respuesta });
  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }

});
app.get('/listaitems/:id', async (req, res) => { // /:id este id es el que viene en el req.params.id
  try {
    let query = 'SELECT * FROM listaitems WHERE id = ?';
    let respuesta = await qy(query, [req.params.id]);

    res.send({ "respuesta": respuesta });
  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});
app.post('/listaitems', async (req, res) => {
  try {
    if (!req.body.cantidad || !req.body.producto_id || !req.body.listaencabezado_id) {
      throw new Error('No enviaste todos los datos necesarios');
    }
    let query = 'SELECT * FROM producto WHERE id = ?'
    let respuesta = await qy(query, [req.body.producto_id]);
    if (respuesta.length == 0) {
      throw new Error('Ese producto no existe');
    }
    query = 'SELECT * FROM listaencabezado WHERE id = ?'
    respuesta = await qy(query, [req.body.listaencabezado_id]);
    if (respuesta.length == 0) {
      throw new Error('Esa Lista de encabezado no existe');
    }
    query = 'SELECT * FROM listaitems WHERE producto_id = ?';
    respuesta = await qy(query, [req.body.producto_id]);

    if (respuesta.length > 0) {
      throw new Error('ese producto ya existe');
    }
    /** query = 'SELECT * FROM listaitems WHERE listaencabezado_id = ?';
     respuesta = await qy(query, [req.body.listaencabezado_id]);
   
     if(respuesta.length > 0){
       throw new Error('Esa lista encabezado  ya existe');
     }**/


    query = 'INSERT INTO listaitems (cantidad, producto_id, listaencabezado_id) VALUES (?,?,?)';
    respuesta = await qy(query, [req.body.cantidad, req.body.producto_id, req.body.listaencabezado_id]);

    res.send({ "respuesta": respuesta.insertId });
  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});
app.put('/listaitems/:id', async (req, res) => {
  try {
    if (!req.body.cantidad || !req.body.producto_id || !req.body.listaencabezado_id) {
      throw new Error('No eviaste la informacion completa');
    }
    let query = 'SELECT * FROM listaitems WHERE producto_id = ? AND id <> ?';
    let respuesta = await qy(query, [req.body.producto_id, req.params.id]);

    if (respuesta.length > 0) {
      throw new Error('El producto que intentas agregar ya existe en tu lista');
    }
    query = 'UPDATE listaitems SET cantidad = ?, producto_id = ?, listaencabezado_id = ? WHERE id = ?';
    respuesta = await qy(query, [req.body.cantidad, req.body.producto_id, req.body.listaencabezado_id, req.params.id]);
    res.send({ "respuesta": respuesta })
  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});
app.delete('/listaitems/:id', async (req, res) => {
  verificador();
  try {
    if (!req.params.id) {
      throw new Error('Ese producto no existe')
    }
    let query = 'DELETE FROM listaitems WHERE id = ?';
    let respuesta = await qy(query, [req.params.id]);
    res.send({ "respuesta": respuesta });

  }
  catch (e) {
    console.error(e.message)
    res.status(413).send({ "error": e.message });
  }
});
// ahora para que usuario utilize la app verifico que este logiado y utilizamos un middleware
const verificador = (req, res, next) => {
  try {
    let token = req.headers['Authorization'];

    if (!token) {
      throw new Error('no estas logueado');
    }
    token = token.replace(' bearer ', '')
    jwt.verify(token, 'Secret', (err, user) => {
      if (err) {
        throw new Error('token invalido');
      }
    });
    next();

  }
  catch (e) {
    res.status(403).send({ message: e.message });
  }
}
verificador.unless = unless; // EL UNLESS sirve para definir los metodos y/O ruta que no quiero que sean controlados por el middleware
app.use(verificador.unless({
  path: [
    { url: '/registro', method: ['POST'] } // aca por ejemplo registro no pasa por el middleware
  ]

})); // siempre hago uso del app.use(verificador) despues de declarar la variable, sino tira error.






// Servidor
app.listen(puerto, () => {
  console.log('Servidor escuchando en el puerto' + puerto);
});