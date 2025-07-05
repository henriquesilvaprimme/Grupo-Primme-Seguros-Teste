import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CriarLead = ({ adicionarLead }) => {
  // Estados para os campos do formulário
  const [nomeLead, setNomeLead] = useState('');
  const [modeloVeiculo, setModeloVeiculo] = useState('');
  const [anoModelo, setAnoModelo] = useState('');
  const [cidade, setCidade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoSeguro, setTipoSeguro] = useState(''); // Estado para o select

  const navigate = useNavigate();

  const handleCriar = () => {
    // Validação básica dos campos obrigatórios
    if (!nomeLead || !modeloVeiculo || !anoModelo || !cidade || !telefone || !tipoSeguro) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Geração do ID aleatório (usando timestamp para garantir unicidade)
    const idAleatorio = Date.now().toString(); 
    // Data atual formatada para a planilha
    const dataAtual = new Date().toLocaleDateString('pt-BR'); 

    // Objeto lead com os nomes das chaves correspondentes às colunas do Sheets
    const novoLead = {
      ID: idAleatorio,
      name: nomeLead,
      vehicleModel: modeloVeiculo,
      vehicleYearModel: anoModelo,
      city: cidade,
      phone: telefone,
      insuranceType: tipoSeguro,
      data: dataAtual, // Coluna 'data' no Sheets
    };

    // Chama a função para enviar o lead para o Google Apps Script
    criarLeadFunc(novoLead);

    // Opcional: Adiciona o lead localmente na sua aplicação (se houver uma lista)
    // if (adicionarLead) {
    //   adicionarLead(novoLead);
    // }
    
    // Feedback para o usuário e limpeza do formulário
    alert('Lead criado com sucesso! Verifique a planilha.');
    setNomeLead('');
    setModeloVeiculo('');
    setAnoModelo('');
    setCidade('');
    setTelefone('');
    setTipoSeguro('');
    
    // Opcional: Navegar para uma página de leads após a criação
    // navigate('/leads'); 
  };

  const criarLeadFunc = async (lead) => {
    // IMPORTANTE: Substitua ESTE URL pelo URL REAL de IMPLANTAÇÃO DO SEU SCRIPT GAS para criar leads.
    // Certifique-se de que o parâmetro 'v' (ou outro que você use) corresponda à função no seu GAS.
    const gasUrl = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=criar_lead'; // Exemplo, o seu será diferente
    
    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        // 'no-cors' impede a leitura da resposta, mas a requisição é enviada.
        // O GAS precisará retornar um sucesso HTTP 200 OK implicitamente para que funcione.
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'application/json',
          // Não inclua 'Access-Control-Allow-Origin' aqui, isso é para o lado do servidor (GAS).
        },
        body: JSON.stringify(lead),
      });

      // No modo 'no-cors', 'response.ok' será sempre true e 'response.status' será 0.
      // Você não poderá inspecionar o corpo da resposta aqui.
      console.log('Requisição de criação de lead enviada (modo no-cors).');
      console.log('Verifique os logs de execução do Google Apps Script para confirmar o sucesso.');

    } catch (error) {
      console.error('Erro ao enviar lead para o Google Sheets:', error);
      alert('Houve um erro ao tentar criar o lead. Verifique sua conexão ou tente novamente mais tarde.');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-blue-700 mb-4">Criar Novo Lead de Seguro</h2>

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
          type="tel" // Tipo 'tel' para melhor usabilidade em celulares
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

      <div className="flex justify-end">
        <button
          onClick={handleCriar}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Criar Lead
        </button>
      </div>
    </div>
  );
};

export default CriarLead;
