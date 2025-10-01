import React, { useState, useEffect } from 'react';
import Lead from './components/Lead';
import { RefreshCcw, Bell, Search } from 'lucide-react'; // Adicionei o ícone Search para o layout

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
    <div className="p-4 md:p-6 lg:p-8 relative min-h-screen bg-gray-100 font-sans">
      
      {/* 1. Overlay de Loading */}
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-80 flex justify-center items-center z-50">
          <div className="flex items-center">
            <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-4 text-xl font-semibold text-gray-700">Carregando LEADS...</p>
          </div>
        </div>
      )}

      {/* 2. Cabeçalho Principal e Área de Controles */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4">
          <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
            <Bell size={32} className="text-indigo-500 mr-3" />
            Leads
          </h1>
          
          {/* Botão de Refresh e Sino de Notificação (reagrupados) */}
          <div className="flex items-center gap-4">
            
            {/* Botão de Refresh */}
            <button
              title="Atualizar dados"
              onClick={handleRefreshLeads}
              disabled={isLoading}
              className={`p-3 rounded-full transition duration-300 ${isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-100 shadow-sm'}`}
            >
              <RefreshCcw size={24} className={isLoading ? '' : 'hover:rotate-180'} />
            </button>

            {/* Sino de Notificação */}
            {hasScheduledToday && (
              <div
                className="relative cursor-pointer"
                onClick={() => setShowNotification(!showNotification)}
                title="Agendamentos para Hoje"
              >
                <Bell size={32} className="text-red-500" />
                <div className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold ring-2 ring-white">
                  1
                </div>
                {showNotification && (
                  <div className="absolute top-10 right-0 w-64 bg-white border border-gray-200 rounded-lg p-3 shadow-xl z-10">
                    <p className="text-sm font-semibold text-gray-800">Você tem agendamentos hoje!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Controles de Filtro */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch">
          
          {/* Filtro de Busca por Nome */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={nomeInput}
              onChange={(e) => setNomeInput(e.target.value)}
              className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              title="Filtrar leads pelo nome (contém)"
            />
            <button
              onClick={aplicarFiltroNome}
              className="p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 shadow-md"
            >
              <Search size={20} />
            </button>
          </div>

          {/* Filtro de Data */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px] justify-end">
            <input
              type="month"
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
              className="p-3 border border-gray-300 rounded-lg cursor-pointer text-sm"
              title="Filtrar leads pelo mês e ano de criação"
            />
            <button
              onClick={aplicarFiltroData}
              className="p-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition duration-200 shadow-md whitespace-nowrap"
            >
              Filtrar Data
            </button>
          </div>
        </div>
      </div>
      
      {/* 3. Barra de Status/Filtros Rápidos */}
      <div className="flex flex-wrap gap-3 justify-center mb-8">
        <button
          onClick={() => aplicarFiltroStatus('Em Contato')}
          className={`
            px-5 py-2 rounded-full font-bold transition duration-300 shadow-lg
            ${filtroStatus === 'Em Contato' ? 'bg-orange-600 text-white ring-2 ring-orange-400' : 'bg-orange-500 text-white hover:bg-orange-600'}
          `}
        >
          Em Contato
        </button>

        <button
          onClick={() => aplicarFiltroStatus('Sem Contato')}
          className={`
            px-5 py-2 rounded-full font-bold transition duration-300 shadow-lg
            ${filtroStatus === 'Sem Contato' ? 'bg-gray-700 text-white ring-2 ring-gray-400' : 'bg-gray-500 text-white hover:bg-gray-600'}
          `}
        >
          Sem Contato
        </button>

        {hasScheduledToday && (
          <button
            onClick={() => aplicarFiltroStatus('Agendado')}
            className={`
              px-5 py-2 rounded-full font-bold transition duration-300 shadow-lg
              ${filtroStatus === 'Agendado' ? 'bg-blue-700 text-white ring-2 ring-blue-400' : 'bg-blue-500 text-white hover:bg-blue-600'}
            `}
          >
            Agendados
          </button>
        )}

        <button
          onClick={() => aplicarFiltroStatus(null)}
          className={`
            px-5 py-2 rounded-full font-bold transition duration-300 shadow-lg
            ${filtroStatus === null ? 'bg-gray-800 text-white ring-2 ring-gray-500' : 'bg-gray-600 text-white hover:bg-gray-700'}
          `}
        >
          Todos
        </button>
      </div>

      {/* 4. Corpo Principal - Lista de Leads */}
      <div className="space-y-5">
        {isLoading ? (
          null
        ) : gerais.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-xl font-medium text-gray-600">Não há leads pendentes para os filtros aplicados. 🧐</p>
          </div>
        ) : (
          <>
            {leadsPagina.map((lead) => {
              const responsavel = usuarios.find((u) => u.nome === lead.responsavel);
              const hasObservacaoSection = (lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status.startsWith('Agendado'));

              return (
                <div
                  key={lead.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 p-6 relative border-t-4 border-indigo-500" // Card Principal
                >
                  
                  <div className={`grid ${hasObservacaoSection ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
                    
                    {/* COLUNA 1: Componente Lead e Transferência */}
                    <div className="space-y-4">
                      <Lead
                        lead={lead}
                        onUpdateStatus={handleConfirmStatus}
                        disabledConfirm={!lead.responsavel}
                      />

                      {/* Lógica de Transferência */}
                      <div className="pt-4 border-t border-gray-100 mt-4">
                        {lead.responsavel && responsavel ? (
                          <div className="flex items-center gap-3">
                            <p className="text-base text-green-600 font-semibold">
                              Transferido para <strong className="font-extrabold">{responsavel.nome}</strong>
                            </p>
                            {isAdmin && (
                              <button
                                onClick={() => handleAlterar(lead.id)}
                                className="px-3 py-1 bg-yellow-400 text-gray-900 text-sm rounded-md hover:bg-yellow-500 transition duration-150 shadow-sm"
                              >
                                Alterar
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <select
                              value={selecionados[lead.id] || ''}
                              onChange={(e) => handleSelect(lead.id, e.target.value)}
                              className="p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
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
                              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-150 shadow-md whitespace-nowrap"
                            >
                              Enviar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    

                    {/* COLUNA 2: Observações (Condicional) */}
                    {hasObservacaoSection && (
                      <div className="lg:border-l lg:border-gray-200 lg:pl-6 space-y-3">
                        <label htmlFor={`observacao-${lead.id}`} className="block text-sm font-semibold text-gray-700">
                          Observações:
                        </label>
                        <textarea
                          id={`observacao-${lead.id}`}
                          value={observacoes[lead.id] || ''}
                          onChange={(e) => handleObservacaoChange(lead.id, e.target.value)}
                          placeholder="Adicione suas observações aqui..."
                          rows="3"
                          disabled={!isEditingObservacao[lead.id]}
                          className={`
                            w-full p-3 rounded-lg border text-sm resize-y shadow-sm
                            ${isEditingObservacao[lead.id] ? 'bg-white border-indigo-500 focus:ring-indigo-500' : 'bg-gray-50 border-gray-200 cursor-not-allowed'}
                          `}
                        ></textarea>
                        
                        {isEditingObservacao[lead.id] ? (
                          <button
                            onClick={() => handleSalvarObservacao(lead.id)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150 font-bold shadow-md"
                          >
                            Salvar Observação
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAlterarObservacao(lead.id)}
                            className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-md hover:bg-yellow-500 transition duration-150 font-bold shadow-md"
                          >
                            Alterar Observação
                          </button>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Data de Criação (Rodapé do Card) */}
                  <div
                    className="absolute bottom-2 right-4 text-xs text-gray-400 italic"
                    title={`Criado em: ${formatarData(lead.createdAt)}`}
                  >
                    Criado em: {formatarData(lead.createdAt)}
                  </div>
                </div>
              );
            })}

            {/* Paginação */}
            <div className="flex justify-center items-center gap-4 mt-8 pb-8">
              <button
                onClick={handlePaginaAnterior}
                disabled={paginaCorrigida <= 1 || isLoading}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition duration-150 shadow-md ${
                  (paginaCorrigida <= 1 || isLoading) 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-white border-indigo-500 text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                Anterior
              </button>
              
              <span className="text-gray-700 font-semibold">
                Página {paginaCorrigida} de {totalPaginas}
              </span>
              
              <button
                onClick={handlePaginaProxima}
                disabled={paginaCorrigida >= totalPaginas || isLoading}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition duration-150 shadow-md ${
                  (paginaCorrigida >= totalPaginas || isLoading) 
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                  : 'bg-white border-indigo-500 text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                Próxima
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Leads;
