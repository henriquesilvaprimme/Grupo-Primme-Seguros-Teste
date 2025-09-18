import React, { useState, useEffect } from 'react';
import Lead from './components/Lead';
import { RefreshCcw, Bell } from 'lucide-react'; // Importado para o ícone de refresh e o sino

const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';
const ALTERAR_ATRIBUIDO_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=alterar_atribuido';
// ⚠️ ATENÇÃO: VOCÊ PRECISARÁ CRIAR ESTE SCRIPT NO GAS para salvar observações.
const SALVAR_OBSERVACAO_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?action=salvarObservacao';


const Leads = ({ leads, usuarios, onUpdateStatus, transferirLead, usuarioLogado, fetchLeadsFromSheet }) => {
  const [selecionados, setSelecionados] = useState({}); // { [leadId]: userId }
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // NOVO: Estados para Observações e controle de edição
  const [observacoes, setObservacoes] = useState({}); // { [leadId]: 'texto da observação' }
  const [isEditingObservacao, setIsEditingObservacao] = useState({}); // { [leadId]: true/false }

  // Estados para filtro por data (mes e ano) - INICIAM LIMPOS
  const [dataInput, setDataInput] = useState('');
  const [filtroData, setFiltroData] = useState('');

  // Estados para filtro por nome
  const [nomeInput, setNomeInput] = useState('');
  const [filtroNome, setFiltroNome] = useState('');

  // NOVOS ESTADOS PARA NOTIFICAÇÃO DE AGENDAMENTO
  const [showNotification, setShowNotification] = useState(false);
  const [hasScheduledToday, setHasScheduledToday] = useState(false);

  // NOVO: Inicializa as observações e o estado de edição ao carregar os leads
  useEffect(() => {
    const initialObservacoes = {};
    const initialIsEditingObservacao = {};
    leads.forEach(lead => {
      initialObservacoes[lead.id] = lead.observacao || ''; // Carrega a observação existente
      // Se a observação já existe, isEditingObservacao é false (para mostrar o botão Alterar)
      // Caso contrário, é true (para permitir a digitação e mostrar o botão Salvar)
      initialIsEditingObservacao[lead.id] = !lead.observacao || lead.observacao.trim() === '';
    });
    setObservacoes(initialObservacoes);
    setIsEditingObservacao(initialIsEditingObservacao);
  }, [leads]);

  // NOVO: EFEITO PARA VERIFICAR AGENDAMENTOS NA DATA DE HOJE
  useEffect(() => {
    const today = new Date();
    // Normaliza a data de hoje para o formato DD/MM/AAAA
    const todayFormatted = today.toLocaleDateString('pt-BR');

    // Filtra os leads para encontrar agendamentos para a data de hoje
    const todayAppointments = leads.filter(lead => {
        if (!lead.status.startsWith('Agendado')) return false;
        
        // Extrai a data do status e a normaliza
        const statusDateStr = lead.status.split(' - ')[1];
        if (!statusDateStr) return false;

        const [dia, mes, ano] = statusDateStr.split('/');
        // Constrói a data de forma segura, evitando problemas de fuso horário
        const statusDate = new Date(`${ano}-${mes}-${dia}T00:00:00`);
        const statusDateFormatted = statusDate.toLocaleDateString('pt-BR');

        return statusDateFormatted === todayFormatted;
    });

    setHasScheduledToday(todayAppointments.length > 0);
  }, [leads]);

  // Função para buscar leads atualizados do Google Sheets, agora controlando o isLoading
  const handleRefreshLeads = async () => {
    setIsLoading(true); // Ativa o loader
    try {
      await fetchLeadsFromSheet();
      // NOVO: Reinicia o estado de edição da observação após um refresh
      const refreshedIsEditingObservacao = {};
      leads.forEach(lead => {
        // Após o refresh, reavalia se a observação já existe para definir o estado de edição
        refreshedIsEditingObservacao[lead.id] = !lead.observacao || lead.observacao.trim() === '';
      });
      setIsEditingObservacao(refreshedIsEditingObservacao);
    } catch (error) {
      console.error('Erro ao buscar leads atualizados:', error);
    } finally {
      setIsLoading(false); // Desativa o loader, independentemente do sucesso ou erro
    }
  };

  const leadsPorPagina = 10;

  // Função para normalizar strings (remover acento, pontuação, espaços, etc)
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
    setPaginaAtual(1);
  };

  const aplicarFiltroNome = () => {
    const filtroLimpo = nomeInput.trim();
    setFiltroNome(filtroLimpo);
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

  // Filtragem dos leads pendentes + filtro data ou nome
  const gerais = leads.filter((lead) => {
    if (lead.status === 'Fechado' || lead.status === 'Perdido') return false;

    if (filtroData) {
      // Considerando que lead.createdAt é uma string no formato 'YYYY-MM-DD'
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
      const response = await fetch(ALTERAR_ATRIBUIDO_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(lead),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Após o envio, recarregar os leads para que a UI reflita a mudança
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

  const handlePaginaAnterior = () => {
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
  };

  const handlePaginaProxima = () => {
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));
  };

  // CORREÇÃO AQUI: Ajuste na função formatarData para lidar com fuso horário
  const formatarData = (dataStr) => {
    if (!dataStr) return '';
    let data;
    if (dataStr.includes('/')) {
        // Formato DD/MM/AAAA
        const partes = dataStr.split('/');
        // Constrói a data explicitamente como local
        data = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
    } else if (dataStr.includes('-') && dataStr.length === 10) {
        // Formato YYYY-MM-DD
        const partes = dataStr.split('-');
        // Constrói a data explicitamente como local
        data = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
    } else {
        // Fallback para outros formatos ou strings de data já completas
        data = new Date(dataStr);
    }

    if (isNaN(data.getTime())) {
        return '';
    }
    return data.toLocaleDateString('pt-BR');
  };

  // NOVO: Funções para o campo de observações
  const handleObservacaoChange = (leadId, text) => {
    setObservacoes((prev) => ({
      ...prev,
      [leadId]: text,
    }));
  };

  const handleSalvarObservacao = async (leadId) => {
    // CORREÇÃO AQUI: Acessar a observação do estado local `observacoes` usando `leadId`
    const observacaoTexto = observacoes[leadId] || '';
    if (!observacaoTexto.trim()) {
      alert('Por favor, digite uma observação antes de salvar.');
      return;
    }

    setIsLoading(true);
    try {
      // Aqui você enviaria a observação para o seu Google Apps Script
      await fetch(SALVAR_OBSERVACAO_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Importante para requisições GAS
        body: JSON.stringify({
          leadId: leadId,
          observacao: observacaoTexto,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Após salvar, bloqueia o campo e mostra o botão "Alterar"
      setIsEditingObservacao(prev => ({ ...prev, [leadId]: false }));
      // Opcional: Recarregar os leads para garantir que a observação atualizada seja exibida
      fetchLeadsFromSheet();
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
      alert('Erro ao salvar observação. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlterarObservacao = (leadId) => {
    // Permite a edição do campo de observação
    setIsEditingObservacao(prev => ({ ...prev, [leadId]: true }));
  };

  // Importante: A função onUpdateStatus que você passa para o Lead.jsx
  // precisará ser aprimorada para que, após a confirmação,
  // ela possa "desbloquear" a observação (setar isEditingObservacao como true para o lead)
  const handleConfirmStatus = (leadId, novoStatus, phone) => {
    onUpdateStatus(leadId, novoStatus, phone);
    // Se o status for "Em Contato" ou "Sem Contato", habilita a edição da observação
    // E se não houver observação prévia, também habilita para digitar
    const currentLead = leads.find(l => l.id === leadId);
    const hasNoObservacao = !currentLead.observacao || currentLead.observacao.trim() === '';

    if ( (novoStatus === 'Em Contato' || novoStatus === 'Sem Contato') && hasNoObservacao ) {
        setIsEditingObservacao(prev => ({ ...prev, [leadId]: true }));
    } else if (novoStatus === 'Em Contato' || novoStatus === 'Sem Contato') {
        // Se já tinha observação e o status é Em Contato/Sem Contato, mantém bloqueado para Alterar
        setIsEditingObservacao(prev => ({ ...prev, [leadId]: false }));
    } else {
        setIsEditingObservacao(prev => ({ ...prev, [leadId]: false })); // Desabilita para outros status
    }
    fetchLeadsFromSheet(); // Recarrega os leads para refletir a mudança de status
  };

  return (
    <div style={{ padding: '20px', position: 'relative', minHeight: 'calc(100vh - 100px)' }}>
      {isLoading && (
        <div className="absolute inset-0 bg-white flex justify-center items-center z-10" style={{ opacity: 0.8 }}>
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="ml-4 text-lg text-gray-700">Carregando LEADS...</p>
        </div>
      )}

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
              <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
            minWidth: '220px',
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

        {/* --- DIV DO SINO COM Z-INDEX ADICIONADO --- */}
        {hasScheduledToday && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                flex: '1 1 100px',
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
                    zIndex: 10, // 👈 Nova propriedade adicionada aqui
                  }}
                >
                  <p>Você tem agendamentos hoje!</p>
                </div>
              )}
            </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: '220px',
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

      {isLoading ? (
        null
      ) : gerais.length === 0 ? (
        <p>Não há leads pendentes para os filtros aplicados.</p>
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
                  gap: '20px',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 50%', minWidth: '300px' }}>
                  <Lead
                    lead={lead}
                    onUpdateStatus={handleConfirmStatus} // Usando a nova função wrapper
                    disabledConfirm={!lead.responsavel}
                  />
                </div>

                {/* NOVO: Campo de Observações - Aparece apenas para status "Em Contato" ou "Sem Contato" */}
                {(lead.status === 'Em Contato' || lead.status === 'Sem Contato') && (
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
                      disabled={!isEditingObservacao[lead.id]} /* Desabilita se não estiver editando */
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        backgroundColor: isEditingObservacao[lead.id] ? '#fff' : '#f0f0f0',
                        cursor: isEditingObservacao[lead.id] ? 'text' : 'not-allowed',
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

                <div style={{ width: '100%' }}>
                  {lead.responsavel && responsavel ? (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ color: '#28a745' }}>
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
                        marginTop: '10px',
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

                {/* Data no canto inferior direito */}
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
              }}
            >
              Anterior
            </button>
            <span style={{ alignSelf: 'center' }}>
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
