import React, { useState, useEffect, useRef } from 'react';
import Lead from './components/Lead';
import { RefreshCcw, Bell } from 'lucide-react';

const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';
const ALTERAR_ATRIBUIDO_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=alterar_atribuido';
// Script para salvar a observação e a data agendada
const SALVAR_OBSERVACAO_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?action=salvarObservacao';

const Leads = ({ leads, usuarios, onUpdateStatus, transferirLead, usuarioLogado, fetchLeadsFromSheet, isEditing, setIsEditing }) => {
    const [selecionados, setSelecionados] = useState({});
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const [observacoes, setObservacoes] = useState({});
    const [isEditingObservacao, setIsEditingObservacao] = useState({});
    const [isStatusLocked, setIsStatusLocked] = useState({});
    const [agendamentos, setAgendamentos] = useState({});

    const [dataInput, setDataInput] = useState('');
    const [filtroData, setFiltroData] = useState('');

    const [nomeInput, setNomeInput] = useState('');
    const [filtroNome, setFiltroNome] = useState('');
    const [filtroStatus, setFiltroStatus] = useState(null);

    const [showNotification, setShowNotification] = useState(false);
    const [hasScheduledToday, setHasScheduledToday] = useState(false);

    const isEditingRef = useRef(isEditing);
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, [paginaAtual]);

    useEffect(() => {
        isEditingRef.current = isEditing;
    }, [isEditing]);

    const formatarDataParaInput = (dataStr) => {
        if (!dataStr) return '';
        const partes = dataStr.split('/');
        if (partes.length === 3) {
            const [dia, mes, ano] = partes;
            return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        }
        return '';
    };

    useEffect(() => {
        const initialObservacoes = {};
        const initialIsEditingObservacao = {};
        const initialIsStatusLocked = {};
        const initialAgendamentos = {};

        leads.forEach(lead => {
            initialObservacoes[lead.id] = lead.observacao || '';
            initialIsEditingObservacao[lead.id] = !lead.observacao || lead.observacao.trim() === '';
            initialIsStatusLocked[lead.id] = ['Em Contato', 'Sem Contato', 'Fechado', 'Perdido'].includes(lead.status) || lead.status.startsWith('Agendado');

            if (lead.agendamento) {
                const partesData = lead.agendamento.split('/');
                if (partesData.length === 3) {
                    const [dia, mes, ano] = partesData;
                    initialAgendamentos[lead.id] = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
                } else {
                    initialAgendamentos[lead.id] = '';
                }
            } else {
                initialAgendamentos[lead.id] = '';
            }
        });

        setObservacoes(initialObservacoes);
        setIsEditingObservacao(initialIsEditingObservacao);
        setIsStatusLocked(initialIsStatusLocked);
        setAgendamentos(initialAgendamentos);
    }, [leads]);

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (isEditingRef.current) {
                event.preventDefault();
                event.returnValue = 'Você tem observações não salvas. Deseja sair e perder as alterações?';
                return event.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

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
            const refreshedIsStatusLocked = {};
            leads.forEach(lead => {
                refreshedIsEditingObservacao[lead.id] = !lead.observacao || lead.observacao.trim() === '';
                refreshedIsStatusLocked[lead.id] = ['Em Contato', 'Sem Contato', 'Fechado', 'Perdido'].includes(lead.status) || lead.status.startsWith('Agendado');
            });
            setIsEditingObservacao(refreshedIsEditingObservacao);
            setIsStatusLocked(refreshedIsStatusLocked);
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

    const leadsFiltrados = leads.filter((lead) => {
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

    const gerais = [...leadsFiltrados].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : 0;
        const dateB = b.createdAt ? new Date(b.createdAt) : 0;
        return dateB - dateA;
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

    const handleAgendamentoChange = (leadId, date) => {
        setAgendamentos((prev) => ({
            ...prev,
            [leadId]: date,
        }));
    };

    const handleSalvarObservacao = async (leadId) => {
        const observacaoTexto = observacoes[leadId] || '';
        const agendamentoData = agendamentos[leadId] || '';

        if (!agendamentoData && !observacaoTexto.trim()) {
            alert('Por favor, adicione uma observação ou selecione uma data de agendamento antes de salvar.');
            return;
        }

        setIsLoading(true);
        try {
            const lead = leads.find(l => l.id === leadId);

            let novoStatus = lead.status;
            if (agendamentoData) {
                const [ano, mes, dia] = agendamentoData.split('-');
                const dataFormatada = `${dia}/${mes}/${ano}`;
                novoStatus = `Agendado - ${dataFormatada}`;
            }

            const payload = {
                leadId: leadId,
                observacao: observacaoTexto,
                agendamento: agendamentoData,
                novoStatus: novoStatus
            };

            await fetch(SALVAR_OBSERVACAO_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            setIsEditing(false);
            setIsEditingObservacao(prev => ({ ...prev, [leadId]: false }));

            onUpdateStatus(leadId, novoStatus);
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

    const handleUpdateStatus = (leadId, novoStatus) => {
        onUpdateStatus(leadId, novoStatus);
    };

    const handleAlterarStatus = (leadId) => {
        const leadToAlter = leads.find(l => l.id === leadId);
        if (!leadToAlter) return;
        onUpdateStatus(leadId, 'Novo');
    };

    return (
        <div style={{ padding: '20px', position: 'relative', minHeight: 'calc(100vh - 100px)' }} ref={containerRef}>
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
                                    <p>Você tem agendamentos hoje!</p>
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
                        flexGrow: 1,
                        justifyContent: 'center',
                        minWidth: '300px',
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
                                    gap: '1px',
                                    alignItems: 'flex-start',
                                    flexWrap: 'wrap',
                                }}
                            >
                                <div style={{ flex: '1 1 50%', minWidth: '300px' }}>
                                    <Lead
                                        lead={lead}
                                        onUpdateStatus={onUpdateStatus}
                                        onAlterarStatus={() => handleAlterarStatus(lead.id)}
                                        isLocked={isStatusLocked[lead.id]}
                                    />
                                </div>
                                {(lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status === 'Agendar' || lead.status.startsWith('Agendado')) && (
                                    <div style={{ flex: '1 1 45%', minWidth: '280px', borderLeft: '1px dashed #eee', paddingLeft: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                            <label htmlFor={`observacao-${lead.id}`} style={{ fontWeight: 'bold', color: '#555' }}>
                                                Observações:
                                            </label>
                                            <input
                                                type="date"
                                                id={`agendamento-${lead.id}`}
                                                value={agendamentos[lead.id] || ''}
                                                onChange={(e) => handleAgendamentoChange(lead.id, e.target.value)}
                                                disabled={!isEditingObservacao[lead.id]}
                                                style={{
                                                    padding: '5px',
                                                    borderRadius: '4px',
                                                    border: '1px solid #ccc',
                                                    backgroundColor: isEditingObservacao[lead.id] ? '#fff' : '#f0f0f0',
                                                    cursor: isEditingObservacao[lead.id] ? 'pointer' : 'not-allowed',
                                                }}
                                            />
                                        </div>
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
                                                        padding: '5px 10px',
                                                        backgroundColor: '#dc3545',
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
                                        isAdmin && (
                                            <div style={{ marginTop: '10px' }}>
                                                <label htmlFor={`selecionar-${lead.id}`} style={{ marginRight: '8px', color: '#555' }}>
                                                    Atribuir a:
                                                </label>
                                                <select
                                                    id={`selecionar-${lead.id}`}
                                                    onChange={(e) => handleSelect(lead.id, e.target.value)}
                                                    value={selecionados[lead.id] || ''}
                                                    style={{
                                                        padding: '5px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #ccc',
                                                        marginRight: '8px',
                                                    }}
                                                >
                                                    <option value="" disabled>
                                                        Selecione um usuário
                                                    </option>
                                                    {usuariosAtivos.map((u) => (
                                                        <option key={u.id} value={u.id}>
                                                            {u.nome}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => handleEnviar(lead.id)}
                                                    style={{
                                                        padding: '5px 10px',
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
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
                        <button
                            onClick={handlePaginaAnterior}
                            disabled={paginaCorrigida === 1}
                            style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Anterior
                        </button>
                        <span style={{ padding: '8px 16px' }}>
                            Página {paginaCorrigida} de {totalPaginas}
                        </span>
                        <button
                            onClick={handlePaginaProxima}
                            disabled={paginaCorrigida === totalPaginas}
                            style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
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
