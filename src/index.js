const { crearApp } = require("./app");

const { app } = crearApp();
const PUERTO = process.env.PORT || 3000;

app.listen(PUERTO, () => {
  console.log(`Servicio de Validacion escuchando en el puerto ${PUERTO}`);
});
