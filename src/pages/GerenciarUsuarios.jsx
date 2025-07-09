import React, { useState, useEffect } from 'react';

// Certifique-se de que esta URL é a da SUA ÚLTIMA IMPLANTAÇÃO do Apps Script.
// Ela deve ser a mesma URL base usada para as requisições POST/GET.
const GOOGLE_SHEETS_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec'; // <-- ATUALIZE ESTA LINHA COM A URL REAL DA SUA IMPLANTAÇÃO

const GerenciarUsuarios = () => { // Removidas as props não utilizadas aqui
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
          // Cuidado ao exibir senhas. Idealmente, não traga a senha para o frontend.
          // Deixei aqui porque estava no seu código anterior, mas é uma prática a ser revisada.
          senha: item.senha || '', 
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
    return <div className="p-4 text-center text-gray-500">Carregando usuários...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600 font-medium">{error}</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-extrabold text-gray-900 mb-6 border-b-2 pb-2">Gerenciar Usuários</h2>
      
      {usuarios.length > 0 ? (
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{usuario.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{usuario.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{usuario.usuario}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{usuario.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      usuario.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {usuario.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      usuario.tipo === 'Admin' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {usuario.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => atualizarStatusUsuario(usuario.id, usuario.status === 'Ativo' ? 'Inativo' : 'Ativo', null)}
                        className={`px-4 py-2 rounded-md text-white font-semibold shadow-sm transition-all duration-200 ease-in-out
                          ${usuario.status === 'Ativo' ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500' : 'bg-green-500 hover:bg-green-600 focus:ring-green-500'}
                          focus:outline-none focus:ring-2 focus:ring-offset-2`}
                      >
                        {usuario.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                      </button>
                      <select
                        value={usuario.tipo}
                        onChange={(e) => atualizarStatusUsuario(usuario.id, null, e.target.value)}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                      >
                        <option value="Usuario">Usuário</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-gray-600 text-lg mt-8">Nenhum usuário encontrado.</p>
      )}
    </div>
  );
};

export default GerenciarUsuarios;
