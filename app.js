const rutinasBase = {
  principiante: [
    { nombre:"Flexiones en rodillas", img:"flexiones", trabajo:30, descanso:30, rondas:3 },
    { nombre:"Sentadillas", img:"sentadillas", trabajo:30, descanso:30, rondas:3 },
    { nombre:"Plancha", img:"plancha", trabajo:25, descanso:30, rondas:3 },
    { nombre:"Mountain climbers", img:"mountain-climbers", trabajo:25, descanso:30, rondas:3 }
  ],
  intermedio: [
    { nombre:"Flexiones", img:"flexiones", trabajo:35, descanso:25, rondas:4 },
    { nombre:"Dominadas asistidas", img:"dominadas", trabajo:25, descanso:35, rondas:4 },
    { nombre:"Fondos en banco", img:"fondos", trabajo:30, descanso:25, rondas:4 },
    { nombre:"Sentadillas", img:"sentadillas", trabajo:40, descanso:25, rondas:4 },
    { nombre:"Burpees", img:"burpees", trabajo:25, descanso:35, rondas:4 }
  ],
  avanzado: [
    { nombre:"Flexiones", img:"flexiones", trabajo:45, descanso:20, rondas:5 },
    { nombre:"Dominadas", img:"dominadas", trabajo:30, descanso:30, rondas:5 },
    { nombre:"Fondos paralelas", img:"fondos", trabajo:35, descanso:25, rondas:5 },
    { nombre:"Pistol asistida", img:"sentadillas", trabajo:35, descanso:30, rondas:5 },
    { nombre:"Burpees", img:"burpees", trabajo:30, descanso:30, rondas:5 }
  ],
  militar: [
    { nombre:"Flexiones", img:"flexiones", trabajo:40, descanso:20, rondas:4 },
    { nombre:"Sentadillas", img:"sentadillas", trabajo:40, descanso:20, rondas:4 },
    { nombre:"Plancha", img:"plancha", trabajo:40, descanso:20, rondas:4 },
    { nombre:"Burpees", img:"burpees", trabajo:30, descanso:20, rondas:4 }
  ]
};

const STORAGE_KEY = "calistenia-progress";
let planSemanas = null;
let timeline = [], indice = 0, restante = 0, duracionFase = 1;
let fase = "trabajo", corriendo = false, intervalo = null;
const $ = (id) => document.getElementById(id);

// ---------- Progreso (localStorage) ----------
function progresoVacio(){ return { totalSesiones:0, racha:0, ultimaFecha:null, ultimaRutina:null, porRutina:{} }; }
function cargarProgreso(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || progresoVacio(); } catch(e){ return progresoVacio(); } }
function guardarProgreso(p){ localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }

function renderProgreso(){
  const p = cargarProgreso();
  $("stat-total").textContent = p.totalSesiones || 0;
  $("stat-racha").textContent = p.racha || 0;
  $("stat-ultima").textContent = p.ultimaFecha || "-";
  $("stat-rutina").textContent = p.ultimaRutina || "-";
}

function registrarSesion(rutina){
  const p = cargarProgreso();
  const hoy = new Date().toDateString();
  const ayer = new Date(Date.now() - 86400000).toDateString();
  p.totalSesiones = (p.totalSesiones || 0) + 1;
  p.porRutina[rutina] = (p.porRutina[rutina] || 0) + 1;
  p.ultimaRutina = rutina;
  if (p.ultimaFecha === hoy) { /* ya entreno hoy */ }
  else if (p.ultimaFecha === ayer) { p.racha = (p.racha || 0) + 1; }
  else { p.racha = 1; }
  p.ultimaFecha = hoy;
  guardarProgreso(p);
  renderProgreso();
}

