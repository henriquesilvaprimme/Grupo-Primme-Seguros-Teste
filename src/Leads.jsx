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
      backgroundColor: '#f4f7f9' // Fundo mais claro
    }}>
      {/* Estilo para a animação de loading */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .animate-spin { animation: spin 1s linear infinite; }
          
          @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
          }
          .animate-pulse-bell { animation: pulse 1s infinite; }
        `}
      </style>

      {/* Tela de Loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-white flex justify-center items-center z-10" style={{ 
          opacity: 0.9, 
          position: 'fixed', // Fixed para cobrir tudo
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0 
        }}>
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-indigo-500" style={{ 
            animation: 'spin 1s linear infinite', 
            borderColor: '#4f46e5', 
            borderTopColor: 'transparent' 
          }}></div>
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
          gap: '15px',
          flexWrap: 'wrap',
          backgroundColor: '#ffffff',
          padding: '15px',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', // Sombra para o cabeçalho
          border: '1px solid #e0e0e0'
        }}
      >
        {/* Título e Botão de Atualizar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ margin: 0, color: '#333333', fontSize: '1.8rem' }}>Leads</h1>
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
              transition: 'transform 0.5s',
              transform: isLoading ? 'rotate(360deg)' : 'rotate(0deg)',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            <RefreshCcw size={24} style={{ color: '#007bff' }}/>
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
              width: '180px',
              maxWidth: '100%',
              fontSize: '14px',
            }}
            title="Filtrar leads pelo nome (contém)"
          />
          <button
            onClick={aplicarFiltroNome}
            style={{
              backgroundColor: '#343a40', // Cor escura para filtros
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
              backgroundColor: '#343a40', // Cor escura para filtros
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
              flex: '1 1 auto',
              minWidth: '60px',
            }}
          >
            <div
              style={{
                position: 'relative',
                cursor: 'pointer',
                marginLeft: 'auto',
                padding: '5px',
              }}
              onClick={() => setShowNotification(!showNotification)}
              title="Você tem agendamentos para hoje!"
            >
              <Bell size={28} color="#dc3545" />
              <div
                className="animate-pulse-bell"
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '0px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 0 5px rgba(0,0,0,0.2)',
                }}
              >
                1
              </div>
              {showNotification && (
                <div
                  style={{
                    position: 'absolute',
                    top: '40px',
                    right: '0',
                    width: '250px',
                    backgroundColor: 'white',
                    border: '1px solid #007bff',
                    borderRadius: '8px',
                    padding: '15px',
                    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
                    zIndex: 20,
                    fontSize: '14px',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#dc3545' }}>🔔 Agendamentos Hoje!</p>
                  <p style={{ margin: '5px 0 0 0' }}>Você tem **leads agendados** para hoje. Não se esqueça!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* --- Botões de Status (Filtros Rápidos) --- */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          marginBottom: '25px',
          padding: '15px',
          flexWrap: 'wrap',
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          border: '1px solid #e0e0e0'
        }}
      >
        <button
          onClick={() => aplicarFiltroStatus('Em Contato')}
          style={{
            padding: '10px 20px',
            backgroundColor: filtroStatus === 'Em Contato' ? '#e67e22' : '#f39c12',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: filtroStatus === 'Em Contato' ? 'inset 0 0 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.3s',
            minWidth: '130px',
            fontSize: '1rem',
          }}
          title="Ver leads em primeiro contato"
        >
          Em Contato
        </button>

        <button
          onClick={() => aplicarFiltroStatus('Sem Contato')}
          style={{
            padding: '10px 20px',
            backgroundColor: filtroStatus === 'Sem Contato' ? '#7f8c8d' : '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: filtroStatus === 'Sem Contato' ? 'inset 0 0 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.3s',
            minWidth: '130px',
            fontSize: '1rem',
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
              backgroundColor: filtroStatus === 'Agendado' ? '#1a75b9' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: filtroStatus === 'Agendado' ? 'inset 0 0 8px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.3s',
              minWidth: '130px',
              fontSize: '1rem',
            }}
            title="Ver leads agendados para hoje"
          >
            Agendados Hoje
          </button>
        )}
      </div>

      {/* --- Lista de Leads --- */}
      {isLoading ? (
        null
      ) : gerais.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
          <p style={{ fontSize: '1.2rem', color: '#6c757d' }}>Não há leads pendentes para os filtros aplicados. 🎉</p>
        </div>
      ) : (
        <>
          {leadsPagina.map((lead) => {
            const responsavel = usuarios.find((u) => u.nome === lead.responsavel);

            return (
              <div
                key={lead.id}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '10px',
                  padding: '20px',
                  marginBottom: '15px',
                  position: 'relative',
                  display: 'flex',
                  gap: '20px',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                }}
              >
                {/* Informações do Lead (Lead Component) */}
                <div style={{ flex: '1 1 50%', minWidth: '300px' }}>
                  <Lead
                    lead={lead}
                    onUpdateStatus={handleConfirmStatus}
                    disabledConfirm={!lead.responsavel}
                  />
                </div>

                {/* Observações e Transferência - Flex Container */}
                <div style={{ flex: '1 1 45%', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  
                  {/* Observações */}
                  {(lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status.startsWith('Agendado')) && (
                    <div style={{ padding: '10px', border: '1px solid #f0f0f0', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                      <label htmlFor={`observacao-${lead.id}`} style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#495057', fontSize: '0.9rem' }}>
                        ✍️ Observações:
                      </label>
                      <textarea
                        id={`observacao-${lead.id}`}
                        value={observacoes[lead.id] || ''}
                        onChange={(e) => handleObservacaoChange(lead.id, e.target.value)}
                        placeholder="Adicione suas observações aqui..."
                        rows="3"
                        disabled={!isEditingObservacao[lead.id]}
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '4px',
                          border: `1px solid ${isEditingObservacao[lead.id] ? '#007bff' : '#ced4da'}`,
                          resize: 'vertical',
                          boxSizing: 'border-box',
                          backgroundColor: isEditingObservacao[lead.id] ? '#ffffff' : '#f0f0f0',
                          cursor: isEditingObservacao[lead.id] ? 'text' : 'default',
                          fontSize: '13px',
                        }}
                      ></textarea>
                      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                        {isEditingObservacao[lead.id] ? (
                          <button
                            onClick={() => handleSalvarObservacao(lead.id)}
                            disabled={isLoading}
                            style={{
                              padding: '6px 14px',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: isLoading ? 'not-allowed' : 'pointer',
                              fontWeight: '600',
                              transition: 'background-color 0.2s',
                            }}
                          >
                            Salvar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAlterarObservacao(lead.id)}
                            style={{
                              padding: '6px 14px',
                              backgroundColor: '#ffc107',
                              color: '#000',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '600',
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
                  <div style={{ padding: '10px', border: '1px solid #f0f0f0', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                    {lead.responsavel && responsavel ? (
                      <div>
                        <p style={{ color: '#28a745', fontWeight: 'bold', margin: '5px 0' }}>
                          ✅ Atribuído a <strong>{responsavel.nome}</strong>
                        </p>
                        {isAdmin && (
                          <button
                            onClick={() => handleAlterar(lead.id)}
                            style={{
                              marginTop: '8px',
                              padding: '6px 12px',
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              transition: 'background-color 0.2s',
                            }}
                            title="Remover atribuição do lead"
                          >
                            Alterar Atribuição
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
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: (!selecionados[lead.id] || isLoading) ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            transition: 'background-color 0.2s',
                            opacity: (!selecionados[lead.id] || isLoading) ? 0.8 : 1,
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
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              boxShadow: '0 -2px 5px rgba(0,0,0,0.05)',
              border: '1px solid #e0e0e0'
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
