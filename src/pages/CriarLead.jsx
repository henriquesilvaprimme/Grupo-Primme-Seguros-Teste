import React, { useState, useEffect } from 'react';

const CriarLead = ({ adicionarLead }) => { // <--- adiciona 'adicionarLead' como prop
  // Estados para os campos do formulário
  const [nome, setNome] = useState('');
  const [modeloVeiculo, setModeloVeiculo] = useState('');
  const [anoModelo, setAnoModelo] = useState('');
  const [cidade, setCidade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoSeguro, setTipoSeguro] = useState('');
  const [responsavel, setResponsavel] = useState(''); // Armazena o nome do responsável
  const [usuariosAtivos, setUsuariosAtivos] = useState([]); // Armazena a lista de objetos de usuários ativos
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  // URL do seu Google Apps Script (GAS)
  // Use a URL correta do seu deploy principal, assim como no App.jsx
  const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec'; // Sua URL base do GAS

  // Função para buscar os usuários ativos do Google Sheets
  useEffect(() => {
    const fetchUsuariosAtivos = async () => {
      try {
        const response = await fetch(`${GAS_WEB_APP_URL}?v=getUsuariosAtivos`);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro na rede ou no script: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        setUsuariosAtivos(Array.isArray(data) ? data : []);

      } catch (error) {
        console.error('Erro ao buscar usuários ativos:', error);
        setUsuariosAtivos([]);
        setMensagemSucesso('Não foi possível carregar a lista de responsáveis. Verifique a conexão ou o script.');
      }
    };

    fetchUsuariosAtivos();
  }, []);

  // Função para resetar os campos do formulário
  const resetForm = () => {
    setNome('');
    setModeloVeiculo('');
    setAnoModelo('');
    setCidade('');
    setTelefone('');
    setTipoSeguro('');
    setResponsavel('');
  };

  const handleCriar = () => {
    setMensagemSucesso('');

    if (!nome || !modeloVeiculo || !anoModelo || !cidade || !telefone || !tipoSeguro || !responsavel) {
      setMensagemSucesso('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const novoLead = {
      nome,
      modeloVeiculo,
      anoModelo,
      cidade,
      telefone,
      tipoSeguro,
      responsavel,
      status: 'Aberto', // Mudei para 'Aberto' pois Fechado seria um status final
      dataCriacao: new Date().toISOString(),
    };

    criarLeadFunc(novoLead);
  };

  const criarLeadFunc = async (lead) => {
    try {
      const response = await fetch(`${GAS_WEB_APP_URL}?v=criar_lead`, {
        method: 'POST',
        mode: 'no-cors', // Mantenha 'no-cors' se estiver em desenvolvimento e testando sem um proxy
        body: JSON.stringify(lead),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Lead enviado. Verifique seu Google Sheet.');
      setMensagemSucesso('✅ Lead criado com sucesso!');

      // *** AQUI ESTÁ A CORREÇÃO PRINCIPAL! ***
      // Chama a função passada via prop para atualizar o estado no App.jsx
      adicionarLead(lead); 

      // Após o sucesso, resetar o formulário
      resetForm();

      // Opcional: Limpar a mensagem de sucesso após alguns segundos
      setTimeout(() => {
        setMensagemSucesso('');
      }, 3000); // A mensagem sumirá após 3 segundos

    } catch (error) {
      console.error('Erro ao enviar lead:', error);
      setMensagemSucesso('Houve um erro ao criar o lead. Tente novamente.');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-blue-700 mb-4">Criar Novo Lead</h2>

      <div>
        <label className="block text-gray-700">Nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Modelo do Veículo</label>
        <input
          type="text"
          value={modeloVeiculo}
          onChange={(e) => setModeloVeiculo(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Ano/Modelo</label>
        <input
          type="text"
          value={anoModelo}
          onChange={(e) => setAnoModelo(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Cidade</label>
        <input
          type="text"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Telefone</label>
        <input
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Tipo de Seguro</label>
        <select
          value={tipoSeguro}
          onChange={(e) => setTipoSeguro(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Selecione o tipo</option>
          <option value="Novo">Novo</option>
          <option value="Renovacao">Renovação</option>
          <option value="Indicacao">Indicação</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-700">Responsável</label>
        <select
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Selecione um responsável</option>
          {usuariosAtivos.map((user) => (
            <option key={user.id} value={user.nome}>
              {user.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="text-gray-700">
        Status: <span className="font-semibold">Aberto</span> {/* Alterado para "Aberto" */}
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleCriar}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Criar Lead
        </button>
      </div>

      {mensagemSucesso && (
        <p className={`mt-4 text-center ${mensagemSucesso.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
          {mensagemSucesso}
        </p>
      )}
    </div>
  );
};

export default CriarLead;
