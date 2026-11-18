const { EntradaRepository } = require("../src/entradaRepository");
const { ValidacionService } = require("../src/validacionService");

describe("ValidacionService", () => {
  let repo;
  let servicio;

  beforeEach(() => {
    repo = new EntradaRepository();
    servicio = new ValidacionService(repo);
    repo.crear("QR-001", "Concierto Apertura 2026");
  });

  test("permite el acceso con un codigo QR valido y no usado", async () => {
    const resultado = await servicio.validarEntrada("QR-001");
    expect(resultado.valido).toBe(true);
    expect(resultado.mensaje).toBe("Acceso permitido");
  });

  test("marca la entrada como usada despues de validarla", async () => {
    await servicio.validarEntrada("QR-001");
    const entrada = await repo.buscarPorCodigo("QR-001");
    expect(entrada.usada).toBe(true);
    expect(entrada.usadaEn).not.toBeNull();
  });

  test("rechaza una entrada que ya fue validada antes (ASR-05)", async () => {
    const primera = await servicio.validarEntrada("QR-001");
    const segunda = await servicio.validarEntrada("QR-001");

    expect(primera.valido).toBe(true);
    expect(segunda.valido).toBe(false);
    expect(segunda.mensaje).toMatch(/ya fue utilizada/i);
  });

  test("rechaza un codigo que no existe en el sistema", async () => {
    const resultado = await servicio.validarEntrada("QR-NO-EXISTE");
    expect(resultado.valido).toBe(false);
    expect(resultado.mensaje).toBe("Entrada no encontrada");
  });

  test("rechaza un codigo vacio o invalido", async () => {
    for (const codigo of ["", "   ", null, undefined, 123]) {
      const resultado = await servicio.validarEntrada(codigo);
      expect(resultado.valido).toBe(false);
    }
  });

  test("con 20 escaneos simultaneos del mismo QR, solo uno tiene exito (ASR-05)", async () => {
    // Las 20 validaciones se lanzan a la vez y quedan intercaladas en el
    // event loop, porque el repositorio simula latencia de base de datos.
    const resultados = await Promise.all(
      Array.from({ length: 20 }, () => servicio.validarEntrada("QR-001"))
    );

    expect(resultados.filter((r) => r.valido)).toHaveLength(1);
    expect(resultados.filter((r) => !r.valido)).toHaveLength(19);
  });

  test("no permite crear dos entradas con el mismo codigo", () => {
    expect(() => repo.crear("QR-001", "Otro evento")).toThrow(/ya existe/);
  });
});
