const express = require("express");
const { EntradaRepository } = require("./entradaRepository");
const { ValidacionService } = require("./validacionService");

function crearApp() {
  const app = express();
  app.use(express.json());

  const entradaRepository = new EntradaRepository();
  const validacionService = new ValidacionService(entradaRepository);

  // Dato de ejemplo, como si el Servicio de Compras ya hubiera generado
  // esta entrada despues de una compra exitosa.
  entradaRepository.crear("QR-DEMO-001", "Concierto Apertura 2026");

  // Endpoint que usa la app del Validador al escanear el QR en la puerta.
  app.post("/validar", async (req, res, next) => {
    try {
      const { codigo } = req.body || {};
      const resultado = await validacionService.validarEntrada(codigo);
      res.status(resultado.valido ? 200 : 409).json(resultado);
    } catch (error) {
      next(error);
    }
  });

  // Endpoint de salud, usado por Kubernetes y por la prueba de humo del pipeline.
  app.get("/salud", (req, res) => res.json({ estado: "ok" }));

  return { app, entradaRepository, validacionService };
}

module.exports = { crearApp };
