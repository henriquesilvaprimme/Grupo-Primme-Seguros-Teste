import React, { useState, useEffect } from 'react';

// Certifique-se de que esta URL é a da SUA ÚLTIMA IMPLANTAÇÃO do Apps Script.
// Ela deve ser a mesma URL base usada para as requisições POST/GET.
const GOOGLE_SHEETS_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec'; // <-- ATUALIZE ESTA LINHA COM A URL REAL DA SUA IMPLANTAÇÃO

const GerenciarUsuarios = ({ leads, fetchLeadsFromSheet, fetchLeadsFechadosFromSheet }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para buscar usuários do Google Sheets
  const fetchUsuariosFromSheet = async () => {
    setLoading(true);
    setError(null);
    try {
      // Usa o parâmetro 'v=pegar_usuario' para a função doGet no Apps Script
      const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}?v=pegar_usuario`);
      
      // Verifica se a resposta da rede foi OK
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        const formattedUsuarios = data.map((item) => ({
          id: item.id || '',
          usuario: item.usuario || '',
          nome: item.nome || '',
          email: item.email || '',
          senha: item.senha || '', // Cuidado ao exibir senhas. Idealmente, não traga a senha para o frontend.
          status: item.status || 'Ativo',
          tipo: item.tipo || 'Usuario',
        }));
        setUsuarios(formattedUsuarios);
      } else {
        console.warn('Dados recebidos não são um array:', data);
        setUsuarios([]);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários do Google Sheets:', err);
      setError('Erro ao carregar usuários. Tente novamente mais tarde.');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  // useEffect para buscar usuários e configurar o intervalo de atualização
  useEffect(() => {
    fetchUsuariosFromSheet(); // Busca inicial ao montar o componente

    // Configura o intervalo para buscar atualizações a cada 60 segundos
    const interval = setInterval(() => {
      console.log('Atualizando lista de usuários...');
      fetchUsuariosFromSheet();
    }, 60000); 

    // Limpa o intervalo quando o componente é desmontado para evitar vazamentos de memória
    return () => clearInterval(interval);
  }, []); // Dependência vazia para rodar apenas uma vez na montagem

  // Função para atualizar status ou tipo de usuário no Google Sheets
  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    const usuarioParaAtualizar = usuarios.find((u) => String(u.id) === String(id)); // Comparar como string
    if (!usuarioParaAtualizar) {
      console.warn(`Usuário com ID ${id} não encontrado localmente para atualização.`);
      return;
    }

    // Criar uma cópia profunda para enviar, evitando mutar o estado diretamente
    const usuarioParaEnviar = { ...usuarioParaAtualizar };

    if (novoStatus !== null) usuarioParaEnviar.status = novoStatus;
    if (novoTipo !== null) usuarioParaEnviar.tipo = novoTipo;

    try {
      console.log('Enviando solicitação de atualização para Apps Script:', usuarioParaEnviar);
      
      // Usa o parâmetro 'v=alterar_usuario' para a função doPost no Apps Script
      const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}?v=alterar_usuario`, {
        method: 'POST',
        mode: 'no-cors', // Permite requisições entre diferentes origens sem exigir cabeçalhos CORS complexos
        body: JSON.stringify({ usuario: usuarioParaEnviar }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // No modo 'no-cors', 'response.ok' sempre será true e não teremos acesso ao corpo da resposta.
      // A confirmação de sucesso deve vir dos logs do Apps Script.
      console.log('Solicitação de atualização para o usuário enviada ao Apps Script (modo no-cors).');
      console.log('Por favor, verifique os logs de execução do Google Apps Script para confirmação de sucesso e possíveis erros.');

      // Otimisticamente, atualiza o estado local para que a UI responda imediatamente
      setUsuarios((prev) =>
        prev.map((u) =>
          String(u.id) === String(id) // Comparar como string
            ? {
                ...u,
                ...(novoStatus !== null ? { status: novoStatus } : {}),
                ...(novoTipo !== null ? { tipo: novoTipo } : {}),
              }
            : u
        )
      );

    } catch (err) {
      console.error('Erro ao enviar atualização de usuário para o Apps Script:', err);
      alert('Erro ao atualizar usuário. Por favor, tente novamente.');
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Carregando usuários...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Gerenciar Usuários</h2>
      
      {usuarios.length > 0 ? (
        <div className="overflow-x-auto rounded-lg shadow-md">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Nome</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Usuário</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Tipo</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-800">{usuario.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{usuario.nome}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{usuario.usuario}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{usuario.email}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      usuario.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {usuario.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      usuario.tipo === 'Admin' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {usuario.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <button
                      onClick={() => atualizarStatusUsuario(usuario.id, usuario.status === 'Ativo' ? 'Inativo' : 'Ativo', null)}
                      className={`px-4 py-2 rounded-md text-white transition-colors duration-200 ${
                        usuario.status === 'Ativo' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                      } mr-2`}
                    >
                      {usuario.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                    </button>
                    <select
                      value={usuario.tipo}
                      onChange={(e) => atualizarStatusUsuario(usuario.id, null, e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    >
                      <option value="Usuario">Usuário</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-600">Nenhum usuário encontrado.</p>
      )}
    </div>
  );
};

export default GerenciarUsuarios;
