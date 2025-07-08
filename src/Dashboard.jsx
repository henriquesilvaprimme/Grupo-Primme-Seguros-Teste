import React, { useState, useEffect } from 'react';

// Importe suas URLs centralizadas (se ainda precisar de alguma requisição direta aqui, o que não parece ser o caso)
// import { API_ENDPOINTS } from './config/api';

// As props leads e leadsClosed já vêm do App.jsx
const Dashboard = ({ leads, leadsClosed, usuarioLogado }) => {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Função auxiliar para verificar se uma data está dentro do período de filtro
  const isDateInRange = (leadDateStr, startStr, endStr) => {
    if (!leadDateStr) return false;
    const leadDate = new Date(leadDateStr);
    leadDate.setHours(0, 0, 0, 0); // Normaliza para o início do dia

    const startDate = startStr ? new Date(startStr) : null;
    if (startDate) startDate.setHours(0, 0, 0, 0);

    const endDate = endStr ? new Date(endStr) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999); // Normaliza para o final do dia

    if (startDate && leadDate < startDate) return false;
    if (endDate && leadDate > endDate) return false;
    return true;
  };

  // Filtra os leads ativos e fechados com base nas datas de criação/edição
  const filteredLeads = leads.filter(lead => {
    // Usa lead.createdAt para leads ativos, que é a data de criação
    return isDateInRange(lead.createdAt, dataInicio, dataFim);
  });

  const filteredLeadsClosed = leadsClosed.filter(lead => {
    // Para leads fechados, use a data de fechamento (lead.Data ou lead.createdAt)
    // Assumindo que 'Data' é a data de fechamento/movimentação para Leads Fechados
    return isDateInRange(lead.Data || lead.createdAt, dataInicio, dataFim);
  });

  // Contadores existentes (agora baseados em leads filtrados)
  const totalLeads = filteredLeads.length;
  const leadsFechadosCount = filteredLeads.filter((lead) => lead.status === 'Fechado').length;
  const leadsPerdidosCount = filteredLeads.filter((lead) => lead.status === 'Perdido').length;
  const leadsEmContatoCount = filteredLeads.filter((lead) => lead.status === 'Em Contato').length;
  const leadsSemContatoCount = filteredLeads.filter((lead) => lead.status === 'Sem Contato').length;

  // Contadores por seguradora baseados em filteredLeadsClosed
  const portoSeguro = filteredLeadsClosed.filter((lead) => lead.Seguradora === 'Porto Seguro').length;
  const azulSeguros = filteredLeadsClosed.filter((lead) => lead.Seguradora === 'Azul Seguros').length;
  const itauSeguros = filteredLeadsClosed.filter((lead) => lead.Seguradora === 'Itau Seguros').length;
  const demais = filteredLeadsClosed.filter((lead) => lead.Seguradora === 'Demais Seguradoras').length;

  // Calcular total de prêmio líquido global (agora baseado em filteredLeadsClosed)
  const totalPremioLiquido = filteredLeadsClosed.reduce(
    (acc, curr) => acc + (Number(String(curr.PremioLiquido).replace(',', '.')) || 0), // Converte para número, lida com vírgula
    0
  );

  // Calcular média ponderada de comissão global (agora baseado em filteredLeadsClosed)
  const somaPonderadaComissao = filteredLeadsClosed.reduce((acc, lead) => {
    const premio = Number(String(lead.PremioLiquido).replace(',', '.')) || 0;
    const comissao = Number(String(lead.Comissao).replace(',', '.')) || 0;
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

  return (
    <div style={{ padding: '20px' }}>
      <h1>Dashboard</h1>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <label>Data Início: </label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div>
          <label>Data Fim: </label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
      </div>

      {/* Primeira linha de contadores */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ ...boxStyle, backgroundColor: '#eee', color: '#333' }}>
          <h3>Total de Leads</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalLeads}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#4CAF50' }}>
          <h3>Leads Fechados</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{leadsFechadosCount}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#F44336' }}>
          <h3>Leads Perdidos</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{leadsPerdidosCount}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#FF9800' }}>
          <h3>Em Contato</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{leadsEmContatoCount}</p>
        </div>
        <div style={{ ...boxStyle, backgroundColor: '#9E9E9E' }}>
          <h3>Sem Contato</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{leadsSemContatoCount}</p>
        </div>
      </div>

      {/* Segunda linha de contadores (por seguradora) */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
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
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
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
