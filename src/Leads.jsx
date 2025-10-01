import React, { useState, useEffect } from 'react';
import Lead from './components/Lead';
import { RefreshCcw, Bell } from 'lucide-react';

// ... (Suas URLs de script e a lógica de Hooks permanecem as mesmas)
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

  // ... (Sua lógica de useEffect, handleRefreshLeads, normalizarTexto, filtros e paginação permanece a mesma)
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
    <div className="p-5 relative min-h-[calc(100vh-100px)]">
      {/* Overlay de Carregamento */}
      {isLoading && (
        <div className="absolute inset-0 bg-white flex justify-center items-center z-10 opacity-80">
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="ml-4 text-lg text-gray-700">Carregando LEADS...</p>
        </div>
      )}

      {/* Cabeçalho e Filtros (Flex Container) */}
      <div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
        {/* Título e Botão de Refresh */}
        <div className="flex items-center gap-3">
          <h1 className="m-0 text-2xl font-bold text-gray-800">Leads</h1>
          <button
            title='Clique para atualizar os dados'
            onClick={handleRefreshLeads}
            disabled={isLoading}
            className={`p-0 flex items-center justify-center text-blue-600 hover:text-blue-800 transition ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
        <div className="flex items-center gap-2">
          <button
            onClick={aplicarFiltroNome}
            className="bg-blue-600 hover:bg-blue-700 text-white border-none rounded-md px-3 py-1.5 cursor-pointer whitespace-nowrap transition"
          >
            Filtrar
          </button>
          <input
            type="text"
            placeholder="Filtrar por nome"
            value={nomeInput}
            onChange={(e) => setNomeInput(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-gray-300 w-56 max-w-full focus:ring-blue-500 focus:border-blue-500"
            title="Filtrar leads pelo nome (contém)"
          />
        </div>

        {/* Notificação de Agendamentos (Sino) */}
        {hasScheduledToday && (
          <div className="relative cursor-pointer" onClick={() => setShowNotification(!showNotification)}>
            <Bell size={32} color="#007bff" />
            <div className="absolute top-[-5px] right-[-5px] bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold ring-2 ring-white">
              1
            </div>
            {showNotification && (
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-64 bg-white border border-gray-300 rounded-lg p-3 shadow-lg z-20 text-sm whitespace-nowrap">
                <p className="font-semibold text-gray-800">Você tem agendamentos hoje!</p>
                <p className="text-gray-600">Clique no botão "Agendados" para ver.</p>
              </div>
            )}
          </div>
        )}

        {/* Filtro por Data (Mês/Ano) */}
        <div className="flex items-center gap-2">
          <button
            onClick={aplicarFiltroData}
            className="bg-blue-600 hover:bg-blue-700 text-white border-none rounded-md px-3 py-1.5 cursor-pointer transition"
          >
            Filtrar
          </button>
          <input
            type="month"
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
            className="px-2.5 py-1.5 rounded-md border border-gray-300 cursor-pointer focus:ring-blue-500 focus:border-blue-500"
            title="Filtrar leads pelo mês e ano de criação"
          />
        </div>
      </div>

      {/* --- Linha de Status de Filtros --- */}

      {/* Botões de Filtro de Status */}
      <div className="flex justify-center gap-4 mb-5 flex-wrap">
        <button
          onClick={() => aplicarFiltroStatus('Em Contato')}
          className={`px-4 py-2 text-white border-none rounded-lg cursor-pointer font-bold transition shadow-md ${
            filtroStatus === 'Em Contato' ? 'bg-orange-700 ring-2 ring-orange-500' : 'bg-orange-500 hover:bg-orange-600'
          }`}
        >
          Em Contato
        </button>

        <button
          onClick={() => aplicarFiltroStatus('Sem Contato')}
          className={`px-4 py-2 text-white border-none rounded-lg cursor-pointer font-bold transition shadow-md ${
            filtroStatus === 'Sem Contato' ? 'bg-gray-700 ring-2 ring-gray-500' : 'bg-gray-500 hover:bg-gray-600'
          }`}
        >
          Sem Contato
        </button>

        {hasScheduledToday && (
          <button
            onClick={() => aplicarFiltroStatus('Agendado')}
            className={`px-4 py-2 text-white border-none rounded-lg cursor-pointer font-bold transition shadow-md ${
              filtroStatus === 'Agendado' ? 'bg-sky-700 ring-2 ring-sky-500' : 'bg-sky-500 hover:bg-sky-600'
            }`}
          >
            Agendados Hoje
          </button>
        )}
      </div>

      {/* --- Conteúdo Principal (Lista de Leads) --- */}

      {isLoading ? (
        null
      ) : gerais.length === 0 ? (
        <p className="text-center text-lg text-gray-500 mt-10">Não há leads pendentes para os filtros aplicados. 😢</p>
      ) : (
        <>
          {leadsPagina.map((lead) => {
            const responsavel = usuarios.find((u) => u.nome === lead.responsavel);
            const isLeadActive = lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status.startsWith('Agendado');

            return (
              <div
                key={lead.id}
                className="bg-white border border-gray-200 rounded-lg p-4 mb-4 relative flex flex-wrap gap-4 items-start shadow-sm hover:shadow-md transition"
              >
                {/* 1. Detalhes Principais do Lead (Lead Component) */}
                <div className={`flex-1 min-w-[300px] ${isLeadActive ? 'lg:border-r lg:border-dashed lg:border-gray-300 lg:pr-4' : ''}`}>
                  <Lead
                    lead={lead}
                    onUpdateStatus={handleConfirmStatus}
                    disabledConfirm={!lead.responsavel}
                  />
                </div>

                {/* 2. Observações (Visível para Em Contato/Sem Contato/Agendado) */}
                {isLeadActive && (
                  <div className="flex-1 min-w-[280px] pt-4 lg:pt-0">
                    <label htmlFor={`observacao-${lead.id}`} className="block mb-1.5 font-bold text-gray-700 text-sm">
                      Observações:
                    </label>
                    <textarea
                      id={`observacao-${lead.id}`}
                      value={observacoes[lead.id] || ''}
                      onChange={(e) => handleObservacaoChange(lead.id, e.target.value)}
                      placeholder="Adicione suas observações aqui..."
                      rows="3"
                      disabled={!isEditingObservacao[lead.id]}
                      className={`w-full p-2 rounded-md border transition resize-y text-sm ${
                        isEditingObservacao[lead.id]
                          ? 'border-blue-400 bg-white focus:ring-blue-500 focus:border-blue-500'
                          : 'border-gray-300 bg-gray-50 cursor-default'
                      }`}
                    ></textarea>
                    {isEditingObservacao[lead.id] ? (
                      <button
                        onClick={() => handleSalvarObservacao(lead.id)}
                        className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-md cursor-pointer font-semibold text-sm transition"
                      >
                        Salvar Observação
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAlterarObservacao(lead.id)}
                        className="mt-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 border-none rounded-md cursor-pointer font-semibold text-sm transition"
                      >
                        Alterar Observação
                      </button>
                    )}
                  </div>
                )}

                {/* 3. Atribuição de Usuário */}
                <div className="w-full mt-2">
                  {lead.responsavel && responsavel ? (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-green-50 rounded-md border border-green-200">
                      <p className="text-green-700 font-medium mb-1 sm:mb-0">
                        Transferido para <strong>{responsavel.nome}</strong>
                      </p>
                      {isAdmin && (
                        <button
                          onClick={() => handleAlterar(lead.id)}
                          className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 border-none rounded-md cursor-pointer text-sm font-medium transition"
                        >
                          Alterar Atribuição
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-3 items-center p-2 bg-gray-50 rounded-md border border-gray-200">
                      <select
                        value={selecionados[lead.id] || ''}
                        onChange={(e) => handleSelect(lead.id, e.target.value)}
                        className="p-1.5 rounded-md border border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
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
                        className={`px-3 py-1.5 text-white border-none rounded-md cursor-pointer text-sm font-semibold transition ${
                          selecionados[lead.id]
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-green-300 cursor-not-allowed'
                        }`}
                      >
                        Enviar Lead
                      </button>
                    </div>
                  )}
                </div>

                {/* Data de Criação (Rodapé do Card) */}
                <div
                  className="absolute bottom-2 right-4 text-xs text-gray-500 italic"
                  title={`Criado em: ${formatarData(lead.createdAt)}`}
                >
                  Criado em: {formatarData(lead.createdAt)}
                </div>
              </div>
            );
          })}

          {/* --- Paginação --- */}
          <div className="flex justify-center gap-4 mt-6 pb-4">
            <button
              onClick={handlePaginaAnterior}
              disabled={paginaCorrigida <= 1 || isLoading}
              className={`px-4 py-2 rounded-md border border-gray-300 text-sm font-medium transition ${
                (paginaCorrigida <= 1 || isLoading)
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                  : 'cursor-pointer bg-white hover:bg-gray-100 text-gray-700'
              }`}
            >
              &larr; Anterior
            </button>
            <span className="self-center text-gray-700 font-medium">
              Página <strong className="text-blue-600">{paginaCorrigida}</strong> de {totalPaginas}
            </span>
            <button
              onClick={handlePaginaProxima}
              disabled={paginaCorrigida >= totalPaginas || isLoading}
              className={`px-4 py-2 rounded-md border border-gray-300 text-sm font-medium transition ${
                (paginaCorrigida >= totalPaginas || isLoading)
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                  : 'cursor-pointer bg-white hover:bg-gray-100 text-gray-700'
              }`}
            >
              Próxima &rarr;
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Leads;
