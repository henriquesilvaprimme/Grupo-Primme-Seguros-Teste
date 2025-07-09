import React, { useState, useEffect } from 'react';

const GerenciarUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mensagemFeedback, setMensagemFeedback] = useState('');

  // MUITO IMPORTANTE: SUBSTITUA ESTE URL PELA URL REAL E ATUALIZADA DA SUA IMPLANTAÇÃO DO GOOGLE APPS SCRIPT
  // CADA NOVA IMPLANTAÇÃO PODE GERAR UMA NOVA URL.
  const GOOGLE_SHEETS_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec'; // Sua URL de implantação

  // Função para buscar todos os usuários
  const buscarUsuarios = async () => {
    setIsLoading(true);
    setMensagemFeedback('');
    try {
      // Requisição GET para pegar usuários (pode ser mode: 'cors' ou 'no-cors' aqui)
      // Mantendo 'cors' para a requisição GET para permitir a leitura dos dados
      const response = await fetch(`${GOOGLE_SHEETS_BASE_URL}?v=pegar_usuario`, {
        method: 'GET', // Explicitamente GET
        mode: 'cors' // Mantido 'cors' para a leitura inicial dos dados.
                     // Se preferir 'no-cors' aqui, não será possível verificar response.ok nem response.json()
      });

      if (!response.ok) { // Este check só funciona com mode: 'cors'
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json(); // Leitura da resposta só funciona com mode: 'cors'

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
  }, []);

  // Função para atualizar o status ou tipo de um usuário
  const handleAtualizarUsuario = async (usuarioId, novoStatus, novoTipo) => {
    setMensagemFeedback('');
    setIsLoading(true);

    const dadosParaEnviar = {
      action: 'alterar_usuario', // Adicionamos uma ação para o GAS identificar
      usuario: {
        id: usuarioId,
        status: novoStatus,
        tipo: novoTipo,
      },
    };

    try {
      // Requisição POST com mode: 'no-cors' conforme sua preferência
      const response = await fetch(GOOGLE_SHEETS_BASE_URL, { // Não precisa mais do ?v=
        method: 'POST',
        mode: 'no-cors', // MANTIDO 'no-cors' conforme instrução
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Importante para o GAS no modo no-cors com JSON stringificado
        },
        body: JSON.stringify(dadosParaEnviar),
      });

      // No modo no-cors, não podemos ler a resposta (response.ok, response.json()).
      // A única forma de ter certeza do sucesso é verificar os logs do Apps Script
      // ou re-buscar os dados do Sheets.
      console.log('Requisição de atualização de usuário enviada (modo no-cors).');
      console.log('Para confirmar o sucesso da operação, verifique os logs de execução do Google Apps Script ou o Google Sheet diretamente.');

      // Re-buscamos os usuários para refletir as mudanças do Sheets
      await buscarUsuarios();
      setMensagemFeedback('✅ Solicitação de atualização enviada. Verifique o Google Sheet e os logs do Apps Script para confirmação.');

    } catch (error) {
      console.error('Erro ao enviar requisição de atualização:', error);
      setMensagemFeedback('❌ Erro ao enviar solicitação de atualização. Verifique sua conexão.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-blue-700 mb-4 text-center">Gerenciar Usuários</h2>

      {isLoading ? (
        <p className="text-center text-blue-500">Carregando usuários...</p>
      ) : (
        <>
          {mensagemFeedback && (
            <p className={`mt-4 font-semibold text-center ${mensagemFeedback.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
              {mensagemFeedback}
            </p>
          )}

          {usuarios.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead>
                  <tr className="bg-blue-50 text-left text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">ID</th>
                    <th className="py-3 px-6 text-left">Usuário</th>
                    <th className="py-3 px-6 text-left">Nome</th>
                    <th className="py-3 px-6 text-left">Email</th>
                    <th className="py-3 px-6 text-left">Status</th>
                    <th className="py-3 px-6 text-left">Tipo</th>
                    <th className="py-3 px-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 text-sm font-light">
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-b border-gray-200 hover:bg-gray-100">
                      <td className="py-3 px-6 text-left whitespace-nowrap">{usuario.id}</td>
                      <td className="py-3 px-6 text-left">{usuario.usuario}</td>
                      <td className="py-3 px-6 text-left">{usuario.nome}</td>
                      <td className="py-3 px-6 text-left">{usuario.email}</td>
                      <td className="py-3 px-6 text-left">
                        <select
                          value={usuario.status}
                          onChange={(e) => handleAtualizarUsuario(usuario.id, e.target.value, usuario.tipo)}
                          className="px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="Ativo">Ativo</option>
                          <option value="Inativo">Inativo</option>
                        </select>
                      </td>
                      <td className="py-3 px-6 text-left">
                        <select
                          value={usuario.tipo === 'Usuario' ? 'Usuário Comum' : usuario.tipo}
                          onChange={(e) => handleAtualizarUsuario(usuario.id, usuario.status, e.target.value === 'Usuário Comum' ? 'Usuario' : e.target.value)}
                          className="px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="Usuário Comum">Usuário Comum</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span className="text-gray-500">Atualizado automaticamente</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500">Nenhum usuário encontrado.</p>
          )}
        </>
      )}
    </div>
  );
};

export default GerenciarUsuarios;
