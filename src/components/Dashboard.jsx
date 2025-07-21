import React, { useState, useEffect } from 'react';

const Dashboard = ({ leads, usuarioLogado }) => {
  const [leadsClosed, setLeadsClosed] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inicializar dataInicio e dataFim com valores padrão ao carregar o componente
  const getPrimeiroDiaMes = () => {
    const hoje = new Date();
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
  };

  const getDataHoje = () => {
    return new Date().toISOString().slice(0, 10);
  };

  const [dataInicio, setDataInicio] = useState(getPrimeiroDiaMes());
  const [dataFim, setDataFim] = useState(getDataHoje());
  const [filtroAplicado, setFiltroAplicado] = useState({ inicio: getPrimeiroDiaMes(), fim: getDataHoje() });

  // Busca leads fechados
  // Esta função agora buscará leads fechados E os filtrará por data no frontend,
  // pois a API não estava recebendo os parâmetros de data.
  // Se sua API de leads fechados (GAS) puder receber parâmetros de data, seria mais eficiente filtrar lá.
  const buscarLeadsClosedFromAPI = async () => {
    setLoading(true);
    try {
      // A URL original sem parâmetros de data, como no seu código inicial
      const respostaLeads = await fetch(
        'https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?v=pegar_clientes_fechados'
      );
      const dadosLeads = await respostaLerespostaLeads.json();
      setLeadsClosed(dadosLeads);
    } catch (error) {
      console.error('Erro ao buscar leads fechados da API:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carrega leads fechados da API uma vez na montagem inicial do componente
  useEffect(() => {
    buscarLeadsClosedFromAPI();
  }, []);

  const aplicarFiltroData = () => {
    // Atualiza o filtro aplicado, o que fará com que as variáveis computadas sejam recalculadas
    setFiltroAplicado({ inicio: dataInicio, fim: dataFim });
  };

  // --- Lógica de Filtragem e Contagem ---

  // Função auxiliar para validar e formatar a data
  const getValidDateStr = (dateValue) => {
    if (!dateValue) return null; // Retorna nulo se a data não existir
    const dateObj = new Date(dateValue);
    if (isNaN(dateObj.getTime())) {
      // console.warn('Data inválida detectada:', dateValue); // Para depuração
      return null; // Retorna nulo se a data for inválida
    }
    return dateObj.toISOString().slice(0, 10);
  };

  // 1. Filtro dos LEADS GERAIS (vindos via prop `leads`) por data
  const leadsFiltradosPorDataGeral = leads.filter((lead) => {
    // Usando 'createdAt' como no seu código original para leads gerais
    const dataLeadStr = getValidDateStr(lead.createdAt);

    if (!dataLeadStr) return false; // Exclui leads com data inválida ou ausente

    if (filtroAplicado.inicio && dataLeadStr < filtroAplicado.inicio) return false;
    if (filtroAplicado.fim && dataLeadStr > filtroAplicado.fim) return false;
    return true;
  });

  // Contagens para os leads gerais filtrados
  const totalLeads = leadsFiltradosPorDataGeral.length;
  const leadsFechadosCount = leadsFiltradosPorDataGeral.filter((lead) => lead.status === 'Fechado').length;
  const leadsPerdidos = leadsFiltradosPorDataGeral.filter((lead) => lead.status === 'Perdido').length;
  const leadsEmContato = leadsFiltradosPorDataGeral.filter((lead) => lead.status === 'Em Contato').length;
  const leadsSemContato = leadsFiltradosPorDataGeral.filter((lead) => lead.status === 'Sem Contato').length;

  // 2. Filtro dos LEADS FECHADOS (vindos da `leadsClosed` state)
  // Primeiro, filtra por responsável (se não for admin)
  let leadsFiltradosClosedPorResponsavel =
    usuarioLogado.tipo === 'Admin'
      ? leadsClosed
      : leadsClosed.filter((lead) => lead.Responsavel === usuarioLogado.nome);

  // Segundo, aplica o filtro de data nos leads fechados já filtrados por responsável
  const leadsFiltradosClosedFinal = leadsFiltradosClosedPorResponsavel.filter((lead) => {
    // Usando 'Data' como no seu código original para leads fechados
    const dataLeadStr = getValidDateStr(lead.Data);

    if (!dataLeadStr) return false; // Exclui leads com data inválida ou ausente

    if (filtroAplicado.inicio && dataLeadStr < filtroAplicado.inicio) return false;
    if (filtroAplicado.fim && dataLeadStr > filtroAplicado.fim) return false;
    return true;
  });


  // Contadores por seguradora (baseados nos leads fechados filtrados e por responsável)
  const portoSeguro = leadsFiltradosClosedFinal.filter((lead) => lead.Seguradora === 'Porto Seguro').length;
  const azulSeguros = leadsFiltradosClosedFinal.filter((lead) => lead.Seguradora === 'Azul Seguros').length;
  const itauSeguros = leadsFiltradosClosedFinal.filter((lead) => lead.Seguradora === 'Itau Seguros').length;
  const demais = leadsFiltradosClosedFinal.filter((lead) => lead.Seguradora === 'Demais Seguradoras').length;

  // Soma de prêmio líquido e média ponderada de comissão
  const totalPremioLiquido = leadsFiltradosClosedFinal.reduce(
    (acc, lead) => acc + (Number(lead.PremioLiquido) || 0),
    0
  );

  const somaPonderadaComissao = leadsFiltradosClosedFinal.reduce((acc, lead) => {
    const premio = Number(lead.PremioLiquido) || 0;
    const comissao = Number(lead.Comissao) || 0;
    return acc + premio * (comissao / 100);
  }, 0);

  const comissaoMediaGlobal =
    totalPremioLiquido > 0 ? (somaPonderadaComissao / totalPremioLiquido) * 100 : 0;

  const boxStyle = {
    padding: '10px',
    borderRadius: '5px',
    flex: 1,
    color: '#fff',
    textAlign: 'center',
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>

      {/* Filtro de datas com botão */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            cursor: 'pointer',
          }}
          title="Data de Início"
        />
        <input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            cursor: 'pointer',
          }}
          title="Data de Fim"
        />
        <button
          onClick={aplicarFiltroData}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 14px',
            cursor: 'pointer',
          }}
        >
          Filtrar
        </button>
      </div>

      {/* Primeira linha de contadores */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ ...boxStyle, backgroundColor: '#eee', color: '#333' }}>
          <h3>Total de Leads</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalLeads}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#4CAF50' }}>
          <h3>Vendas</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{leadsFechadosCount}</p>
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

      {/* Segunda linha de contadores */}
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

      {/* Somente para Admin: linha de Prêmio Líquido e Comissão */}
      {usuarioLogado.tipo === 'Admin' && (
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
      )}
    </div>
  );
};

export default Dashboard;
