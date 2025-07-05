import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CriarLead = ({ adicionarLead }) => {
  // Estados para os campos do formulário
  const [nomeLead, setNomeLead] = useState('');
  const [modeloVeiculo, setModeloVeiculo] = useState('');
  const [anoModelo, setAnoModelo] = useState('');
  const [cidade, setCidade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoSeguro, setTipoSeguro] = useState('');
  const [responsavel, setResponsavel] = useState(''); // Novo estado para o Responsável

  const navigate = useNavigate();

  const handleCriar = () => {
    // Validação básica dos campos obrigatórios
    // Incluímos 'responsavel' na validação
    if (!nomeLead || !modeloVeiculo || !anoModelo || !cidade || !telefone || !tipoSeguro || !responsavel) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Geração do ID aleatório mais robusto
    const idAleatorio = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Data e hora atual formatada com horas, minutos e segundos
    const dataHoraAtual = new Date().toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Objeto lead com os nomes das chaves correspondentes às colunas do Sheets
    // Adicionamos 'Responsavel' e definimos 'Status' como 'Fechado'
    const novoLead = {
      ID: idAleatorio,
      name: nomeLead,
      vehicleModel: modeloVeiculo,
      vehicleYearModel: anoModelo,
      city: cidade,
      phone: telefone,
      insurer: tipoSeguro, // Usando 'insurer' conforme suas colunas
      Data: dataHoraAtual, // Coluna 'Data' no Sheets com hora, minuto e segundo
      Responsavel: responsavel, // Nova coluna 'Responsavel'
      Status: 'Fechado', // Status fixo como 'Fechado'
    };

    // Chama a função para enviar o lead para o Google Apps Script
    criarLeadFunc(novoLead);

    // Feedback para o usuário e limpeza do formulário
    alert('Lead criado com sucesso! Verifique a planilha na aba "Leads Fechados".');
    setNomeLead('');
    setModeloVeiculo('');
    setAnoModelo('');
    setCidade('');
    setTelefone('');
    setTipoSeguro('');
    setResponsavel(''); // Limpa o campo Responsável
  };

  const criarLeadFunc = async (lead) => {
    // IMPORTANTE: Substitua ESTE URL pelo URL REAL de IMPLANTAÇÃO DO SEU SCRIPT GAS para criar leads.
    // O Google Apps Script precisará ser atualizado para lidar com as novas colunas e a aba "Leads Fechados".
    const gasUrl = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=criar_lead'; // Exemplo, o seu será diferente

    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lead),
      });

      console.log('Requisição de criação de lead enviada (modo no-cors).');
      console.log('Verifique os logs de execução do Google Apps Script para confirmar o sucesso.');

    } catch (error) {
      console.error('Erro ao enviar lead para o Google Sheets:', error);
      alert('Houve um erro ao tentar criar o lead. Verifique sua conexão ou tente novamente mais tarde.');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-blue-700 mb-4">Criar Novo Lead Fechado</h2>

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

      {/* Novo campo: Responsável */}
      <div>
        <label className="block text-gray-700">Responsável</label>
        <input
          type="text"
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Nome do responsável pelo fechamento"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCriar}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Criar Lead Fechado
        </button>
      </div>
    </div>
  );
};

export default CriarLead;
