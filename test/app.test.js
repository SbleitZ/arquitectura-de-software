const request = require("supertest");
const { crearApp } = require("../src/app");

describe("API del Servicio de Validacion", () => {
  let app;

  beforeEach(() => {
    app = crearApp().app;
  });

  test("GET /salud responde ok", async () => {
    const res = await request(app).get("/salud");
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe("ok");
  });

  test("POST /validar con la entrada demo permite el acceso", async () => {
    const res = await request(app).post("/validar").send({ codigo: "QR-DEMO-001" });
    expect(res.status).toBe(200);
    expect(res.body.valido).toBe(true);
  });

  test("POST /validar la misma entrada dos veces devuelve 409 la segunda vez", async () => {
    await request(app).post("/validar").send({ codigo: "QR-DEMO-001" });
    const res = await request(app).post("/validar").send({ codigo: "QR-DEMO-001" });
    expect(res.status).toBe(409);
    expect(res.body.valido).toBe(false);
  });

  test("POST /validar con un codigo inexistente devuelve 409", async () => {
    const res = await request(app).post("/validar").send({ codigo: "NO-EXISTE" });
    expect(res.status).toBe(409);
    expect(res.body.mensaje).toBe("Entrada no encontrada");
  });

  test("POST /validar sin cuerpo devuelve 409", async () => {
    const res = await request(app).post("/validar");
    expect(res.status).toBe(409);
  });

  test("10 peticiones HTTP simultaneas con el mismo QR: solo una recibe 200 (ASR-05)", async () => {
    const respuestas = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app).post("/validar").send({ codigo: "QR-DEMO-001" })
      )
    );

    expect(respuestas.filter((r) => r.status === 200)).toHaveLength(1);
    expect(respuestas.filter((r) => r.status === 409)).toHaveLength(9);
  });

  test("la validacion responde en menos de 1 segundo (ASR-02)", async () => {
    const inicio = Date.now();
    await request(app).post("/validar").send({ codigo: "QR-DEMO-001" });
    expect(Date.now() - inicio).toBeLessThan(1000);
  });
});
