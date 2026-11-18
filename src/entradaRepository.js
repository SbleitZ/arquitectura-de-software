// Repositorio en memoria de entradas. En produccion seria la tabla entrada_qr
// de PostgreSQL del Servicio de Validacion (ver diagrama de componentes).
// Se deja en memoria para que el componente se pueda ejecutar y probar en el
// pipeline sin levantar una base de datos.
//
// Los metodos son asincronos para imitar el acceso a una base de datos real.

const LATENCIA_SIMULADA_MS = 5;
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class EntradaRepository {
  constructor() {
    // codigo -> { codigo, evento, usada, usadaEn }
    this.entradas = new Map();
  }

  // Carga una entrada, tal como la generaria el Servicio de Compras despues
  // de confirmar un pago (Figura 5, paso 5: generarEntradaQR).
  crear(codigo, evento) {
    if (this.entradas.has(codigo)) {
      throw new Error(`La entrada ${codigo} ya existe`);
    }
    this.entradas.set(codigo, { codigo, evento, usada: false, usadaEn: null });
  }

  async buscarPorCodigo(codigo) {
    await esperar(LATENCIA_SIMULADA_MS);
    return this.entradas.get(codigo) || null;
  }

  // Marca la entrada como usada en una sola operacion atomica (comprobar y
  // marcar sin un "await" entre medio). Asi, si llegan varias peticiones a la
  // vez para el mismo codigo, solo la primera tiene exito (ASR-05).
  //
  // En PostgreSQL esto equivale a:
  //   UPDATE entrada_qr SET usada = true, usada_en = now()
  //   WHERE codigo = $1 AND usada = false
  //   RETURNING *;
  // Si no devuelve filas, la entrada no existe o ya estaba usada.
  async marcarUsada(codigo) {
    await esperar(LATENCIA_SIMULADA_MS);

    const entrada = this.entradas.get(codigo);
    if (!entrada) return { ok: false, motivo: "NO_ENCONTRADA" };
    if (entrada.usada) return { ok: false, motivo: "YA_USADA", entrada };

    entrada.usada = true;
    entrada.usadaEn = new Date().toISOString();
    return { ok: true, entrada };
  }
}

module.exports = { EntradaRepository };
