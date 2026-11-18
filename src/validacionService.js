// Logica del Servicio de Validacion (Figura 6: Secuencia de validacion).
// Recibe el codigo QR escaneado en la puerta y responde si el acceso es
// valido o no, y por que.

class ValidacionService {
  constructor(entradaRepository) {
    this.entradaRepository = entradaRepository;
  }

  // Devuelve { valido: boolean, mensaje: string }
  async validarEntrada(codigoQR) {
    if (typeof codigoQR !== "string" || codigoQR.trim() === "") {
      return { valido: false, mensaje: "Codigo QR invalido o vacio" };
    }

    const resultado = await this.entradaRepository.marcarUsada(codigoQR.trim());

    if (!resultado.ok && resultado.motivo === "NO_ENCONTRADA") {
      return { valido: false, mensaje: "Entrada no encontrada" };
    }

    if (!resultado.ok && resultado.motivo === "YA_USADA") {
      return {
        valido: false,
        mensaje: `Entrada ya fue utilizada el ${resultado.entrada.usadaEn}`,
      };
    }

    return { valido: true, mensaje: "Acceso permitido" };
  }
}

module.exports = { ValidacionService };
