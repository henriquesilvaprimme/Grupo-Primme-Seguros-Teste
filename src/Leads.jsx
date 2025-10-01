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
    <div style={{ padding: '20px', position: 'relative', minHeight: 'calc(100vh - 100px)' }}>
      {/* Overlay de Carregamento */}
      {isLoading && (
        <div className="absolute inset-0 bg-white flex justify-center items-center z-10" style={{ opacity: 0.8, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="ml-4 text-lg text-gray-700" style={{ marginLeft: '1rem', fontSize: '1.125rem', color: '#4a5568' }}>Carregando LEADS...</p>
        </div>
      )}

      {/* Cabeçalho e Filtros Principais */}
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
              <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ height: '1.25rem', width: '1.25rem', color: '#4c51bf' }}>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }}></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{ opacity: 0.75 }}></path>
              </svg>
            ) : (
              <RefreshCcw size={20} />
            )}
          </button>
        </div>

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

        {/* Contêiner da Notificação (Sino) */}
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
                }}
              >
                1
              </div>
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
                  }}
                >
                  <p style={{ margin: 0 }}>Você tem agendamentos hoje!</p>
                </div>
              )}
            </div>
          </div>
        )}

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

      {/* Botões de Filtro de Status */}
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
          }}
        >
          Sem Contato
        </button>

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
            }}
          >
            Agendados
          </button>
        )}
      </div>

      {isLoading ? (
        null
      ) : gerais.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: '30px', color: '#6c757d' }}>Não há leads pendentes para os filtros aplicados.</p>
      ) : (
        <>
          {/* Lista de Leads */}
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
                  gap: '20px', /* Ajustado para 20px para melhor espaçamento entre as colunas */
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                {/* Coluna de Detalhes do Lead/Ações de Status */}
                <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                  <Lead
                    lead={lead}
                    onUpdateStatus={handleConfirmStatus}
                    disabledConfirm={!lead.responsavel}
                  />
                </div>

                {/* Coluna de Observações (Condicional) */}
                {(lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status.startsWith('Agendado')) && (
                  <div style={{ flex: '1 1 45%', minWidth: '280px', borderLeft: '1px dashed #eee', paddingLeft: '20px' }}>
                    <label htmlFor={`observacao-${lead.id}`} style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                      Observações:
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
                        backgroundColor: isEditingObservacao[lead.id] ? '#fff' : '#f0f0f0',
                        cursor: isEditingObservacao[lead.id] ? 'text' : 'default',
                      }}
                    ></textarea>
                    {isEditingObservacao[lead.id] ? (
                      <button
                        onClick={() => handleSalvarObservacao(lead.id)}
                        style={{
                          marginTop: '10px',
                          padding: '8px 16px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
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

                {/* Linha completa para Transferência/Responsável */}
                <div style={{ flex: '1 1 100%', marginTop: '10px' }}>
                  {lead.responsavel && responsavel ? (
                    <div style={{ marginTop: '0px' }}>
                      <p style={{ color: '#28a745', margin: '0 0 5px 0' }}>
                        Transferido para <strong>{responsavel.nome}</strong>
                      </p>
                      {isAdmin && (
                        <button
                          onClick={() => handleAlterar(lead.id)}
                          style={{
                            marginTop: '5px',
                            padding: '5px 12px',
                            backgroundColor: '#ffc107',
                            color: '#000',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Alterar
                        </button>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: '0px',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                      }}
                    >
                      <select
                        value={selecionados[lead.id] || ''}
                        onChange={(e) => handleSelect(lead.id, e.target.value)}
                        style={{
                          padding: '5px',
                          borderRadius: '4px',
                          border: '1px solid #ccc',
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
                        style={{
                          padding: '5px 12px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Enviar
                      </button>
                    </div>
                  )}
                </div>

                {/* Data de Criação (Rodapé) */}
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
                  {formatarData(lead.createdAt)}
                </div>
              </div>
            );
          })}

          {/* Paginação */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              marginTop: '20px',
              width: '100%',
            }}
          >
            <button
              onClick={handlePaginaAnterior}
              disabled={paginaCorrigida <= 1 || isLoading}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                cursor: (paginaCorrigida <= 1 || isLoading) ? 'not-allowed' : 'pointer',
                backgroundColor: (paginaCorrigida <= 1 || isLoading) ? '#f0f0f0' : '#fff',
                color: (paginaCorrigida <= 1 || isLoading) ? '#aaa' : '#000',
              }}
            >
              Anterior
            </button>
            <span style={{ alignSelf: 'center', fontWeight: 'bold' }}>
              Página {paginaCorrigida} de {totalPaginas}
            </span>
            <button
              onClick={handlePaginaProxima}
              disabled={paginaCorrigida >= totalPaginas || isLoading}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                cursor: (paginaCorrigida >= totalPaginas || isLoading) ? 'not-allowed' : 'pointer',
                backgroundColor: (paginaCorrigida >= totalPaginas || isLoading) ? '#f0f0f0' : '#fff',
                color: (paginaCorrigida >= totalPaginas || isLoading) ? '#aaa' : '#000',
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
