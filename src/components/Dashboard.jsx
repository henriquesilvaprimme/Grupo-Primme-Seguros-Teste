import React, { useState, useEffect } from 'react';
import axios from 'axios';

// URL para buscar leads fechados diretamente do Dashboard
const GOOGLE_SHEETS_LEADS_FECHADOS_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec'; // URL base sem os parâmetros de data, eles serão adicionados dinamicamente

// Função auxiliar para formatar a data para o input type="date" (YYYY-MM-DD)
const formatarDataParaInput = (data) => {
  if (!data) return '';
  const d = new Date(data);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Dashboard = ({ leads, usuarioLogado }) => {
  const [leadsFechadosDoDashboard, setLeadsFechadosDoDashboard] = useState([]);
  const [loadingFechados, setLoadingFechados] = useState(true);

  // --- Lógica para as datas padrão ---
  const hoje = new Date();
  const primeiroDiaMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  // Estados dos filtros de data, inicializados com as datas padrão
  const [dataInicio, setDataInicio] = useState(formatarDataParaInput(primeiroDiaMesAtual));
  const [dataFim, setDataFim] = useState(formatarDataParaInput(hoje));

  const buscarLeadsFechadosDoSheets = async () => {
    setLoadingFechados(true);
    try {
      // Modificação principal: Adicionar parâmetros de data à URL
      const urlComFiltro = `${GOOGLE_SHEETS_LEADS_FECHADOS_URL}?v=pegar_clientes_fechados&dataInicio=${dataInicio}&dataFim=${dataFim}`;
      const response = await axios.get(urlComFiltro);

      console.log("Dados brutos de 'pegar_clientes_fechados' (vindo do GAS para o Dashboard):", response.data);

      // A filtragem por data deve ser feita no lado do Google Apps Script.
      // Aqui, mantemos apenas os filtros que ainda seriam relevantes no frontend,
      // como o filtro por responsável e a validação de Seguradora e Status.
      const filteredLeads = response.data.filter(
        (lead) => {
          const isFechadoEComSeguradora = lead.Status === 'Fechado' && lead.Seguradora && String(lead.Seguradora).trim() !== '';
          const isResponsavel = usuarioLogado?.tipo === 'Admin' || lead.Responsavel === usuarioLogado?.nome;
          return isFechadoEComSeguradora && isResponsavel;
        }
      );

      console.log("Leads 'Fechados' (da aba 'Leads Fechados'), com Seguradora, e filtrados por data/responsável no Dashboard:", filteredLeads);

      setLeadsFechadosDoDashboard(filteredLeads);
    } catch (error) {
      console.error('Erro ao buscar leads fechados específicos no Dashboard:', error);
      setLeadsFechadosDoDashboard([]);
    } finally {
      setLoadingFechados(false);
    }
  };

  useEffect(() => {
    // A busca é re-executada quando as datas de início/fim ou o usuário logado mudam
    buscarLeadsFechadosDoSheets();

    // Mantém o intervalo de atualização para sincronização
    const interval = setInterval(buscarLeadsFechadosDoSheets, 60000); // Pode ser reduzido para 10000 ou 30000ms
    return () => clearInterval(interval);
  }, [usuarioLogado, dataInicio, dataFim]); // Adicionadas dependências dataInicio e dataFim

  // --- CONTADORES ---
  // Estes continuam vindo da prop 'leads' (da aba 'Leads')
  const totalLeads = leads.length;
  const leadsPerdidos = leads.filter((lead) => lead.status === 'Perdido').length;
  const leadsEmContato = leads.filter((lead) => lead.status === 'Em Contato').length;
  const leadsSemContato = leads.filter((lead) => lead.status === 'Sem Contato').length;

  // ESTES AGORA USAM APENAS leadsFechadosDoDashboard, que já está pré-filtrado pela API
  const leadsFechados = leadsFechadosDoDashboard.length;

  const portoSeguro = leadsFechadosDoDashboard.filter((lead) => String(lead.Seguradora).trim() === 'Porto Seguro').length;
  const azulSeguros = leadsFechadosDoDashboard.filter((lead) => String(lead.Seguradora).trim() === 'Azul Seguros').length;
  const itauSeguros = leadsFechadosDoDashboard.filter((lead) => String(lead.Seguradora).trim() === 'Itau Seguros').length;
  const demais = leadsFechadosDoDashboard.filter((lead) => String(lead.Seguradora).trim() === 'Demais Seguradoras').length;

  const totalPremioLiquido = leadsFechadosDoDashboard.reduce(
    (acc, curr) => acc + (Number(curr.PremioLiquido) || 0),
    0
  );

  // Calcula a soma ponderada da comissão para a média
  const somaPonderadaComissao = leadsFechadosDoDashboard.reduce((acc, lead) => {
    const premio = Number(lead.PremioLiquido) || 0;
    // Garante que 'Comissao' é um número (pode vir como string "XX%")
    const comissaoString = String(lead.Comissao).replace(',', '.').replace('%', '');
    const comissao = parseFloat(comissaoString) || 0; // Se for '20%', será 20

    return acc + premio * (comissao / 100); // Divide por 100 para transformar % em decimal
  }, 0);

  // Comissão média global baseada no prêmio líquido total
  const comissaoMediaGlobal =
    totalPremioLiquido > 0 ? (somaPonderadaComissao / totalPremioLiquido) * 100 : 0;


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

      {/* --- Filtros de Data --- */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px' }}>
        <div>
          <label htmlFor="dataInicio">Data Início: </label>
          <input
            id="dataInicio"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="dataFim">Data Fim: </label>
          <input
            id="dataFim"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="p-2 border rounded"
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
          <h3>Vendas</h3>
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
