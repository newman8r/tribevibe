export const environment = {
  production: false,
  apiBaseUrl: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/'
    : `http://${window.location.hostname}:3000/`
}; 