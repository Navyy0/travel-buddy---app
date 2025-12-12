// Ola Maps API removed: map features are disabled in the app.
// Export no-op stubs so any lingering imports won't break the runtime.
export async function autocomplete() {
  return { results: [] }
}

export async function geocode() {
  return null
}

export async function reverseGeocode() {
  return null
}

export async function getRoute() {
  return null
}

export function getStaticMapUrl() {
  return ''
}

