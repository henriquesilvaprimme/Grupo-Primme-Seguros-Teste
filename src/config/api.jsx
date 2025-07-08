// Base URL para o seu Google Apps Script Web App
const BASE_GAS_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';

// Objeto contendo todas as URLs específicas do seu Google Apps Script
export const API_ENDPOINTS = {
  BASE_GAS_URL: 'SUA_NOVA_URL_GAS_AQUI', // Atualize esta linha
  GET_LEADS: 'SUA_NOVA_URL_GAS_AQUI?v=getLeads',
  GET_LEADS_FECHADOS: 'SUA_NOVA_URL_GAS_AQUI?v=pegar_clientes_fechados',
  GET_USUARIOS: 'SUA_NOVA_URL_GAS_AQUI?v=pegar_usuario',
  POST_ALTERAR_STATUS: 'SUA_NOVA_URL_GAS_AQUI?v=alterar_status',
  POST_ALTERAR_ATRIBUIDO: 'SUA_NOVA_URL_GAS_AQUI?v=alterar_atribuido',
  POST_ALTERAR_SEGURADORA: 'SUA_NOVA_URL_GAS_AQUI?v=alterar_seguradora',
  POST_CRIAR_USUARIO: 'SUA_NOVA_URL_GAS_AQUI?v=criar_usuario',
  POST_ALTERAR_USUARIO: 'SUA_NOVA_URL_GAS_AQUI?v=alterar_usuario',
  LISTAR_NOMES_USUARIOS: 'SUA_NOVA_URL_GAS_AQUI?v=listar_nomes_usuarios',
  POST_CRIAR_LEAD: 'SUA_NOVA_URL_GAS_AQUI?v=criar_lead', // Adicione esta linha
};

// Se você precisar da base URL em algum lugar, pode exportá-la também
export const BASE_URL = BASE_GAS_URL;
