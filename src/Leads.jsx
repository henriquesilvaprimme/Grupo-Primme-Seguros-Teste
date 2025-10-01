import React, { useState, useEffect, useRef } from 'react';
import Lead from './components/Lead';
import { RefreshCcw, Bell } from 'lucide-react';

// URLS DE SCRIPT (Mantidas conforme o código fornecido)
const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';
const ALTERAR_ATRIBUIDO_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=alterar_atribuido';
const SALVAR_OBSERVACAO_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?action=salvarObservacao';

const Leads = ({ leads, usuarios, onUpdateStatus, transferirLead, usuarioLogado, fetchLeadsFromSheet, scrollContainerRef }) => {
  // --- Estados ---
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

  // --- Efeitos ---

  // Inicializa observações e estado de edição
  useEffect(() => {
    const initialObservacoes = {};
    const initialIsEditingObservacao = {};
    leads.forEach(lead => {
      initialObservacoes[lead.id] = lead.observacao || '';
      // Começa editando se a observação estiver vazia
      initialIsEditingObservacao[lead.id] = !lead.observacao || lead.observacao.trim() === '';
    });
    setObservacoes(initialObservacoes);
    setIsEditingObservacao(initialIsEditingObservacao);
  }, [leads]);

  // Verifica se há agendamentos para hoje
  useEffect(() => {
    const today = new Date();
    // Ajusta para o fuso horário local para comparação de data
    const todayFormatted = today.toLocaleDateString('pt-BR');

    const todayAppointments = leads.filter(lead => {
      if (!lead.status.startsWith('Agendado')) return false;
      const statusDateStr = lead.status.split(' - ')[1];
      if (!statusDateStr) return false;

      // Converte 'DD/MM/AAAA' para Date
      const [dia, mes, ano] = statusDateStr.split('/');
      const statusDate = new Date(`${ano}-${mes}-${dia}T00:00:00`);
      // Formata a data do status para comparação
      const statusDateFormatted = statusDate.toLocaleDateString('pt-BR');

      return statusDateFormatted === todayFormatted;
    });

    setHasScheduledToday(todayAppointments.length > 0);
  }, [leads]);

  // --- Constantes de Configuração e Dados Derivados ---
  const leadsPorPagina = 10;
  const usuariosAtivos = usuarios.filter((u) => u.status === 'Ativo');
  const isAdmin = usuarioLogado?.tipo === 'Admin';

  // --- Funções Auxiliares ---

  const normalizarTexto = (texto = '') => {
    return texto
      .toString()
      .toLowerCase()
      .normalize('NFD') // Remove acentos
      .replace(/[\u0300-\u036f]/g, '') // Remove caracteres diacríticos
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()@\+\?><\[\]\+]/g, '') // Remove pontuação
      .replace(/\s+/g, ' ') // Substitui múltiplos espaços por um
      .trim();
  };

  const nomeContemFiltro = (leadNome, filtroNome) => {
    if (!filtroNome) return true;
    if (!leadNome) return false;
    const nomeNormalizado = normalizarTexto(leadNome);
    const filtroNormalizado = normalizarTexto(filtroNome);
    return nomeNormalizado.includes(filtroNormalizado);
  };

  const formatarData = (dataStr) => {
    if (!dataStr) return '';
    let data;
    if (dataStr.includes('/') && dataStr.length === 10) {
        const partes = dataStr.split('/');
        // Cria a data no formato AAAA-MM-DD
        data = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
    } else if (dataStr.includes('-') && dataStr.length >= 10) {
        // Assume formato ISO YYYY-MM-DD
        const partes = dataStr.substring(0, 10).split('-');
        data = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
    } else {
        // Tenta criar a data de outras formas
        data = new Date(dataStr);
    }

    if (isNaN(data.getTime())) {
        return '';
    }
    return data.toLocaleDateString('pt-BR');
  };

  // Função para rolar o contêiner principal para o topo
  const scrollToTop = () => {
    if (scrollContainerRef && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // --- Funções de API/Ação ---

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
      fetchLeadsFromSheet(); // Recarrega para refletir a mudança
    } catch (error) {
      console.error('Erro ao enviar lead:', error);
    }
  };

  const handleRefreshLeads = async () => {
    setIsLoading(true);
    try {
      await fetchLeadsFromSheet();
      // Reinicializa o estado de edição após a atualização
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
      setIsEditingObservacao(prev => ({ ...prev, [leadId]: false })); // Desabilita edição
      fetchLeadsFromSheet(); // Recarrega para garantir a atualização
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
      alert('Erro ao salvar observação. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmStatus = (leadId, novoStatus, phone) => {
    onUpdateStatus(leadId, novoStatus, phone);
    const currentLead = leads.find(l => l.id === leadId);
    const hasNoObservacao = !currentLead.observacao || currentLead.observacao.trim() === '';

    // Se mudou para Em Contato, Sem Contato ou Agendado e não tem observação, habilita a edição.
    if ((novoStatus === 'Em Contato' || novoStatus === 'Sem Contato' || novoStatus.startsWith('Agendado')) && hasNoObservacao) {
        setIsEditingObservacao(prev => ({ ...prev, [leadId]: true }));
    } else if (novoStatus === 'Em Contato' || novoStatus === 'Sem Contato' || novoStatus.startsWith('Agendado')) {
        // Se mudou o status mas JÁ TINHA observação, mantém desabilitado
        setIsEditingObservacao(prev => ({ ...prev, [leadId]: false }));
    } else {
        // Para outros status (Ex: Pendente, Fechado, Perdido), desabilita a edição
        setIsEditingObservacao(prev => ({ ...prev, [leadId]: false }));
    }
    fetchLeadsFromSheet(); // Recarrega a lista para atualizar o status visualmente
  };

  // --- Funções de Manipulação de Estado/UI ---

  const handleObservacaoChange = (leadId, text) => {
    setObservacoes((prev) => ({
      ...prev,
      [leadId]: text,
    }));
  };

  const handleAlterarObservacao = (leadId) => {
    setIsEditingObservacao(prev => ({ ...prev, [leadId]: true }));
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
    // Cria um objeto de lead com o novo userId para a API
    const leadAtualizado = { ...lead, usuarioId: userId };
    enviarLeadAtualizado(leadAtualizado);
  };

  const handleAlterar = (leadId) => {
    setSelecionados((prev) => ({
      ...prev,
      [leadId]: '',
    }));
    transferirLead(leadId, null); // Remove a atribuição no estado local
  };

  const handlePaginaAnterior = () => {
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
    scrollToTop();
  };

  const handlePaginaProxima = () => {
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));
    scrollToTop();
  };

  // --- Lógica de Filtro Principal ---
  const gerais = leads.filter((lead) => {
    // 1. Filtro de status "Fechado" ou "Perdido" (sempre excluídos)
    if (lead.status === 'Fechado' || lead.status === 'Perdido') return false;

    // 2. Filtro de Status (botões)
    if (filtroStatus) {
      if (filtroStatus === 'Agendado') {
        // Lógica para filtrar Agendados de HOJE
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

    // 3. Filtro de Data (mês/ano de criação)
    if (filtroData) {
      const leadMesAno = lead.createdAt ? lead.createdAt.substring(0, 7) : ''; // Ex: '2025-09'
      return leadMesAno === filtroData;
    }

    // 4. Filtro de Nome
    if (filtroNome) {
      return nomeContemFiltro(lead.name, filtroNome);
    }

    // Se nenhum filtro aplicado, inclui o lead (desde que não seja Fechado/Perdido)
    return true;
  });

  // --- Lógica de Paginação ---
  const totalPaginas = Math.max(1, Math.ceil(gerais.length / leadsPorPagina));
  const paginaCorrigida = Math.min(paginaAtual, totalPaginas); // Garante que a página atual não exceda o total
  const inicio = (paginaCorrigida - 1) * leadsPorPagina;
  const fim = inicio + leadsPorPagina;
  const leadsPagina = gerais.slice(inicio, fim); // Leads a serem exibidos na página atual

  // --- Renderização ---
  return (
    <div style={{ padding: '20px', position: 'relative', minHeight: 'calc(100vh - 100px)' }}>
      {/* Overlay de Carregamento */}
      {isLoading && (
        <div className="absolute inset-0 bg-white flex justify-center items-center z-10" style={{ opacity: 0.8 }}>
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="ml-4 text-lg text-gray-700">Carregando LEADS...</p>
        </div>
      )}

      {/* Cabeçalho e Filtros */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '15px',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        {/* Título e Botão de Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0 }}>Leads</h1>
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
              color: '#007bff'
            }}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <RefreshCcw size={20} />
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
          <button
            onClick={aplicarFiltroNome}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Filtrar
          </button>
          <input
            type="text"
            placeholder="Filtrar por nome"
            value={nomeInput}
            onChange={(e) => setNomeInput(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              width: '220px',
              maxWidth: '100%',
            }}
            title="Filtrar leads pelo nome (contém)"
          />
        </div>

        {/* Sinal de Notificação para Agendamentos de Hoje */}
        {hasScheduledToday && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                position: 'relative',
                cursor: 'pointer'
              }}
              onClick={() => setShowNotification(!showNotification)}
            >
              <Bell size={32} color="#007bff" />
              {/* Bolha de Notificação */}
              <div
                style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px', 
                  backgroundColor: 'red',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 0 5px rgba(0,0,0,0.5)',
                }}
                title="Você tem agendamentos para hoje"
              >
                1
              </div>
              {/* Tooltip/Mensagem de Notificação */}
              {showNotification && (
                <div
                  style={{
                    position: 'absolute',
                    top: '40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '250px',
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '15px',
                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                    zIndex: 10,
                    textAlign: 'center',
                  }}
                >
                  <p style={{ margin: 0 }}>Você tem **agendamentos hoje**! 📅</p>
                  <p style={{ margin: '5px 0 0', fontSize: '0.9em', color: '#555' }}>Clique no filtro "Agendados" para ver.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filtro por Data (Mês/Ano) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
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
          <input
            type="month"
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              cursor: 'pointer',
            }}
            title="Filtrar leads pelo mês e ano de criação"
          />
        </div>
      </div>

      {/* Filtros Rápidos de Status */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '15px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => aplicarFiltroStatus('Em Contato')}
          style={{
            padding: '8px 16px',
            backgroundColor: filtroStatus === 'Em Contato' ? '#e67e22' : '#f39c12',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: filtroStatus === 'Em Contato' ? 'inset 0 0 5px rgba(0,0,0,0.3)' : 'none',
            transition: 'background-color 0.2s',
          }}
        >
          Em Contato
        </button>

        <button
          onClick={() => aplicarFiltroStatus('Sem Contato')}
          style={{
            padding: '8px 16px',
            backgroundColor: filtroStatus === 'Sem Contato' ? '#7f8c8d' : '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: filtroStatus === 'Sem Contato' ? 'inset 0 0 5px rgba(0,0,0,0.3)' : 'none',
            transition: 'background-color 0.2s',
          }}
        >
          Sem Contato
        </button>

        {/* Botão de Agendados de Hoje - aparece apenas se houver agendamentos */}
        {hasScheduledToday && (
          <button
            onClick={() => aplicarFiltroStatus('Agendado')}
            style={{
              padding: '8px 16px',
              backgroundColor: filtroStatus === 'Agendado' ? '#2980b9' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: filtroStatus === 'Agendado' ? 'inset 0 0 5px rgba(0,0,0,0.3)' : 'none',
              transition: 'background-color 0.2s',
            }}
          >
            Agendados Hoje 🔔
          </button>
        )}
      </div>

      {/* Lista de Leads */}
      {isLoading ? (
        null // O spinner já está no overlay
      ) : gerais.length === 0 ? (
        <p style={{ textAlign: 'center', fontSize: '1.1em', marginTop: '30px' }}>
          Não há leads pendentes para os filtros aplicados.
        </p>
      ) : (
        <>
          {leadsPagina.map((lead) => {
            const responsavel = usuarios.find((u) => u.nome === lead.responsavel);

            return (
              <div
                key={lead.id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px',
                  position: 'relative',
                  display: 'flex',
                  gap: '20px', // Aumentei o gap para melhor espaçamento
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  backgroundColor: '#f9f9f9', // Levemente cinza para destaque
                }}
              >
                {/* Informações do Lead (Componente Lead) */}
                <div style={{ flex: '1 1 50%', minWidth: '300px' }}>
                  <Lead
                    lead={lead}
                    onUpdateStatus={handleConfirmStatus}
                    disabledConfirm={!lead.responsavel}
                  />
                </div>

                {/* Seção de Observações */}
                {(lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status.startsWith('Agendado')) && (
                  <div style={{ flex: '1 1 45%', minWidth: '280px', borderLeft: '1px dashed #ddd', paddingLeft: '20px' }}>
                    <label htmlFor={`observacao-${lead.id}`} style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
                      📝 Observações:
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
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        backgroundColor: isEditingObservacao[lead.id] ? '#fff' : '#e9ecef',
                        cursor: isEditingObservacao[lead.id] ? 'text' : 'default',
                        transition: 'background-color 0.2s',
                      }}
                    ></textarea>
                    {isEditingObservacao[lead.id] ? (
                      <button
                        onClick={() => handleSalvarObservacao(lead.id)}
                        disabled={isLoading}
                        style={{
                          marginTop: '10px',
                          padding: '8px 16px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        Salvar Observação
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAlterarObservacao(lead.id)}
                        style={{
                          marginTop: '10px',
                          padding: '8px 16px',
                          backgroundColor: '#ffc107',
                          color: '#000',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                        }}
                      >
                        Alterar Observação
                      </button>
                    )}
                  </div>
                )}

                {/* Seção de Atribuição */}
                <div style={{ width: '100%', borderTop: '1px dashed #eee', paddingTop: '10px', marginTop: '10px' }}>
                  {lead.responsavel && responsavel ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <p style={{ color: '#28a745', margin: 0, fontWeight: 'bold' }}>
                        ✅ Transferido para <strong>{responsavel.nome}</strong>
                      </p>
                      {isAdmin && (
                        <button
                          onClick={() => handleAlterar(lead.id)}
                          style={{
                            padding: '5px 12px',
                            backgroundColor: '#dc3545', // Cor de perigo (vermelho) para Alterar
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
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
                        justifyContent: 'flex-start'
                      }}
                    >
                      <span style={{ fontWeight: 'bold', color: '#555' }}>Atribuir Lead:</span>
                      <select
                        value={selecionados[lead.id] || ''}
                        onChange={(e) => handleSelect(lead.id, e.target.value)}
                        style={{
                          padding: '5px',
                          borderRadius: '4px',
                          border: '1px solid #ccc',
                          minWidth: '200px',
                        }}
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
                        disabled={!selecionados[lead.id]}
                        style={{
                          padding: '5px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: selecionados[lead.id] ? 'pointer' : 'not-allowed',
                          opacity: selecionados[lead.id] ? 1 : 0.6,
                        }}
                      >
                        Enviar
                      </button>
                    </div>
                  )}
                </div>

                {/* Data de Criação no canto inferior direito */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '15px',
                    fontSize: '12px',
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

          {/* Controles de Paginação */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              marginTop: '30px',
              marginBottom: '30px', // Adicionei um margin-bottom para o final da página
            }}
          >
            <button
              onClick={handlePaginaAnterior}
              disabled={paginaCorrigida <= 1 || isLoading}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #007bff',
                color: '#007bff',
                cursor: (paginaCorrigida <= 1 || isLoading) ? 'not-allowed' : 'pointer',
                backgroundColor: (paginaCorrigida <= 1 || isLoading) ? '#f0f0f0' : '#fff',
                fontWeight: 'bold',
              }}
            >
              &lt; Anterior
            </button>
            <span style={{ alignSelf: 'center', fontWeight: 'bold', color: '#333' }}>
              Página {paginaCorrigida} de {totalPaginas}
            </span>
            <button
              onClick={handlePaginaProxima}
              disabled={paginaCorrigida >= totalPaginas || isLoading}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #007bff',
                color: '#007bff',
                cursor: (paginaCorrigida >= totalPaginas || isLoading) ? 'not-allowed' : 'pointer',
                backgroundColor: (paginaCorrigida >= totalPaginas || isLoading) ? '#f0f0f0' : '#fff',
                fontWeight: 'bold',
              }}
            >
              Próxima &gt;
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Leads;
