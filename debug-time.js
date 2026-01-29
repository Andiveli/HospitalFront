// Test script para debug de tiempo
console.log('Testing appointment time logic...');

// Mock function temporarily for debugging
function isAppointmentTimeReady(appointmentDateTime) {
  const now = new Date();
  const appointmentTime = new Date(appointmentDateTime);
  const fiveMinutesBefore = new Date(appointmentTime.getTime() - 5 * 60 * 1000);
  return now >= fiveMinutesBefore && now < appointmentTime;
}

function getTimeUntilReady(appointmentDateTime) {
  const now = new Date();
  const appointmentTime = new Date(appointmentDateTime);
  const readyTime = new Date(appointmentTime.getTime() - 5 * 60 * 1000);
  const diffMs = readyTime.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Disponible';
  const diffMins = Math.floor(diffMs / (1000 * 60));
  return `En ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
}

console.log('=== Testing Appointment Time Logic ===\n');

// Test 1: Cita en 3 minutos (debería estar ready)
const cita3Minutos = new Date(Date.now() + 3 * 60 * 1000).toISOString();
console.log('Cita en 3 minutos:', cita3Minutos);
console.log('¿Lista para sala?', isAppointmentTimeReady(cita3Minutos));
console.log('Tiempo restante:', getTimeUntilReady(cita3Minutos));

// Test 2: Cita en 10 minutos (no debería estar ready)
const cita10Minutos = new Date(Date.now() + 10 * 60 * 1000).toISOString();
console.log('\nCita en 10 minutos:', cita10Minutos);
console.log('¿Lista para sala?', isAppointmentTimeReady(cita10Minutos));
console.log('Tiempo restante:', getTimeUntilReady(cita10Minutos));

// Test 3: Cita en 5 minutos exactos (debería estar ready)
const cita5Minutos = new Date(Date.now() + 5 * 60 * 1000).toISOString();
console.log('\nCita en 5 minutos exactos:', cita5Minutos);
console.log('¿Lista para sala?', isAppointmentTimeReady(cita5Minutos));
console.log('Tiempo restante:', getTimeUntilReady(cita5Minutos));

// Test 4: Cita en -5 minutos (pasada)
const citaPasada = new Date(Date.now() - 5 * 60 * 1000).toISOString();
console.log('\nCita ya pasada (-5 min):', citaPasada);
console.log('¿Lista para sala?', isAppointmentTimeReady(citaPasada));
console.log('Tiempo restante:', getTimeUntilReady(citaPasada));