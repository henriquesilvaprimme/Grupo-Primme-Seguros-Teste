import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CriarLead = () => { // Removido 'adicionarLead' pois não é usado aqui
  // Estados para os campos do formulário
  const [nomeLead, setNomeLead] = useState('');
  const [modeloVeiculo, setModeloVeiculo] = useState('');
  const [anoModelo, setAnoModelo] = useState('');
  const [cidade, setCidade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoSeguro, setTipoSeguro] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [nomesResponsaveis, setNomesResponsaveis] = useState([]);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  const navigate = useNavigate();

  // ATENÇÃO: SUBSTITUA ESTE URL PELA URL REAL DA SUA IMPLANTAÇÃO MAIS RECENTE DO GOOGLE APPS SCRIPT
  const gasUrl = 'https://script.google.com/macros/s/SEU_ID_DE_IMPLANTACAO_AQUI/exec';

  // Função para buscar os nomes dos responsáveis ao carregar o componente
  useEffect(() => {
    const buscarNomesResponsaveis = async () => {
      try {
        console.log('Buscando nomes de responsáveis da URL:', `${gasUrl}?v=listar_nomes_usuarios`);
        const response = await fetch(`${gasUrl}?v=listar_nomes_usuarios`);
        
        // Verifica se a resposta está OK (status 200)
        // No modo 'no-cors', a resposta real não é visível.
        // No entanto, se o Apps Script estiver configurado corretamente e respondendo JSON,
        // o .json() vai tentar parsear mesmo com 'no-cors'.
        // O ideal para debug seria testar sem 'no-cors' temporariamente (e configurar CORS no GAS, se possível)
        // ou verificar os logs de execução do Apps Script diretamente.
        
        const data = await response.json(); // Tenta parsear a resposta como JSON
        console.log('Nomes de responsáveis recebidos:', data);
        
        // Se 'data' não for um array ou estiver vazio, você pode querer lidar com isso
        if (Array.isArray(data) && data.length > 0) {
          setNomesResponsaveis(data);
        } else {
          console.warn('Nenhuma lista de responsáveis válida recebida. Verifique o Google Apps Script.');
          setNomesResponsaveis([]); // Garante que é um array vazio para não quebrar o map
        }
        
      } catch (error) {
        console.error('Erro ao buscar nomes de responsáveis:', error);
        // Alerta para o usuário sobre o erro no carregamento
        alert('Houve um erro ao carregar a lista de responsáveis. Verifique os logs do console para mais detalhes.');
        setNomesResponsaveis([]); // Garante que é um array vazio em caso de erro
      }
    };

    buscarNomesResponponsaveis();
  }, [gasUrl]); // Adicionado gasUrl como dependência para re-executar se a URL mudar

  const handleCriar = async () => { // Adicionado 'async' aqui para aguardar criarLeadFunc
    setMensagemSucesso(''); // Limpa a mensagem anterior ao tentar criar um novo lead

    // Validação básica dos campos obrigatórios
    if (!nomeLead || !modeloVeiculo || !anoModelo || !cidade || !telefone || !tipoSeguro || !responsavel) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const idAleatorio = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const dataHoraAtual = new Date().toLocaleString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

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

    await criarLeadFunc(novoLead); // Aguarda a conclusão da função de criação

    // Limpeza do formulário e feedback para o usuário
    setNomeLead('');
    setModeloVeiculo('');
    setAnoModelo('');
    setCidade('');
    setTelefone('');
    setTipoSeguro('');
    setResponsavel('');
    setMensagemSucesso('✅ Lead criado com sucesso!'); // Define a mensagem de sucesso após a tentativa de criação
  };

  const criarLeadFunc = async (lead) => {
    try {
      const response = await fetch(`${gasUrl}?v=criar_lead`, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lead),
      });

      console.log('Requisição de criação de lead enviada (modo no-cors).');
      console.log('Verifique os logs de execução do Google Apps Script para confirmar o sucesso.');

      // Como estamos em 'no-cors', não podemos ler a resposta real (response.ok, response.status)
      // Apenas a ausência de um erro no fetch indica que a requisição foi enviada.
      // A confirmação real de sucesso ou falha na escrita deve vir dos logs do Google Apps Script.

    } catch (error) {
      console.error('Erro ao enviar lead para o Google Sheets:', error);
      // Aqui você pode definir uma mensagem de erro se a criação falhar
      setMensagemSucesso('❌ Erro ao criar o lead. Tente novamente.');
      throw error; // Re-lança o erro para que handleCriar possa capturá-lo se necessário
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

      {/* Campo Responsável agora é um select populado dinamicamente */}
      <div>
        <label className="block text-gray-700">Responsável</label>
        <select
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Selecione o Responsável</option>
          {/* Renderiza as opções apenas se nomesResponsaveis não estiver vazio */}
          {nomesResponsaveis.length > 0 ? (
            nomesResponsaveis.map((nome, index) => (
              <option key={index} value={nome}>
                {nome}
              </option>
            ))
          ) : (
            <option value="" disabled>Carregando ou nenhum responsável encontrado...</option>
          )}
        </select>
      </div>

      <div className="flex flex-col items-center">
        <button
          onClick={handleCriar}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Criar Lead
        </button>
        {mensagemSucesso && (
          <p className="mt-4 text-green-600 font-semibold text-center">{mensagemSucesso}</p>
        )}
      </div>
    </div>
  );
};

export default CriarLead;
