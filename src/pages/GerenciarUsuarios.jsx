import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react'; // Certifique-se de que lucide-react está instalado: npm install lucide-react

// Certifique-se de que esta URL é a da SUA ÚLTIMA IMPLANTAÇÃO do Apps Script.
// Ela deve ser a mesma URL base usada para as requisições POST/GET.
const GOOGLE_SHEETS_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec'; // <-- ATUALIZE ESTA LINHA COM A URL REAL DA SUA IMPLANTAÇÃO

const GerenciarUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [senhaVisivel, setSenhaVisivel] = useState({}); // Estado para controlar a visibilidade da senha

  // Função para buscar usuários do Google Sheets
  const fetchUsuariosFromSheet = async () => {
    setLoading(true);
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
          senha: item.senha || '', // Cuidado ao exibir senhas. Idealmente, não traga a senha para o frontend.
          status: item.status || 'Ativo',
          tipo: item.tipo || 'Usuario', // Garante que 'tipo' não seja undefined
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
    fetchUsuariosFromSheet(); 

    const interval = setInterval(() => {
      console.log('Atualizando lista de usuários...');
      fetchUsuariosFromSheet();
    }, 60000); 

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
      
      const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}?v=alterar_usuario`, {
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

  // Funções de toggle para botões e checkbox, agora dentro de GerenciarUsuarios
  const handleToggleStatus = (id, statusAtual) => {
    const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
    atualizarStatusUsuario(id, novoStatus);
  };

  const handleToggleTipo = (id, tipoAtual) => {
    const novoTipo = tipoAtual === 'Admin' ? 'Usuario' : 'Admin'; // Corrigido para 'Usuario'
    atualizarStatusUsuario(id, null, novoTipo);
  };

  const toggleVisibilidadeSenha = (id) => {
    setSenhaVisivel((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500 text-lg">Carregando usuários...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600 font-medium text-lg">{error}</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6 text-indigo-700">Gerenciar Usuários</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow-md">
          <thead className="bg-indigo-100">
            <tr>
              <th className="py-3 px-6 text-left">ID</th> {/* Adicionado ID na coluna */}
              <th className="py-3 px-6 text-left">Nome</th>
              <th className="py-3 px-6 text-left">E-mail</th>
              <th className="py-3 px-6 text-left">Senha</th>
              <th className="py-3 px-6 text-left">Status</th>
              <th className="py-3 px-6 text-left">Tipo</th>
              <th className="py-3 px-6 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="border-b hover:bg-gray-50 transition">
                <td className="py-3 px-6">{usuario.id}</td> {/* Exibindo ID */}
                <td className="py-3 px-6">{usuario.nome}</td>
                <td className="py-3 px-6">{usuario.email}</td>
                <td className="py-3 px-6">
                  <div className="flex items-center gap-2">
                    <input
                      type={senhaVisivel[usuario.id] ? 'text' : 'password'}
                      value={usuario.senha}
                      readOnly
                      className="border rounded px-2 py-1 w-32 text-sm"
                    />
                    <button
                      onClick={() => toggleVisibilidadeSenha(usuario.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {senhaVisivel[usuario.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </td>
                <td className="py-3 px-6">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      usuario.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {usuario.status}
                  </span>
                </td>
                <td className="py-3 px-6">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      usuario.tipo === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700' // Adicionado estilo para Usuário Comum
                    }`}
                  >
                    {usuario.tipo === 'Admin' ? 'Admin' : 'Usuário Comum'}
                  </span>
                </td>
                <td className="py-3 px-6 flex gap-4 items-center">
                  <button
                    onClick={() => handleToggleStatus(usuario.id, usuario.status)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      usuario.status === 'Ativo'
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    } transition`}
                  >
                    {usuario.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                  </button>
                  <label className="flex items-center gap-1 text-sm cursor-pointer"> {/* Adicionado cursor-pointer */}
                    <input
                      type="checkbox"
                      checked={usuario.tipo === 'Admin'}
                      onChange={() => handleToggleTipo(usuario.id, usuario.tipo)}
                      className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500 transition duration-150 ease-in-out" // Classes Tailwind CSS para checkbox
                    />
                    Admin
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GerenciarUsuarios;
