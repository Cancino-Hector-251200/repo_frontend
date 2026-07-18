// URLs de los dos microservicios independientes.
// El frontend nunca llama directamente a OpenWeatherMap: siempre pasa
// por su propio gateway, que es quien protege la API key.
const URL_GATEWAY_CLIMA = 'http://localhost:4000';
const URL_SERVICIO_HISTORIAL = 'http://localhost:5000';

const formulario = document.getElementById('formBusqueda');
const inputCiudad = document.getElementById('inputCiudad');
const estadoResultado = document.getElementById('estadoResultado');
const listaHistorial = document.getElementById('listaHistorial');
const btnRefrescarHistorial = document.getElementById('btnRefrescarHistorial');

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const ciudad = inputCiudad.value.trim();
  if (!ciudad) return;

  await buscarClima(ciudad);
});

btnRefrescarHistorial.addEventListener('click', cargarHistorial);

async function buscarClima(ciudad) {
  // 1. Estado LOADING
  mostrarCargando();

  try {
    const respuesta = await fetch(`${URL_GATEWAY_CLIMA}/api/weather?city=${encodeURIComponent(ciudad)}`);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      // 2. Estado ERROR (la API respondió pero con un problema, ej. ciudad inválida)
      mostrarError(datos.error || 'No se pudo obtener el clima.');
      return;
    }

    // 3. Estado SUCCESS
    mostrarResultado(datos);

    // Funcionalidad extra: registrar la búsqueda en el servicio de historial,
    // que es un servicio totalmente independiente del gateway de clima.
    await guardarEnHistorial(ciudad);
    await cargarHistorial();

  } catch (error) {
    // La aplicación no se rompe: mostramos un mensaje amigable si el
    // servidor no responde (caído, sin red, CORS bloqueado, etc.)
    console.error('Error de red:', error);
    mostrarError('No se pudo conectar con el servidor. Intenta de nuevo más tarde.');
  }
}

function mostrarCargando() {
  estadoResultado.innerHTML = `<p class="mensaje-cargando">Cargando clima...</p>`;
}

function mostrarError(mensaje) {
  estadoResultado.innerHTML = `<div class="mensaje-error">${escaparHTML(mensaje)}</div>`;
}

function mostrarResultado(datos) {
  estadoResultado.innerHTML = `
    <div class="tarjeta-clima">
      <h3>${escaparHTML(datos.ciudad)}, ${escaparHTML(datos.pais || '')}</h3>
      <p><strong>${datos.temperatura}°C</strong> — sensación térmica ${datos.sensacionTermica}°C</p>
      <p>${escaparHTML(datos.descripcion)}</p>
      <p>Humedad: ${datos.humedad}% · Viento: ${datos.viento} m/s</p>
    </div>
  `;
}

async function guardarEnHistorial(ciudad) {
  try {
    await fetch(`${URL_SERVICIO_HISTORIAL}/api/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ciudad })
    });
  } catch (error) {
    // Si el servicio de historial falla, no debe romper la búsqueda de clima:
    // son servicios desacoplados, uno puede fallar sin afectar al otro.
    console.error('No se pudo guardar en el historial:', error);
  }
}

async function cargarHistorial() {
  try {
    const respuesta = await fetch(`${URL_SERVICIO_HISTORIAL}/api/history`);
    if (!respuesta.ok) throw new Error('Respuesta no válida del servicio de historial');

    const registros = await respuesta.json();
    renderizarHistorial(registros);
  } catch (error) {
    console.error('Error al cargar historial:', error);
    listaHistorial.innerHTML = `<li>No se pudo cargar el historial.</li>`;
  }
}

function renderizarHistorial(registros) {
  if (registros.length === 0) {
    listaHistorial.innerHTML = `<li>Aún no hay búsquedas registradas.</li>`;
    return;
  }

  listaHistorial.innerHTML = registros.map(registro => `
    <li>
      <span>${escaparHTML(registro.ciudad)} — ${new Date(registro.fecha).toLocaleString('es-MX')}</span>
      <button onclick="eliminarRegistro(${registro.id})" style="cursor:pointer;border:none;background:none;color:#a32d2d;">✕</button>
    </li>
  `).join('');
}

async function eliminarRegistro(id) {
  try {
    await fetch(`${URL_SERVICIO_HISTORIAL}/api/history/${id}`, { method: 'DELETE' });
    await cargarHistorial();
  } catch (error) {
    console.error('No se pudo eliminar el registro:', error);
  }
}

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

// Cargar historial al iniciar la página
cargarHistorial();
