import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CriarLead = () => { // Removido 'adicionarLead' pois não é usado aqui no formulário de criação
  // Estados para os campos do formulário
  const [nomeLead, setNomeLead] = useState('');
  const [modeloVeiculo, setModeloVeiculo] = useState('');
  const [anoModelo, setAnoModelo] = useState('');
  const [cidade, setCidade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoSeguro, setTipoSeguro] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [nomesResponsaveis, setNomesResponsaveis] = useState([]);
  const [mensagemSucesso, setMensagemSucesso] = useState(''); // Estado para a mensagem de feedback

  const navigate = useNavigate();

  // ATENÇÃO: SUBSTITUA ESTE URL PELA URL REAL DA SUA IMPLANTAÇÃO MAIS RECENTE DO GOOGLE APPS SCRIPT
  const gasUrl = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';

  // Função para buscar os nomes dos responsáveis ao carregar o componente
  useEffect(() => {
    const buscarNomesResponsaveis = async () => {
      try {
        const response = await fetch(`${gasUrl}?v=listar_nomes_usuarios`);
        const data = await response.json();
        setNomesResponsaveis(data);
      } catch (error) {
        console.error('Erro ao buscar nomes de responsáveis:', error);
        alert('Houve um erro ao carregar a lista de responsáveis. Verifique o console para detalhes.');
      }
    };

    buscarNomesResponsaveis();
  }, [gasUrl]); // Adicionado gasUrl como dependência para garantir re-execução se a URL mudar

  const handleCriar = async () => { // Adicionado 'async' para poder usar 'await'
    setMensagemSucesso(''); // Limpa qualquer mensagem anterior

    // Validação básica dos campos obrigatórios
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
      Status: 'Fechado',
    };

    try {
      await criarLeadFunc(novoLead); // Espera a função de criação ser concluída
      setMensagemSucesso('✅ Lead criado com sucesso!'); // Mensagem de sucesso
      // Limpeza do formulário após sucesso
      setNomeLead('');
      setModeloVeiculo('');
      setAnoModelo('');
      setCidade('');
      setTelefone('');
      setTipoSeguro('');
      setResponsavel('');
    } catch (error) {
      setMensagemSucesso('❌ Erro ao criar o lead. Verifique sua conexão ou tente novamente.'); // Mensagem de erro
    }
  };

  const criarLeadFunc = async (lead) => {
    try {
      const response = await fetch(`${gasUrl}?v=criar_lead`, {
        method: 'POST',
        mode: 'no-cors', // Importante para evitar problemas de CORS com o Apps Script
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lead),
      });

      console.log('Requisição de criação de lead enviada (modo no-cors).');
      console.log('Verifique os logs de execução do Google Apps Script para confirmar o sucesso.');

      // No modo 'no-cors', não é possível inspecionar a resposta diretamente (response.ok, response.status, etc.)
      // Então, um erro de rede lançará uma exceção, que será capturada no bloco catch.
      // Se a requisição foi enviada com sucesso (sem erros de rede), assumimos que o Apps Script a recebeu.

    } catch (error) {
      console.error('Erro ao enviar lead para o Google Sheets:', error);
      throw error; // Re-lança o erro para que handleCriar possa tratá-lo
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-blue-700 mb-4 text-center">Criar Novo Lead</h2> {/* Título alterado e centralizado */}

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

      <div className="flex flex-col items-center"> {/* Centralizado */}
        <button
          onClick={handleCriar}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Criar Lead {/* Texto alterado */}
        </button>
        {mensagemSucesso && (
          <p className="mt-4 text-green-600 font-semibold text-center">{mensagemSucesso}</p> {/* Mensagem de feedback */}
        )}
      </div>
    </div>
  );
};

export default CriarLead;
