import React, { useState, useEffect } from 'react';
import Lead from './components/Lead';
import { RefreshCcw, Bell } from 'lucide-react';

const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';
const ALTERAR_ATRIBUIDO_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=alterar_atribuido';
const SALVAR_OBSERVACAO_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?action=salvarObservacao';

const Leads = ({ leads, usuarios, onUpdateStatus, transferirLead, usuarioLogado, fetchLeadsFromSheet, scrollContainerRef }) => {
  const [selecionados, setSelecionados] = useState({});
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [observacoes, setObservacoes] = useState({});
  const [isEditingObservacao, setIsEditingObservacao] = useState({});
  const [dataInput, setDataInput] = useState('');
  const [filtroData, setFiltroData] = useState('');
  const [nomeInput, setNomeInput] = useState('');
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroStatus, setFiltroStatus] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [hasScheduledToday, setHasScheduledToday] = useState(false);

  useEffect(() => {
    const initialObservacoes = {};
    const initialIsEditingObservacao = {};
    leads.forEach(lead => {
      initialObservacoes[lead.id] = lead.observacao || '';
      initialIsEditingObservacao[lead.id] = !lead.observacao || lead.observacao.trim() === '';
    });
    setObservacoes(initialObservacoes);
    setIsEditingObservacao(initialIsEditingObservacao);
  }, [leads]);

  useEffect(() => {
    const today = new Date();
    const todayFormatted = today.toLocaleDateString('pt-BR');

    const todayAppointments = leads.filter(lead => {
      if (!lead.status.startsWith('Agendado')) return false;
      const statusDateStr = lead.status.split(' - ')[1];
      if (!statusDateStr) return false;

      const [dia, mes, ano] = statusDateStr.split('/');
      const statusDate = new Date(`${ano}-${mes}-${dia}T00:00:00`);
      const statusDateFormatted = statusDate.toLocaleDateString('pt-BR');

      return statusDateFormatted === todayFormatted;
    });

    setHasScheduledToday(todayAppointments.length > 0);
  }, [leads]);

  const handleRefreshLeads = async () => {
    setIsLoading(true);
    try {
      await fetchLeadsFromSheet();
      const refreshedIsEditingObservacao = {};
      leads.forEach(lead => {
        refreshedIsEditingObservacao[lead.id] = !lead.observacao || lead.observacao.trim() === '';
      });
      setIsEditingObservacao(refreshedIsEditingObservacao);
    } catch (error) {
      console.error('Erro ao buscar leads atualizados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const leadsPorPagina = 10;

  const normalizarTexto = (texto = '') => {
    return texto
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const aplicarFiltroData = () => {
    setFiltroData(dataInput);
    setFiltroNome('');
    setNomeInput('');
    setFiltroStatus(null);
    setPaginaAtual(1);
  };

  const aplicarFiltroNome = () => {
    const filtroLimpo = nomeInput.trim();
    setFiltroNome(filtroLimpo);
    setFiltroData('');
    setDataInput('');
    setFiltroStatus(null);
    setPaginaAtual(1);
  };
  
  const aplicarFiltroStatus = (status) => {
    setFiltroStatus(status);
    setFiltroNome('');
    setNomeInput('');
    setFiltroData('');
    setDataInput('');
    setPaginaAtual(1);
  };

  const isSameMonthAndYear = (leadDateStr, filtroMesAno) => {
    if (!filtroMesAno) return true;
    if (!leadDateStr) return false;
    const leadData = new Date(leadDateStr);
    const leadAno = leadData.getFullYear();
    const leadMes = String(leadData.getMonth() + 1).padStart(2, '0');
    return filtroMesAno === `${leadAno}-${leadMes}`;
  };

  const nomeContemFiltro = (leadNome, filtroNome) => {
    if (!filtroNome) return true;
    if (!leadNome) return false;
    const nomeNormalizado = normalizarTexto(leadNome);
    const filtroNormalizado = normalizarTexto(filtroNome);
    return nomeNormalizado.includes(filtroNormalizado);
  };

  const gerais = leads.filter((lead) => {
    if (lead.status === 'Fechado' || lead.status === 'Perdido') return false;

    if (filtroStatus) {
      if (filtroStatus === 'Agendado') {
        const today = new Date();
        const todayFormatted = today.toLocaleDateString('pt-BR');
        const statusDateStr = lead.status.split(' - ')[1];
        if (!statusDateStr) return false;
        const [dia, mes, ano] = statusDateStr.split('/');
        const statusDate = new Date(`${ano}-${mes}-${dia}T00:00:00`);
        const statusDateFormatted = statusDate.toLocaleDateString('pt-BR');
        return lead.status.startsWith('Agendado') && statusDateFormatted === todayFormatted;
      }
      return lead.status === filtroStatus;
    }

    if (filtroData) {
      const leadMesAno = lead.createdAt ? lead.createdAt.substring(0, 7) : '';
      return leadMesAno === filtroData;
    }

    if (filtroNome) {
      return nomeContemFiltro(lead.name, filtroNome);
    }

    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(gerais.length / leadsPorPagina));
  const paginaCorrigida = Math.min(paginaAtual, totalPaginas);
  const usuariosAtivos = usuarios.filter((u) => u.status === 'Ativo');
  const isAdmin = usuarioLogado?.tipo === 'Admin';

  const handleSelect = (leadId, userId) => {
    setSelecionados((prev) => ({
      ...prev,
      [leadId]: Number(userId),
    }));
  };

  const handleEnviar = (leadId) => {
    const userId = selecionados[leadId];
    if (!userId) {
      alert('Selecione um usuário antes de enviar.');
      return;
    }
    transferirLead(leadId, userId);
    const lead = leads.find((l) => l.id === leadId);
    const leadAtualizado = { ...lead, usuarioId: userId };
    enviarLeadAtualizado(leadAtualizado);
  };

  const enviarLeadAtualizado = async (lead) => {
    try {
      await fetch(ALTERAR_ATRIBUIDO_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(lead),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      fetchLeadsFromSheet();
    } catch (error) {
      console.error('Erro ao enviar lead:', error);
    }
  };

  const handleAlterar = (leadId) => {
    setSelecionados((prev) => ({
      ...prev,
      [leadId]: '',
    }));
    transferirLead(leadId, null);
  };

  const inicio = (paginaCorrigida - 1) * leadsPorPagina;
  const fim = inicio + leadsPorPagina;
  const leadsPagina = gerais.slice(inicio, fim);

  // Função para rolar o contêiner principal para o topo
  const scrollToTop = () => {
    if (scrollContainerRef && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const handlePaginaAnterior = () => {
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
    scrollToTop();
  };

  const handlePaginaProxima = () => {
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));
    scrollToTop();
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return '';
    let data;
    if (dataStr.includes('/')) {
        const partes = dataStr.split('/');
        data = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
    } else if (dataStr.includes('-') && dataStr.length === 10) {
        const partes = dataStr.split('-');
        data = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
    } else {
        data = new Date(dataStr);
    }

    if (isNaN(data.getTime())) {
        return '';
    }
    return data.toLocaleDateString('pt-BR');
  };

  const handleObservacaoChange = (leadId, text) => {
    setObservacoes((prev) => ({
      ...prev,
      [leadId]: text,
    }));
  };

  const handleSalvarObservacao = async (leadId) => {
    const observacaoTexto = observacoes[leadId] || '';
    if (!observacaoTexto.trim()) {
      alert('Por favor, digite uma observação antes de salvar.');
      return;
    }

    setIsLoading(true);
    try {
      await fetch(SALVAR_OBSERVACAO_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          leadId: leadId,
          observacao: observacaoTexto,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      setIsEditingObservacao(prev => ({ ...prev, [leadId]: false }));
      fetchLeadsFromSheet();
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
      alert('Erro ao salvar observação. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlterarObservacao = (leadId) => {
    setIsEditingObservacao(prev => ({ ...prev, [leadId]: true }));
  };

  const handleConfirmStatus = (leadId, novoStatus, phone) => {
    onUpdateStatus(leadId, novoStatus, phone);
    const currentLead = leads.find(l => l.id === leadId);
    const hasNoObservacao = !currentLead.observacao || currentLead.observacao.trim() === '';

    if ((novoStatus === 'Em Contato' || novoStatus === 'Sem Contato' || novoStatus.startsWith('Agendado')) && hasNoObservacao) {
        setIsEditingObservacao(prev => ({ ...prev, [leadId]: true }));
    } else if (novoStatus === 'Em Contato' || novoStatus === 'Sem Contato' || novoStatus.startsWith('Agendado')) {
        setIsEditingObservacao(prev => ({ ...prev, [leadId]: false }));
    } else {
        setIsEditingObservacao(prev => ({ ...prev, [leadId]: false }));
    }
    fetchLeadsFromSheet();
  };

  return (
    <div style={{ 
      padding: '20px', 
      position: 'relative', 
      minHeight: 'calc(100vh - 100px)', 
      backgroundColor: '#f8f9fa' // Cor de fundo suave
    }}>
      {isLoading && (
        <div className="absolute inset-0 bg-white flex justify-center items-center z-10" style={{ opacity: 0.8, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="ml-4 text-lg text-gray-700" style={{ marginLeft: '16px', fontSize: '1.125rem', color: '#495057' }}>Carregando LEADS...</p>
        </div>
      )}

      {/* --- Cabeçalho e Filtros Principais --- */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          gap: '15px', // Aumentei o gap
          flexWrap: 'wrap',
          backgroundColor: '#fff',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        {/* Título e Botão de Atualizar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ margin: 0, color: '#343a40', fontSize: '1.5rem' }}>Gestão de Leads</h1>
          <button
            title='Clique para atualizar os dados'
            onClick={handleRefreshLeads}
            disabled={isLoading}
            style={{
              background: 'none',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#007bff',
              transition: 'transform 0.2s',
              transform: isLoading ? 'rotate(360deg)' : 'rotate(0deg)',
            }}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite', height: '20px', width: '20px', color: '#4f46e5' }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <RefreshCcw size={22} />
            )}
          </button>
        </div>

        {/* Filtro por Nome */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <input
            type="text"
            placeholder="Filtrar por nome"
            value={nomeInput}
            onChange={(e) => setNomeInput(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ced4da',
              width: '200px',
              maxWidth: '100%',
              fontSize: '14px',
            }}
            title="Filtrar leads pelo nome (contém)"
          />
          <button
            onClick={aplicarFiltroNome}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontWeight: '600',
              transition: 'background-color 0.2s',
            }}
          >
            Filtrar
          </button>
        </div>
        
        {/* Filtro por Data */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <input
            type="month"
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ced4da',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            title="Filtrar leads pelo mês e ano de criação"
          />
          <button
            onClick={aplicarFiltroData}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 14px',
              cursor: 'pointer',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              transition: 'background-color 0.2s',
            }}
          >
            Filtrar
          </button>
        </div>

        {/* Notificação de Agendamento (Sino e Bolha) */}
        {hasScheduledToday && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              flex: '1 1 auto', // Permite que ele cresça se houver espaço, mas fica alinhado à direita
              minWidth: '100px',
            }}
          >
            <div
              style={{
                position: 'relative',
                cursor: 'pointer',
                marginLeft: 'auto', // Empurra para a direita
              }}
              onClick={() => setShowNotification(!showNotification)}
              title="Você tem agendamentos para hoje!"
            >
              <Bell size={32} color="#dc3545" style={{ filter: 'drop-shadow(0 0 5px rgba(220, 53, 69, 0.5))' }} />
              <div
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 0 5px rgba(0,0,0,0.2)',
                  animation: 'pulse 1s infinite', // Adicionado animação
                }}
              >
                1
              </div>
              {showNotification && (
                <div
                  style={{
                    position: 'absolute',
                    top: '45px',
                    right: '0', // Alinhado à direita do sino
                    width: '280px', // Aumentei a largura
                    backgroundColor: 'white',
                    border: '1px solid #007bff', // Cor da borda azul
                    borderRadius: '8px',
                    padding: '15px',
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)', // Sombra mais proeminente
                    zIndex: 20, // ZIndex maior
                    fontSize: '14px',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#007bff' }}>🔔 Atenção!</p>
                  <p style={{ margin: '5px 0 0 0' }}>Você tem **agendamentos** de leads para hoje. Verifique a lista!</p>
                </div>
              )}
            </div>
            {/* Adicionar estilo para o efeito pulse (necessário CSS global ou styled-components, mas vou simular o que for possível com JS inline) */}
            <style>
              {`
                @keyframes pulse {
                  0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.4); }
                  70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
                  100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
                }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              `}
            </style>
          </div>
        )}
      </div>
      
      {/* --- Botões de Status (Filtros Rápidos) --- */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          marginBottom: '20px',
          padding: '10px 0',
          flexWrap: 'wrap',
          borderBottom: '1px solid #dee2e6', // Linha divisória
        }}
      >
        <button
          onClick={() => aplicarFiltroStatus('Em Contato')}
          style={{
            padding: '10px 20px',
            backgroundColor: filtroStatus === 'Em Contato' ? '#e67e22' : '#f39c12', // Laranja
            color: 'white',
            border: 'none',
            borderRadius: '20px', // Mais arredondado
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: filtroStatus === 'Em Contato' ? '0 3px 5px rgba(0,0,0,0.2), inset 0 0 5px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.3s',
            minWidth: '120px',
          }}
          title="Ver leads em primeiro contato"
        >
          Em Contato
        </button>

        <button
          onClick={() => aplicarFiltroStatus('Sem Contato')}
          style={{
            padding: '10px 20px',
            backgroundColor: filtroStatus === 'Sem Contato' ? '#7f8c8d' : '#95a5a6', // Cinza
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: filtroStatus === 'Sem Contato' ? '0 3px 5px rgba(0,0,0,0.2), inset 0 0 5px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.3s',
            minWidth: '120px',
          }}
          title="Ver leads sem sucesso no contato"
        >
          Sem Contato
        </button>

        {hasScheduledToday && (
          <button
            onClick={() => aplicarFiltroStatus('Agendado')}
            style={{
              padding: '10px 20px',
              backgroundColor: filtroStatus === 'Agendado' ? '#1a75b9' : '#3498db', // Azul
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: filtroStatus === 'Agendado' ? '0 3px 5px rgba(0,0,0,0.2), inset 0 0 5px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.3s',
              minWidth: '120px',
            }}
            title="Ver leads agendados para hoje"
          >
            Agendados
          </button>
        )}
      </div>

      {/* --- Lista de Leads --- */}
      {isLoading ? (
        null
      ) : gerais.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '1.1rem', color: '#6c757d' }}>Não há leads pendentes para os filtros aplicados. 🎉</p>
        </div>
      ) : (
        <>
          {leadsPagina.map((lead) => {
            const responsavel = usuarios.find((u) => u.nome === lead.responsavel);

            return (
              <div
                key={lead.id}
                style={{
                  border: '1px solid #e9ecef',
                  borderRadius: '10px',
                  padding: '20px', // Aumentei o padding
                  marginBottom: '20px', // Aumentei a margem
                  position: 'relative',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  backgroundColor: '#fff',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.08)', // Sombra leve para destaque
                }}
              >
                {/* Informações do Lead (Lead Component - Presume-se que o estilo está nele ou Tailwind) */}
                <div style={{ flex: '1 1 55%', minWidth: '320px' }}>
                  <Lead
                    lead={lead}
                    onUpdateStatus={handleConfirmStatus}
                    disabledConfirm={!lead.responsavel}
                  />
                </div>

                {/* Área de Observações e Transferência - Flex Container */}
                <div style={{ flex: '1 1 40%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  
                  {/* Observações */}
                  {(lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status.startsWith('Agendado')) && (
                    <div style={{ padding: '10px', border: '1px solid #f0f0f0', borderRadius: '8px', backgroundColor: '#fcfcfc' }}>
                      <label htmlFor={`observacao-${lead.id}`} style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#007bff', fontSize: '1rem' }}>
                        ✍️ Observações:
                      </label>
                      <textarea
                        id={`observacao-${lead.id}`}
                        value={observacoes[lead.id] || ''}
                        onChange={(e) => handleObservacaoChange(lead.id, e.target.value)}
                        placeholder="Adicione suas observações aqui..."
                        rows="4"
                        disabled={!isEditingObservacao[lead.id]}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '6px',
                          border: `1px solid ${isEditingObservacao[lead.id] ? '#007bff' : '#ced4da'}`,
                          resize: 'vertical',
                          boxSizing: 'border-box',
                          backgroundColor: isEditingObservacao[lead.id] ? '#e9f7ff' : '#f8f9fa',
                          cursor: isEditingObservacao[lead.id] ? 'text' : 'default',
                          fontSize: '14px',
                          transition: 'border-color 0.3s, background-color 0.3s',
                        }}
                      ></textarea>
                      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                        {isEditingObservacao[lead.id] ? (
                          <button
                            onClick={() => handleSalvarObservacao(lead.id)}
                            disabled={isLoading}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#28a745', // Verde de sucesso
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: isLoading ? 'not-allowed' : 'pointer',
                              fontWeight: 'bold',
                              transition: 'background-color 0.2s',
                              opacity: isLoading ? 0.6 : 1,
                            }}
                          >
                            Salvar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAlterarObservacao(lead.id)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#ffc107', // Amarelo de alerta
                              color: '#000',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              transition: 'background-color 0.2s',
                            }}
                          >
                            Alterar
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Transferência de Lead */}
                  <div style={{ padding: '10px', border: '1px solid #e9ecef', borderRadius: '8px', backgroundColor: '#fcfcfc' }}>
                    {lead.responsavel && responsavel ? (
                      <div>
                        <p style={{ color: '#28a745', fontWeight: 'bold', margin: '5px 0' }}>
                          ✅ Transferido para <strong>{responsavel.nome}</strong>
                        </p>
                        {isAdmin && (
                          <button
                            onClick={() => handleAlterar(lead.id)}
                            style={{
                              marginTop: '8px',
                              padding: '6px 14px',
                              backgroundColor: '#dc3545', // Vermelho para Alterar/Remover
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              transition: 'background-color 0.2s',
                            }}
                            title="Remover atribuição do lead"
                          >
                            Alterar/Remover Atribuição
                          </button>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <select
                          value={selecionados[lead.id] || ''}
                          onChange={(e) => handleSelect(lead.id, e.target.value)}
                          style={{
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #ced4da',
                            flex: '1 1 auto',
                            minWidth: '150px',
                            fontSize: '14px',
                          }}
                          title="Selecione o usuário para transferir o lead"
                        >
                          <option value="">Selecione usuário ativo</option>
                          {usuariosAtivos.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nome}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleEnviar(lead.id)}
                          disabled={!selecionados[lead.id] || isLoading}
                          style={{
                            padding: '8px 14px',
                            backgroundColor: '#007bff', // Azul primário para Enviar
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: (!selecionados[lead.id] || isLoading) ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            transition: 'background-color 0.2s',
                            opacity: (!selecionados[lead.id] || isLoading) ? 0.6 : 1,
                          }}
                        >
                          Enviar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Data de Criação - Canto Inferior Direito */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '20px',
                    fontSize: '11px',
                    color: '#888',
                    fontStyle: 'italic',
                    backgroundColor: '#fff',
                    padding: '2px 5px',
                    borderRadius: '3px',
                  }}
                  title={`Criado em: ${formatarData(lead.createdAt)}`}
                >
                  Criado em: {formatarData(lead.createdAt)}
                </div>
              </div>
            );
          })}

          {/* --- Paginação --- */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '15px',
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 -2px 4px rgba(0,0,0,0.05)',
            }}
          >
            <button
              onClick={handlePaginaAnterior}
              disabled={paginaCorrigida <= 1 || isLoading}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                cursor: (paginaCorrigida <= 1 || isLoading) ? 'not-allowed' : 'pointer',
                backgroundColor: (paginaCorrigida <= 1 || isLoading) ? '#e9ecef' : '#f8f9fa',
                color: '#495057',
                fontWeight: '600',
                transition: 'background-color 0.2s',
              }}
            >
              Anterior
            </button>
            <span style={{ alignSelf: 'center', fontSize: '1rem', color: '#343a40' }}>
              Página <strong style={{ color: '#007bff' }}>{paginaCorrigida}</strong> de <strong style={{ color: '#007bff' }}>{totalPaginas}</strong>
            </span>
            <button
              onClick={handlePaginaProxima}
              disabled={paginaCorrigida >= totalPaginas || isLoading}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #ced4da',
                cursor: (paginaCorrigida >= totalPaginas || isLoading) ? 'not-allowed' : 'pointer',
                backgroundColor: (paginaCorrigida >= totalPaginas || isLoading) ? '#e9ecef' : '#f8f9fa',
                color: '#495057',
                fontWeight: '600',
                transition: 'background-color 0.2s',
              }}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Leads;
