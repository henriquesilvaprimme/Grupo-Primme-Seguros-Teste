import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react'; // Importe os ícones do lucide-react

const GerenciarUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mensagemFeedback, setMensagemFeedback] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState({}); // Estado para controlar a visibilidade da senha

  // MUITO IMPORTANTE: SUBSTITUA ESTE URL PELA URL REAL E ATUALIZADA DA SUA IMPLANTAÇÃO DO GOOGLE APPS SCRIPT
  // CADA NOVA IMPLANTAÇÃO PODE GERAR UMA NOVA URL.
  const GOOGLE_SHEETS_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec'; // Sua URL de implantação

  // Função para buscar todos os usuários
  const buscarUsuarios = async () => {
    setIsLoading(true);
    setMensagemFeedback('');
    try {
      const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}?v=pegar_usuario`, {
        method: 'GET',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (Array.isArray(data)) {
        setUsuarios(data);
      } else {
        setUsuarios([]);
        console.warn('Resposta inesperada ao buscar usuários:', data);
        setMensagemFeedback('⚠️ Resposta inesperada ao carregar usuários. Verifique o console.');
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      setMensagemFeedback('❌ Erro ao carregar usuários. Verifique sua conexão ou o Apps Script.');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar usuários ao montar o componente
  useEffect(() => {
    buscarUsuarios();
    // Você pode adicionar um polling aqui se quiser atualizações automáticas, mas cuidado com limites do Apps Script
    // const interval = setInterval(buscarUsuarios, 60000); // Exemplo: a cada 1 minuto
    // return () => clearInterval(interval);
  }, []);

  // Função para atualizar o status ou tipo de um usuário (enviando para o GAS)
  const handleAtualizarUsuario = async (usuarioId, novoStatus, novoTipo) => {
    setMensagemFeedback('');
    setIsLoading(true);

    const usuarioParaAtualizar = usuarios.find(u => u.id === usuarioId);
    if (!usuarioParaAtualizar) {
      setMensagemFeedback('Usuário não encontrado para atualização.');
      setIsLoading(false);
      return;
    }

    // Cria um objeto com os dados mais recentes do usuário, aplicando as mudanças
    const dadosParaEnviar = {
      action: 'alterar_usuario',
      usuario: {
        ...usuarioParaAtualizar, // Mantém todos os dados existentes
        id: usuarioId, // Garante que o ID esteja correto
        status: novoStatus !== null ? novoStatus : usuarioParaAtualizar.status, // Atualiza status se fornecido
        tipo: novoTipo !== null ? novoTipo : usuarioParaAtualizar.tipo, // Atualiza tipo se fornecido
      },
    };

    try {
      await fetch(GOOGLE_SHEETS_BASE_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(dadosParaEnviar),
      });

      console.log('Requisição de atualização de usuário enviada (modo no-cors).');
      console.log('Para confirmar o sucesso da operação, verifique os logs de execução do Google Apps Script ou o Google Sheet diretamente.');

      // Atualiza o estado local imediatamente para uma melhor experiência do usuário
      setUsuarios(prevUsuarios =>
        prevUsuarios.map(u =>
          u.id === usuarioId
            ? {
                ...u,
                status: novoStatus !== null ? novoStatus : u.status,
                tipo: novoTipo !== null ? novoTipo : u.tipo,
              }
            : u
        )
      );

      setMensagemFeedback('✅ Solicitação de atualização enviada. As alterações devem aparecer em breve.');

    } catch (error) {
      console.error('Erro ao enviar requisição de atualização:', error);
      setMensagemFeedback('❌ Erro ao enviar solicitação de atualização. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  // Funções de toggle para o layout antigo
  const handleToggleStatus = (id, statusAtual) => {
    const novoStatus = statusAtual === 'Ativo' ? 'Inativo' : 'Ativo';
    const usuarioAtual = usuarios.find(u => u.id === id);
    if (usuarioAtual) {
      handleAtualizarUsuario(id, novoStatus, usuarioAtual.tipo);
    }
  };

  const handleToggleTipo = (id, tipoAtual) => {
    const novoTipo = tipoAtual === 'Admin' ? 'Usuario' : 'Admin'; // 'Usuario' é o valor interno, 'Usuário Comum' é para exibição
    const usuarioAtual = usuarios.find(u => u.id === id);
    if (usuarioAtual) {
      handleAtualizarUsuario(id, usuarioAtual.status, novoTipo);
    }
  };

  const toggleVisibilidadeSenha = (id) => {
    setSenhaVisivel((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold mb-6 text-indigo-700">Gerenciar Usuários</h2>

      {mensagemFeedback && (
        <p className={`mt-4 font-semibold text-center ${mensagemFeedback.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
          {mensagemFeedback}
        </p>
      )}

      {isLoading ? (
        <p className="text-center text-indigo-500">Carregando usuários...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead className="bg-indigo-100">
              <tr>
                <th className="py-3 px-6 text-left">Nome</th>
                <th className="py-3 px-6 text-left">E-mail</th>
                <th className="py-3 px-6 text-left">Senha</th>
                <th className="py-3 px-6 text-left">Status</th>
                <th className="py-3 px-6 text-left">Tipo</th>
                <th className="py-3 px-6 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length > 0 ? (
                usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-3 px-6">{usuario.nome}</td>
                    <td className="py-3 px-6">{usuario.email}</td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <input
                          type={senhaVisivel[usuario.id] ? 'text' : 'password'}
                          value={usuario.senha || ''} // Garante que não seja undefined
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
                          usuario.tipo === 'Admin' ? 'bg-blue-100 text-blue-700' : ''
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
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={usuario.tipo === 'Admin'}
                          onChange={() => handleToggleTipo(usuario.id, usuario.tipo)}
                          className="form-checkbox h-4 w-4 text-blue-600"
                        />
                        Admin
                      </label>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-3 px-6 text-center text-gray-500">Nenhum usuário encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GerenciarUsuarios;
