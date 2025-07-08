import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Altere a definição do componente para receber 'adicionarLead' e 'usuariosAtivos'
const CriarLead = ({ adicionarLead, usuariosAtivos }) => {
  // Estados para os campos do formulário
  const [nomeLead, setNomeLead] = useState('');
  const [modeloVeiculo, setModeloVeiculo] = useState('');
  const [anoModelo, setAnoModelo] = useState('');
  const [cidade, setCidade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoSeguro, setTipoSeguro] = useState('');
  const [responsavel, setResponsavel] = useState('');
  // Não precisamos mais do estado local para buscar os nomes dos responsáveis,
  // pois eles virão via props. No entanto, se você quiser manter a variável,
  // pode inicializá-la com 'usuariosAtivos'
  // const [nomesResponsaveis, setNomesResponsaveis] = useState([]); // Esta linha pode ser removida ou alterada
  const [mensagemFeedback, setMensagemFeedback] = useState(''); // Estado para a mensagem de feedback

  const navigate = useNavigate();

  // A URL do Apps Script para criar lead ainda é necessária
  const gasUrl = 'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec';

  // --- REMOVA ESTE useEffect INTEIRO ---
  // A busca dos nomes dos responsáveis não é mais feita aqui, mas sim em App.jsx
  /*
  useEffect(() => {
    const buscarNomesResponsaveis = async () => {
      try {
        const response = await fetch(`${gasUrl}?v=listar_nomes_usuarios`);
        const data = await response.json();
        setNomesResponsaveis(data);
      } catch (error) {
        console.error('Erro ao buscar nomes de responsáveis:', error);
        setMensagemFeedback('❌ Erro ao carregar a lista de responsáveis. Verifique o console e o Apps Script.');
      }
    };
    buscarNomesResponsaveis();
  }, [gasUrl]);
  */
  // --- FIM DA REMOÇÃO ---


  const handleCriar = async () => {
    setMensagemFeedback(''); // Limpa qualquer mensagem anterior

    // Validação corrigida dos campos obrigatórios
    if (!nomeLead || !modeloVeiculo || !anoModelo || !cidade || !telefone || !tipoSeguro || !responsavel) {
      setMensagemFeedback('⚠️ Por favor, preencha todos os campos obrigatórios.');
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
    const novoLead = {
      ID: idAleatorio,
      name: nomeLead,
      vehicleModel: modeloVeiculo,
      vehicleYearModel: anoModelo,
      city: cidade,
      phone: telefone,
      insurer: tipoSeguro,
      Data: dataHoraAtual,
      Responsavel: responsavel,
      Status: 'Aberto', // Mudei para 'Aberto' como status inicial para um novo lead, se for o caso
    };

    try {
      // Usamos a prop adicionarLead, que já foi definida em App.jsx
      await adicionarLead(novoLead); // Espera a função de criação ser concluída
      setMensagemFeedback('✅ Lead criado com sucesso!'); // Mensagem de sucesso
      // Limpeza do formulário após sucesso
      setNomeLead('');
      setModeloVeiculo('');
      setAnoModelo('');
      setCidade('');
      setTelefone('');
      setTipoSeguro('');
      setResponsavel('');
    } catch (error) {
      console.error('Erro ao criar o lead:', error);
      setMensagemFeedback('❌ Erro ao criar o lead. Verifique sua conexão ou tente novamente.'); // Mensagem de erro
    }
  };

  // Esta função agora será responsável APENAS por enviar para o Apps Script,
  // ou pode ser completamente removida se adicionarLead já faz isso.
  // No seu App.jsx, adicionarNovoLead já está enviando para o Apps Script.
  // Então, esta função criarLeadFunc pode ser desnecessária AQUI.
  // Se `adicionarNovoLead` em `App.jsx` já faz a chamada `fetch` para o GAS,
  // você pode remover esta `criarLeadFunc` daqui.
  const criarLeadFunc = async (lead) => {
    try {
      await fetch(`${gasUrl}?v=criar_lead`, {
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
      throw error; // Re-lança o erro para que handleCriar possa tratá-lo
    }
  };

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

      {/* Campo Responsável populado pela prop `usuariosAtivos` */}
      <div>
        <label className="block text-gray-700">Responsável</label>
        <select
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Selecione o Responsável</option>
          {/* Usa a prop diretamente para popular o select */}
          {usuariosAtivos.map((nome, index) => (
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
