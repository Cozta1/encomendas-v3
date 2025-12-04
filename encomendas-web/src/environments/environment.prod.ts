export const environment = {
  production: true,
  // Remova o 'https://' se sua lógica de serviço concatenar,
  // MAS seu AuthService usa `${environment.apiUrl}/auth`, então coloque a URL base SEM a barra no final.
  apiUrl: 'https://encomendas-api-969073157004.us-central1.run.app '
};
