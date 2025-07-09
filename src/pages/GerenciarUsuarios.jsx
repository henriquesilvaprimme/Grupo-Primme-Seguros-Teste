import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, RefreshCcw } from 'lucide-react'; // Adicionado RefreshCcw para o ícone de refresh

// Certifique-se de que esta URL é a da SUA ÚLTIMA IMPLANTAÇÃO do Apps Script.
// Ela deve ser a mesma URL base usada para as requisições POST/GET.
const GOOGLE_SHEETS_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec'; // <-- ATUALIZE ESTA LINHA COM A URL REAL DA SUA IMPLANTAÇÃO

const GerenciarUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true); // Usado para o loader inicial e geral
  const [error, setError] = useState(null);
  const [senhaVisivel, setSenhaVisivel] = useState({}); // Estado para controlar a visibilidade da senha
  const [isRefreshing, setIsRefreshing] = useState(false); // Novo estado para o loader de refresh

  // Função para buscar usuários do Google Sheets
  const fetchUsuariosFromSheet = async () => {
    // Não altere 'loading' para true aqui para evitar o loader de tela cheia no refresh.
    // Usaremos 'isRefreshing' para o loader específico do botão.
    setError(null);
    try {
      const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}?v=pegar_usuario`);
      
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
      // Somente desativa o loading inicial se ainda estiver ativo
      setLoading(false); 
      setIsRefreshing(false); // Desativa o loader de refresh em qualquer caso
    }
  };

  // Função para lidar com o refresh e ativar/desativar o loader
  const handleRefresh = async () => {
    setIsRefreshing(true); // Ativa o loader do botão de refresh
    await fetchUsuariosFromSheet();
  };

  // useEffect para buscar usuários na montagem e configurar o intervalo de atualização
  useEffect(() => {
    // Ativa o loader inicial apenas na primeira montagem
    setLoading(true); 
    fetchUsuariosFromSheet(); 

    const interval = setInterval(() => {
      console.log('Atualizando lista de usuários automaticamente...');
      fetchUsuariosFromSheet();
    }, 60000); // Atualiza a cada 60 segundos

    return () => clearInterval(interval);
  }, []); 

  // Função para atualizar status ou tipo de usuário no Google Sheets
  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    const usuarioParaAtualizar = usuarios.find((u) => String(u.id) === String(id));
    if (!usuarioParaAtualizar) {
      console.warn(`Usuário com ID ${id} não encontrado localmente para atualização.`);
      return;
    }

    const usuarioParaEnviar = { ...usuarioParaAtualizar };

    if (novoStatus !== null) usuarioParaEnviar.status = novoStatus;
    if (novoTipo !== null) usuarioParaEnviar.tipo = novoTipo;

    try {
      console.log('Enviando solicitação de atualização para Apps Script:', usuarioParaEnviar);
      
      await fetch(`${GOOGLE_SHEETS_BASE_URL}?v=alterar_usuario`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ usuario: usuarioParaEnviar }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Solicitação de atualização para o usuário enviada ao Apps Script (modo no-cors).');
      console.log('Por favor, verifique os logs de execução do Google Apps Script para confirmação de sucesso e possíveis erros.');

      // Otimisticamente, atualiza o estado local para que a UI responda imediatamente
      setUsuarios((prev) =>
        prev.map((u) =>
          String(u.id) === String(id)
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

  const handleToggleStatus = (id, statusAtual) => {
    const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
    atualizarStatusUsuario(id, novoStatus);
  };

  const handleToggleTipo = (id, tipoAtual) => {
    const novoTipo = tipoAtual === 'Admin' ? 'Usuario' : 'Admin'; // Alterna entre 'Admin' e 'Usuario'
    atualizarStatusUsuario(id, null, novoTipo);
  };

  const toggleVisibilidadeSenha = (id) => {
    setSenhaVisivel((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        {/* Loader de tela cheia */}
        <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-4 text-lg text-gray-700">Carregando usuários...</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-center text-red-600 font-medium text-lg">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-3xl font-bold text-indigo-700">Gerenciar Usuários</h2>
        <button
          title="Clique para atualizar os dados"
          onClick={handleRefresh}
          className="p-2 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all duration-200 ease-in-out flex items-center justify-center shadow-sm"
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <RefreshCcw size={20} />
          )}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow-md">
          <thead className="bg-indigo-100">
            <tr>
              <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">ID</th>
              <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Nome</th>
              <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Usuário</th> {/* Adicionado coluna de usuário */}
              <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">E-mail</th>
              <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Senha</th>
              <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Tipo</th>
              <th className="py-3 px-6 text-left text-sm font-semibold text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length > 0 ? (
              usuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150">
                  <td className="py-3 px-6 text-sm text-gray-800">{usuario.id}</td>
                  <td className="py-3 px-6 text-sm text-gray-800">{usuario.nome}</td>
                  <td className="py-3 px-6 text-sm text-gray-800">{usuario.usuario}</td> {/* Exibindo usuário */}
                  <td className="py-3 px-6 text-sm text-gray-800">{usuario.email}</td>
                  <td className="py-3 px-6 text-sm">
                    <div className="flex items-center gap-2">
                      <input
                        type={senhaVisivel[usuario.id] ? 'text' : 'password'}
                        value={usuario.senha}
                        readOnly
                        className="border border-gray-300 rounded px-2 py-1 w-32 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                      <button
                        onClick={() => toggleVisibilidadeSenha(usuario.id)}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                      >
                        {senhaVisivel[usuario.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                        usuario.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {usuario.status}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                        usuario.tipo === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {usuario.tipo === 'Admin' ? 'Admin' : 'Usuário Comum'}
                    </span>
                  </td>
                  <td className="py-3 px-6 flex gap-4 items-center">
                    <button
                      onClick={() => handleToggleStatus(usuario.id, usuario.status)}
                      className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-all duration-200 ease-in-out
                        ${usuario.status === 'Ativo'
                          ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
                          : 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    >
                      {usuario.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                    </button>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={usuario.tipo === 'Admin'}
                        onChange={() => handleToggleTipo(usuario.id, usuario.tipo)}
                        className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out transform scale-105" // Maior e com transição
                      />
                      Admin
                    </label>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="py-6 text-center text-gray-600 text-lg">Nenhum usuário encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GerenciarUsuarios;
