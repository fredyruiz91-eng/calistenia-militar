const rutinas = {
  principiante: [
    { nombre: "Flexiones en rodillas o inclinadas", trabajo: 30, descanso: 30, rondas: 3 },
    { nombre: "Sentadillas", trabajo: 30, descanso: 30, rondas: 3 },
    { nombre: "Plancha", trabajo: 25, descanso: 30, rondas: 3 },
    { nombre: "Mountain climbers suaves", trabajo: 25, descanso: 30, rondas: 3 },
    { nombre: "Zancadas alternas", trabajo: 30, descanso: 30, rondas: 3 }
  ],
  intermedio: [
    { nombre: "Flexiones", trabajo: 35, descanso: 25, rondas: 4 },
    { nombre: "Dominadas asistidas o negativas", trabajo: 25, descanso: 35, rondas: 4 },
    { nombre: "Fondos en banco", trabajo: 30, descanso: 25, rondas: 4 },
    { nombre: "Sentadillas", trabajo: 40, descanso: 25, rondas: 4 },
    { nombre: "Plancha", trabajo: 40, descanso: 25, rondas: 4 },
    { nombre: "Burpees", trabajo: 25, descanso: 35, rondas: 4 }
  ],
  avanzado: [
    { nombre: "Flexiones", trabajo: 45, descanso: 20, rondas: 5 },
    { nombre: "Dominadas", trabajo: 30, descanso: 30, rondas: 5 },
    { nombre: "Fondos en paralelas o banco", trabajo: 35, descanso: 25, rondas: 5 },
    { nombre: "Sentadilla pistol asistida", trabajo: 35, descanso: 30, rondas: 5 },
    { nombre: "L-sit o rodillas al pecho", trabajo: 25, descanso: 30, rondas: 5 },
    { nombre: "Burpees", trabajo: 30, descanso: 30, rondas: 5 }
  ],
  militar: [
    { nombre: "Flexiones", trabajo: 40, descanso: 20, rondas: 4 },
    { nombre: "Sentadillas", trabajo: 40, descanso: 20, rondas: 4 },
    { nombre: "Plancha", trabajo: 40, descanso: 20, rondas: 4 },
    { nombre: "Burpees", trabajo: 30, descanso: 20, rondas: 4 },
    { nombre: "Mountain climbers", trabajo: 30, descanso: 20, rondas: 4 }
  ]
};

let timeline = [];
let indice = 0;
let restante = 0;
let fase = "trabajo";
let corriendo = false;
let intervalo = null;

const $ = (id) => document.getElementById(id);

function construirTimeline(clave) {
  const ejercicios = rutinas[clave];
  const maxRondas = Math.max(...ejercicios.map(e => e.rondas || 1));
  const lista = [];

  for (let r = 1; r <= maxRondas; r++) {
    ejercicios.forEach(e => {
      const rondas = e.rondas || 1;
      if (r <= rondas) {
        lista.push({ ...e, rondaActual: r, totalRondas: rondas });
      }
    });
  }
  return lista;
}

function iniciar() {
  if (corriendo) return;
  if (!timeline.length) reiniciar(false);
  corriendo = true;
  $("btnIniciar").textContent = "Pausar";
  intervalo = setInterval(tick, 1000);
}

function pausar() {
  corriendo = false;
  clearInterval(intervalo);
  $("btnIniciar").textContent = "Continuar";
}

function reiniciar(render = true) {
  clearInterval(intervalo);
  corriendo = false;
  $("btnIniciar").textContent = "Iniciar";
  timeline = construirTimeline($("rutina").value);
  indice = 0;
  fase = "trabajo";
  restante = timeline[0]?.trabajo || 0;
  if (render) render();
}

function tick() {
  if (!corriendo) return;
  restante--;
  if (restante <= 0) avanzar();
  render();
}

function avanzar() {
  const actual = timeline[indice];

  if (fase === "trabajo" && actual.descanso > 0) {
    fase = "descanso";
    restante = actual.descanso;
    beep(660, 0.12);
    return;
  }

  indice++;
  fase = "trabajo";

  if (indice >= timeline.length) {
    terminar();
    return;
  }

  restante = timeline[indice].trabajo;
  beep(880, 0.18);
}

function terminar() {
  clearInterval(intervalo);
  corriendo = false;
  $("btnIniciar").textContent = "Iniciar";
  $("ejercicio").textContent = "¡Rutina completada!";
  $("fase").textContent = "";
  $("tiempo").textContent = "00:00";
  $("detalle").textContent = "Descansa e hidrátate.";
  $("lista").innerHTML = "";
  beep(440, 0.4);
}

function render() {
  const actual = timeline[indice];
  if (!actual) return;

  $("ejercicio").textContent = actual.nombre;
  $("fase").textContent =
    fase === "trabajo"
      ? `Trabajo · Ronda ${actual.rondaActual}/${actual.totalRondas}`
      : "Descanso";

  $("tiempo").textContent =
    String(Math.floor(restante / 60)).padStart(2, "0") +
    ":" +
    String(restante % 60).padStart(2, "0");

  $("detalle").textContent = `Siguiente: ${
    timeline[indice + 1]?.nombre || "Fin de la rutina"
  }`;

  $("lista").innerHTML = timeline
    .map(
      (e, i) =>
        `<li class="${i === indice ? "activo" : ""}">${i + 1}. ${e.nombre} (${e.rondaActual}/${e.totalRondas}) · ${e.trabajo}s</li>`
    )
    .join("");
}

function beep(frecuencia, duracion) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = frecuencia;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + duracion);
  } catch (e) {
    // Silencio si el navegador bloquea el audio.
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("rutina").addEventListener("change", () => reiniciar());
  $("btnIniciar").addEventListener("click", () =>
    corriendo ? pausar() : iniciar()
  );
  $("btnReiniciar").addEventListener("click", () => reiniciar());
  reiniciar();
});