// ---------- Plan 8 semanas ----------
async function cargarPlan(){
  try {
    const res = await fetch("datos/plan-8-semanas.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    planSemanas = await res.json();
    actualizarSemanaUI();
  } catch(e) {
    console.warn("No se pudo cargar plan-8-semanas.json:", e);
    planSemanas = null;
  }
}

function datosSemana(n){
  if (!planSemanas || !planSemanas.semanas) return null;
  return planSemanas.semanas.find(s => s.n === Number(n)) || null;
}

function actualizarSemanaUI(){
  const n = Number($("semana").value);
  const s = datosSemana(n);
  $("semana-num").textContent = n;
  $("semana-foco").textContent = s ? s.foco : "-";
}

// ---------- Timeline ----------
function construir(clave){
  const semana = datosSemana($("semana").value);
  const ejs = rutinasBase[clave];
  const max = Math.max(...ejs.map(e => e.rondas || 1));
  const out = [];
  for (let r = 1; r <= max; r++) {
    ejs.forEach(e => {
      if (r <= (e.rondas || 1)) {
        // Ajustar trabajo/descanso si hay datos de la semana
        let trabajo = e.trabajo;
        let descanso = e.descanso;
        if (semana) {
          trabajo = semana.trabajoSeg || trabajo;
          descanso = semana.descansoSeg || descanso;
        }
        out.push({ ...e, trabajo, descanso, ronda:r, total:e.rondas || 1 });
      }
    });
  }
  return out;
}

// ---------- Control del cronómetro ----------
function iniciar(){
  if (corriendo) return;
  if (!timeline.length) reiniciar(false);
  corriendo = true;
  $("btnIniciar").textContent = "Pausar";
  intervalo = setInterval(tick, 1000);
}

function pausar(){
  corriendo = false;
  clearInterval(intervalo);
  $("btnIniciar").textContent = "Continuar";
}

function reiniciar(render = true){
  clearInterval(intervalo);
  corriendo = false;
  $("btnIniciar").textContent = "Iniciar";
  timeline = construir($("rutina").value);
  indice = 0;
  fase = "trabajo";
  restante = timeline[0]?.trabajo || 0;
  duracionFase = restante || 1;
  if (render) render();
}

function tick(){
  if (!corriendo) return;
  restante--;
  if (restante <= 0) avanzar();
  render();
}

function avanzar(){
  const actual = timeline[indice];
  if (fase === "trabajo" && actual.descanso > 0) {
    fase = "descanso";
    restante = actual.descanso;
    duracionFase = restante || 1;
    beep(660, 0.12);
    return;
  }
  indice++;
  fase = "trabajo";
  if (indice >= timeline.length) { terminar(); return; }
  restante = timeline[indice].trabajo;
  duracionFase = restante || 1;
  beep(880, 0.18);
}

function terminar(){
  clearInterval(intervalo);
  corriendo = false;
  $("btnIniciar").textContent = "Iniciar";
  $("ejercicio").textContent = "Completado";
  $("fase").textContent = "";
  $("fase").classList.remove("descanso");
  $("tiempo").textContent = "00:00";
  $("tiempo").classList.remove("descanso");
  $("detalle").textContent = "Descansa e hidratate.";
  $("lista").innerHTML = "";
  $("barra-progreso").style.width = "100%";
  $("barra-progreso").classList.remove("descanso");
  registrarSesion($("rutina").value);
  beep(440, 0.4);
}

function render(){
  const actual = timeline[indice];
  if (!actual) return;

  $("ejercicio").textContent = actual.nombre;
  const enDescanso = fase === "descanso";

  $("fase").textContent = enDescanso ? "Descanso" : "Trabajo - Ronda " + actual.ronda + "/" + actual.total;
  $("fase").classList.toggle("descanso", enDescanso);
  $("tiempo").classList.toggle("descanso", enDescanso);

  $("tiempo").textContent =
    String(Math.floor(restante / 60)).padStart(2, "0") + ":" +
    String(restante % 60).padStart(2, "0");

  const pct = duracionFase > 0 ? (restante / duracionFase) * 100 : 0;
  $("barra-progreso").style.width = pct + "%";
  $("barra-progreso").classList.toggle("descanso", enDescanso);

  // Imagen local
  const img = actual.img || "flexiones";
  $("img-ejercicio").src = "assets/" + img + ".svg";
  $("img-ejercicio").alt = actual.nombre;

  const sig = timeline[indice + 1];
  $("detalle").textContent = "Siguiente: " + (sig ? sig.nombre : "Fin de la rutina");

  $("lista").innerHTML = timeline.map((e, i) =>
    '<li class="' + (i === indice ? "activo" : "") + '">' +
      (i + 1) + ". " + e.nombre + " (" + e.ronda + "/" + e.total + ") - " + e.trabajo + "s" +
    "</li>"
  ).join("");
}

function beep(frecuencia, duracion){
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
  } catch(e) {}
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", async () => {
  $("rutina").addEventListener("change", () => reiniciar());
  $("semana").addEventListener("change", () => { actualizarSemanaUI(); reiniciar(); });
  $("btnIniciar").addEventListener("click", () => corriendo ? pausar() : iniciar());
  $("btnReiniciar").addEventListener("click", () => reiniciar());
  $("btnReset").addEventListener("click", () => {
    if (confirm("Borrar todo el progreso guardado?")) {
      localStorage.removeItem(STORAGE_KEY);
      renderProgreso();
    }
  });
  renderProgreso();
  await cargarPlan();
  reiniciar();
});
