import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from './config/api'; // Importa as URLs centralizadas

// Recebe 'onCreateLead' como prop do App.jsx para centralizar a lógica de criação
const CriarLead = ({ onCreateLead }) => {
  // Estados para os campos do formulário
  const [nomeLead, setNomeLead] = useState('');
  const [modeloVeiculo, setModeloVeiculo] = useState('');
  const [anoModelo, setAnoModelo] = useState('');
  const [cidade, setCidade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoSeguro, setTipoSeguro] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [nomesResponsaveis, setNomesResponsaveis] = useState([]);
  const [mensagemFeedback, setMensagemFeedback] = useState(''); // Estado para a mensagem de feedback

  const navigate = useNavigate();

  // Função para buscar os nomes dos responsáveis ao carregar o componente
  useEffect(() => {
    const buscarNomesResponsaveis = async () => {
      try {
        // Usa API_ENDPOINTS para a URL
        const response = await fetch(API_ENDPOINTS.LISTAR_NOMES_USUARIOS);
        const data = await response.json();
        setNomesResponsaveis(data);
      } catch (error) {
        console.error('Erro ao buscar nomes de responsáveis:', error);
        setMensagemFeedback('❌ Erro ao carregar a lista de responsáveis. Verifique o console e o Apps Script.');
      }
    };

    buscarNomesResponsaveis();
  }, []); // Dependência vazia, executa apenas na montagem

  const handleCriar = async () => {
    setMensagemFeedback(''); // Limpa qualquer mensagem anterior

    // Validação corrigida dos campos obrigatórios
    if (!nomeLead || !modeloVeiculo || !anoModelo || !cidade || !telefone || !tipoSeguro || !responsavel) {
      setMensagemFeedback('⚠️ Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Geração do ID aleatório mais robusto
    const idAleatorio = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Data e hora atual formatada para o formato ISO 8601 que o GAS espera
    const dataHoraAtual = new Date().toISOString();

    // Objeto lead com os nomes das chaves correspondentes às colunas do Sheets no GAS
    const novoLead = {
      ID: idAleatorio,
      name: nomeLead,
      vehicleModel: modeloVeiculo,
      vehicleYearModel: anoModelo,
      city: cidade,
      phone: telefone,
      // 'insurer' é o nome da coluna no Sheets para o tipo de seguro
      insurer: tipoSeguro, 
      Data: dataHoraAtual,
      Responsavel: responsavel,
      // Status inicial de um novo lead, conforme a lógica do GAS
      Status: 'Novo', 
      Editado: dataHoraAtual // Adiciona o campo Editado
    };

    try {
      // Chama a função onCreateLead passada via props do App.jsx
      // Esta função é responsável por enviar os dados ao GAS e atualizar o estado global.
      const result = await onCreateLead(novoLead); 
      
      if (result.status === 'success') {
        setMensagemFeedback('✅ Lead criado com sucesso!'); // Mensagem de sucesso
        // Limpeza do formulário após sucesso
        setNomeLead('');
        setModeloVeiculo('');
        setAnoModelo('');
        setCidade('');
        setTelefone('');
        setTipoSeguro('');
        setResponsavel('');
      } else {
        setMensagemFeedback(`❌ Erro ao criar o lead: ${result.message || 'Erro desconhecido.'}`);
      }
    } catch (error) {
      console.error('Erro ao criar o lead:', error);
      setMensagemFeedback('❌ Erro ao criar o lead. Verifique sua conexão ou tente novamente.'); // Mensagem de erro
    }
  };

  // A função 'criarLeadFunc' local foi removida, pois a lógica de requisição
  // agora é centralizada na prop 'onCreateLead' do App.jsx.

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-blue-700 mb-4 text-center">Criar Novo Lead</h2>

      <div>
        <label className="block text-gray-700">Nome do Cliente</label>
        <input
          type="text"
          value={nomeLead}
          onChange={(e) => setNomeLead(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Nome completo do lead"
        />
      </div>

      <div>
        <label className="block text-gray-700">Modelo do Veículo</label>
        <input
          type="text"
          value={modeloVeiculo}
          onChange={(e) => setModeloVeiculo(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Ex: Fiat Palio, Honda Civic"
        />
      </div>

      <div>
        <label className="block text-gray-700">Ano/Modelo</label>
        <input
          type="text"
          value={anoModelo}
          onChange={(e) => setAnoModelo(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Ex: 2020/2021"
        />
      </div>

      <div>
        <label className="block text-gray-700">Cidade</label>
        <input
          type="text"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Cidade do cliente"
        />
      </div>

      <div>
        <label className="block text-gray-700">Telefone</label>
        <input
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Ex: (XX) XXXXX-XXXX"
        />
      </div>

      <div>
        <label className="block text-gray-700">Tipo de Seguro</label>
        <select
          value={tipoSeguro}
          onChange={(e) => setTipoSeguro(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Selecione um tipo</option>
          <option value="Novo">Novo</option>
          <option value="Renovacao">Renovação</option>
          <option value="Indicacao">Indicação</option>
        </select>
      </div>

      {/* Campo Responsável agora é um select populado dinamicamente */}
      <div>
        <label className="block text-gray-700">Responsável</label>
        <select
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Selecione o Responsável</option>
          {nomesResponsaveis.map((nome, index) => (
            <option key={index} value={nome}>
              {nome}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col items-center">
        <button
          onClick={handleCriar}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Criar Lead
        </button>
        {mensagemFeedback && (
          <p className={`mt-4 font-semibold text-center ${mensagemFeedback.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {mensagemFeedback}
          </p>
        )}
      </div>
    </div>
  );
};

export default CriarLead;
