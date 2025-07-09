import React, { useState, useEffect } from 'react'; // Reintroduzindo useState e useEffect
import axios from 'axios'; // Reintroduzindo axios

// URL para buscar leads fechados diretamente do Dashboard
const GOOGLE_SHEETS_LEADS_FECHADOS_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=pegar_clientes_fechados';

// O Dashboard AGORA só precisa da prop 'leads' (gerais) e 'usuarioLogado'
const Dashboard = ({ leads, usuarioLogado }) => {
  // Estado para armazenar os leads da aba "Leads Fechados" com Seguradora atribuída
  const [leadsFechadosDoDashboard, setLeadsFechadosDoDashboard] = useState([]);
  const [loadingFechados, setLoadingFechados] = useState(true);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Função para buscar os leads da aba 'Leads Fechados' diretamente aqui no Dashboard
  const buscarLeadsFechadosDoSheets = async () => {
    setLoadingFechados(true); // Inicia o estado de carregamento
    try {
      const response = await axios.get(GOOGLE_SHEETS_LEADS_FECHADOS_URL);

      console.log("Dados brutos de 'pegar_clientes_fechados' (vindo do GAS para o Dashboard):", response.data);

      // Aplica o filtro de segurança (Status 'Fechado' e Seguradora preenchida)
      // Se o usuário não for Admin, filtra também pelo responsável
      const filteredLeads = response.data.filter(
        (lead) => {
          const isFechado = lead.Status === 'Fechado';
          const hasSeguradora = lead.Seguradora && String(lead.Seguradora).trim() !== '';
          const isResponsavel = usuarioLogado?.tipo === 'Admin' || lead.Responsavel === usuarioLogado?.nome;

          return isFechado && hasSeguradora && isResponsavel;
        }
      );

      console.log("Leads 'Fechados' (da aba 'Leads Fechados') e com Seguradora (filtrados no Dashboard):", filteredLeads);

      setLeadsFechadosDoDashboard(filteredLeads);
    } catch (error) {
      console.error('Erro ao buscar leads fechados específicos no Dashboard:', error);
      setLeadsFechadosDoDashboard([]); // Limpa os leads em caso de erro
    } finally {
      setLoadingFechados(false); // Finaliza o estado de carregamento
    }
  };

  useEffect(() => {
    // Executa a busca ao montar o componente e sempre que o usuário logado mudar
    // Isso garante que o filtro por responsável seja aplicado corretamente
    buscarLeadsFechadosDoSheets();

    // Opcional: Adicionar um intervalo para atualização periódica, se necessário
    const interval = setInterval(buscarLeadsFechadosDoSheets, 60000); // A cada 1 minuto
    return () => clearInterval(interval); // Limpa o intervalo ao desmontar
  }, [usuarioLogado]); // Dependência para re-executar se o usuário logado mudar

  // --- CONTADORES ---
  // Estes contadores continuam usando a prop 'leads' (da aba geral 'Leads')
  const totalLeads = leads.length;
  const leadsPerdidos = leads.filter((lead) => lead.status === 'Perdido').length;
  const leadsEmContato = leads.filter((lead) => lead.status === 'Em Contato').length;
  const leadsSemContato = leads.filter((lead) => lead.status === 'Sem Contato').length;

  // ESTE É O CONTADOR DE 'LEADS FECHADOS':
  // Ele AGORA usa o estado 'leadsFechadosDoDashboard' que é buscado diretamente aqui.
  const leadsFechados = leadsFechadosDoDashboard.length;

  // Contadores por seguradora baseados em 'leadsFechadosDoDashboard' (CORRETO)
  const portoSeguro = leadsFechadosDoDashboard.filter((lead) => lead.Seguradora === 'Porto Seguro').length;
  const azulSeguros = leadsFechadosDoDashboard.filter((lead) => lead.Seguradora === 'Azul Seguros').length;
  const itauSeguros = leadsFechadosDoDashboard.filter((lead) => lead.Seguradora === 'Itau Seguros').length;
  const demais = leadsFechadosDoDashboard.filter((lead) => lead.Seguradora === 'Demais Seguradoras').length;

  // Calcular total de prêmio líquido global (também baseado em 'leadsFechadosDoDashboard')
  const totalPremioLiquido = leadsFechadosDoDashboard.reduce(
    (acc, curr) => acc + (Number(curr.PremioLiquido) || 0),
    0
  );

  // Calcular média ponderada de comissão global (também baseado em 'leadsFechadosDoDashboard')
  const somaPonderadaComissao = leadsFechadosDoDashboard.reduce((acc, lead) => {
    const premio = Number(lead.PremioLiquido) || 0;
    const comissao = Number(lead.Comissao) || 0;
    return acc + premio * (comissao / 100);
  }, 0);

  const comissaoMediaGlobal =
    totalPremioLiquido > 0 ? (somaPonderadaComissao / totalPremioLiquido) * 100 : 0;

  // Estilo comum para as caixas
  const boxStyle = {
    padding: '10px',
    borderRadius: '5px',
    flex: 1,
    color: '#fff',
    textAlign: 'center',
  };

  if (loadingFechados) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Carregando dados de leads fechados...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
        <div>
          <label>Data Início: </label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>
        <div>
          <label>Data Fim: </label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
      </div>

      {/* Primeira linha de contadores */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ ...boxStyle, backgroundColor: '#eee', color: '#333' }}>
          <h3>Total de Leads</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalLeads}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#4CAF50' }}>
          <h3>Leads Fechados</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{leadsFechados}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#F44336' }}>
          <h3>Leads Perdidos</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{leadsPerdidos}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#FF9800' }}>
          <h3>Em Contato</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{leadsEmContato}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#9E9E9E' }}>
          <h3>Sem Contato</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{leadsSemContato}</p>
        </div>
      </div>

      {/* Segunda linha de contadores (por seguradora) */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ ...boxStyle, backgroundColor: '#003366' }}>
          <h3>Porto Seguro</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{portoSeguro}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#87CEFA' }}>
          <h3>Azul Seguros</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{azulSeguros}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#FF8C00' }}>
          <h3>Itau Seguros</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{itauSeguros}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#4CAF50' }}>
          <h3>Demais Seguradoras</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{demais}</p>
        </div>
      </div>

      {/* Linha extra para Prêmio Líquido e Comissão */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={{ ...boxStyle, backgroundColor: '#3f51b5' }}>
          <h3>Total Prêmio Líquido</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {totalPremioLiquido.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#009688' }}>
          <h3>Média Comissão</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {comissaoMediaGlobal.toFixed(2).replace('.', ',')}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
