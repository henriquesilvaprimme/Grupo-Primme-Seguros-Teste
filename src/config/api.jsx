// Base URL para o seu Google Apps Script Web App
const BASE_GAS_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';

// Objeto contendo todas as URLs específicas do seu Google Apps Script
export const API_ENDPOINTS = {
  // Endpoints para GET (para buscar dados)
  GET_LEADS: `${BASE_GAS_URL}?v=getLeads`,
  GET_LEADS_FECHADOS: `${BASE_GAS_URL}?v=pegar_clientes_fechados`,
  GET_USUARIOS: `${BASE_GAS_URL}?v=pegar_usuario`,
  GET_LISTA_NOMES_USUARIOS: `${BASE_GAS_URL}?v=listar_nomes_usuarios`, // Se você tiver esta função no GAS

  // Endpoints para POST (para enviar dados/ações)
  POST_ALTERAR_STATUS: `${BASE_GAS_URL}?v=alterar_status`,
  POST_ALTERAR_ATRIBUIDO: `${BASE_GAS_URL}?v=alterar_atribuido`,
  POST_ALTERAR_SEGURADORA: `${BASE_GAS_URL}?v=alterar_seguradora`,
  POST_CRIAR_USUARIO: `${BASE_GAS_URL}?v=criar_usuario`,
  POST_ALTERAR_USUARIO: `${BASE_GAS_URL}?v=alterar_usuario`,
  POST_CRIAR_LEAD: `${BASE_GAS_URL}?v=criar_lead`, // Adicionado com base no seu `doPost`
};

// Se você precisar da base URL em algum lugar, pode exportá-la também
export const BASE_URL = BASE_GAS_URL;
