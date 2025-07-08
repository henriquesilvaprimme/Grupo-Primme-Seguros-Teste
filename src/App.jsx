import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Importações de componentes
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Leads from './Leads';
import LeadsFechados from './LeadsFechados';
import LeadsPerdidos from './LeadsPerdidos';
import BuscarLead from './BuscarLead';
import CriarUsuario from './pages/CriarUsuario';
import Usuarios from './pages/Usuarios';
import Ranking from './pages/Ranking';
import CriarLead from './pages/CriarLead';

// --- CONFIGURAÇÃO DE URL DO GOOGLE APPS SCRIPT ---
// **ATENÇÃO:** SUBSTITUA ESTE VALOR PELO URL EXATO E MAIS RECENTE DA SUA IMPLANTAÇÃO DE WEB APP DO GOOGLE APPS SCRIPT.
// Ele deve terminar com '/exec'.
const GOOGLE_SHEETS_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';

// Definição das URLs completas para as requisições, baseadas na URL principal
const GOOGLE_SHEETS_GET_LEADS_URL = `${GOOGLE_SHEETS_BASE_URL}?v=getLeads`;
const GOOGLE_SHEETS_GET_USERS_URL = `${GOOGLE_SHEETS_BASE_URL}?v=pegar_usuario`;
const GOOGLE_SHEETS_GET_LEADS_FECHADOS_URL = `${GOOGLE_SHEETS_BASE_URL}?v=pegar_clientes_fechados`;
const GOOGLE_SHEETS_CREATE_LEAD_URL = `${GOOGLE_SHEETS_BASE_URL}?v=criar_lead`;
const GOOGLE_SHEETS_SAVE_LEAD_URL = `${GOOGLE_SHEETS_BASE_URL}?v=salvar_lead`;
const GOOGLE_SHEETS_TRANSFER_LEAD_URL = `${GOOGLE_SHEETS_BASE_URL}?v=transferir_lead`;
const GOOGLE_SHEETS_ALTERAR_SEGURADORA_URL = `${GOOGLE_SHEETS_BASE_URL}?v=alterar_seguradora`;
const GOOGLE_SHEETS_CREATE_USER_URL = `${GOOGLE_SHEETS_BASE_URL}?v=criar_usuario`;
const GOOGLE_SHEETS_ALTERAR_USUARIO_URL = `${GOOGLE_SHEETS_BASE_URL}?v=alterar_usuario`;
const GOOGLE_SHEETS_RANKING_URL = `${GOOGLE_SHEETS_BASE_URL}?action=ranking_data`; // Este usa 'action' no GAS
// --- FIM DA CONFIGURAÇÃO DE URL ---

const App = () => {
    const navigate = useNavigate();

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginInput, setLoginInput] = useState('');
    const [senhaInput, setSenhaInput] = useState('');
    const [usuarioLogado, setUsuarioLogado] = useState(null);
    const [leadsFechados, setLeadsFechados] = useState([]);
    const [backgroundLoaded, setBackgroundLoaded] = useState(false);

    useEffect(() => {
        const img = new Image();
        img.src = '/background.png';
        img.onload = () => setBackgroundLoaded(true);
    }, []);

    const [leads, setLeads] = useState([]);
    const [leadSelecionado, setLeadSelecionado] = useState(null);
    const [usuarios, setUsuarios] = useState([]);

    // Função auxiliar para formatar a data para exibição no frontend (DD/Mês/AA ou DD/MM/YYYY)
    const formatarDataParaExibicao = useCallback((dataString) => {
        if (!dataString) return '';
        try {
            let dateObj;
            const partesHifen = dataString.match(/^(\d{4})-(\d{2})-(\d{2})(T.*)?$/); // Formato YYYY-MM-DD com ou sem T
            const partesBarra = dataString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); // Formato DD/MM/YYYY

            if (partesHifen) {
                // Se já é YYYY-MM-DD, cria a data. O 'T00:00:00' ajuda a evitar problemas de fuso horário
                // se a string original não tiver um tempo.
                dateObj = new Date(dataString.split('T')[0] + 'T00:00:00');
            } else if (partesBarra) {
                dateObj = new Date(`${partesBarra[3]}-${partesBarra[2]}-${partesBarra[1]}T00:00:00`);
            } else {
                dateObj = new Date(dataString); // Última tentativa de parsear
            }

            if (isNaN(dateObj.getTime())) {
                console.warn('Data inválida para exibição:', dataString);
                return dataString; // Retorna a string original se não conseguir formatar
            }

            const dia = String(dateObj.getDate()).padStart(2, '0');
            const mes = String(dateObj.getMonth() + 1).padStart(2, '0'); // Mês é base 0
            const ano = dateObj.getFullYear();
            const nomeMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                                "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            const mesExtenso = nomeMeses[dateObj.getMonth()];
            const anoCurto = String(ano).substring(2);

            return `${dia}/${mesExtenso}/${anoCurto}`; // Formato 08/Junho/25
        } catch (error) {
            console.error('Erro ao formatar data para exibição:', error);
            return dataString;
        }
    }, []);


    // --- FUNÇÕES DE FETCH PARA O GOOGLE APPS SCRIPT ---
    // Envolvidas em useCallback para otimização e evitar re-renderizações desnecessárias

    const fetchLeadsFromSheet = useCallback(async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_GET_LEADS_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // console.log("Dados de Leads Recebidos do GAS:", data);

            if (Array.isArray(data)) {
                const sortedData = data.sort((a, b) => {
                    const dateA = new Date(a.editado);
                    const dateB = new Date(b.editado);
                    return dateB - dateA;
                });

                const formattedLeads = sortedData.map((item, index) => ({
                    id: item.id || crypto.randomUUID(), // Usar crypto.randomUUID() se 'id' não existir
                    name: item.name || item.Name || '',
                    vehicleModel: item.vehiclemodel || item.vehicleModel || '',
                    vehicleYearModel: item.vehicleyearmodel || item.vehicleYearModel || '',
                    city: item.city || '',
                    phone: item.phone || item.Telefone || '',
                    insuranceType: item.insurancetype || item.insuranceType || '',
                    status: item.status || 'Novo', // Valor padrão 'Novo'
                    confirmado: item.confirmado === 'true' || item.confirmado === true,
                    insurer: item.insurer || '',
                    insurerConfirmed: item.insurerConfirmed === 'true' || item.insurerConfirmed === true,
                    usuarioId: item.usuarioId || null,
                    premioLiquido: item.premioLiquido || '',
                    comissao: item.comissao || '',
                    parcelamento: item.parcelamento || '',
                    VigenciaFinal: item.VigenciaFinal || '', // Já vem formatado YYYY-MM-DD do GAS
                    createdAt: item.createdAt || new Date().toISOString(), // Usar `createdAt` do GAS
                    responsavel: item.responsavel || '',
                    editado: item.editado || item.createdAt || '', // 'editado' ou 'createdAt'
                }));

                // console.log("Leads formatados no frontend:", formattedLeads);
                setLeads(formattedLeads);
            } else {
                setLeads([]);
            }
        } catch (error) {
            console.error('Erro ao buscar leads da planilha:', error);
            setLeads([]);
        }
    }, []);

    const fetchLeadsFechadosFromSheet = useCallback(async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_GET_LEADS_FECHADOS_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // console.log("Dados de Leads Fechados Recebidos do GAS:", data);

            // Os dados já devem vir pré-formatados do GAS (VigenciaFinal como YYYY-MM-DD)
            setLeadsFechados(data);

        } catch (error) {
            console.error('Erro ao buscar leads fechados:', error);
            setLeadsFechados([]);
        }
    }, []);

    const fetchUsuariosFromSheet = useCallback(async () => {
        try {
            const response = await fetch(GOOGLE_SHEETS_GET_USERS_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (Array.isArray(data)) {
                const formattedUsuarios = data.map((item) => ({
                    id: String(item.id) || '', // Garantir que ID é string
                    usuario: item.usuario || '',
                    nome: item.nome || '',
                    email: item.email || '',
                    senha: item.senha || '',
                    status: item.status || 'Ativo',
                    tipo: item.tipo || 'Usuario',
                }));
                setUsuarios(formattedUsuarios);
            } else {
                setUsuarios([]);
            }
        } catch (error) {
            console.error('Erro ao buscar usuários do Google Sheets:', error);
            setUsuarios([]);
        }
    }, []);

    // Função para criar lead
    const createLead = useCallback(async (leadData) => {
        try {
            const response = await fetch(GOOGLE_SHEETS_CREATE_LEAD_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(leadData),
            });
            const data = await response.json();
            if (!response.ok || data.status === 'error') {
                throw new Error(data.message || 'Erro ao criar lead');
            }
            return { success: true, data: data };
        } catch (error) {
            console.error("Erro ao criar lead:", error);
            return { success: false, message: error.message };
        }
    }, []);

    // Função para salvar (atualizar) status de lead
    const saveLead = useCallback(async (leadId, newStatus) => {
        try {
            const response = await fetch(GOOGLE_SHEETS_SAVE_LEAD_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: leadId, status: newStatus }),
            });
            const data = await response.json();
            if (!response.ok || data.status === 'error') {
                throw new Error(data.message || 'Erro ao salvar lead');
            }
            return { success: true, data: data };
        } catch (error) {
            console.error("Erro ao salvar lead:", error);
            return { success: false, message: error.message };
        }
    }, []);

    // Função para transferir lead
    const transferLead = useCallback(async (leadId, newResponsavelName) => {
        try {
            const response = await fetch(GOOGLE_SHEETS_TRANSFER_LEAD_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lead: { id: leadId, responsavel: newResponsavelName } }),
            });
            const data = await response.json();
            if (!response.ok || data.status === 'error') {
                throw new Error(data.message || 'Erro ao transferir lead');
            }
            return { success: true, data: data };
        } catch (error) {
            console.error("Erro ao transferir lead:", error);
            return { success: false, message: error.message };
        }
    }, []);

    // Função para alterar detalhes da seguradora (e financeiro) de um lead fechado
    const alterarSeguradora = useCallback(async (leadData) => {
        try {
            const response = await fetch(GOOGLE_SHEETS_ALTERAR_SEGURADORA_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lead: leadData }), // leadData já deve conter ID, Seguradora, PremioLiquido, etc.
            });
            const data = await response.json();
            if (!response.ok || data.status === 'error') {
                throw new Error(data.message || 'Erro ao alterar seguradora');
            }
            return { success: true, data: data };
        } catch (error) {
            console.error("Erro ao alterar seguradora:", error);
            return { success: false, message: error.message };
        }
    }, []);

    // Função para criar usuário
    const createUser = useCallback(async (userData) => {
        try {
            const response = await fetch(GOOGLE_SHEETS_CREATE_USER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });
            const data = await response.json();
            if (!response.ok || data.status === 'error') {
                throw new Error(data.message || 'Erro ao criar usuário');
            }
            return { success: true, data: data };
        } catch (error) {
            console.error("Erro ao criar usuário:", error);
            return { success: false, message: error.message };
        }
    }, []);

    // Função para alterar usuário (status e tipo)
    const alterarUsuario = useCallback(async (userData) => {
        try {
            const response = await fetch(GOOGLE_SHEETS_ALTERAR_USUARIO_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Envia o id, status e tipo diretamente no corpo.
                body: JSON.stringify({
                    id: userData.id,
                    status: userData.status,
                    tipo: userData.tipo
                }),
            });
            const data = await response.json();
            if (!response.ok || data.status === 'error') {
                throw new Error(data.message || 'Erro ao alterar usuário');
            }
            return { success: true, data: data };
        } catch (error) {
            console.error("Erro ao alterar usuário:", error);
            return { success: false, message: error.message };
        }
    }, []);


    // --- useEffects para buscar dados periodicamente ---
    useEffect(() => {
        fetchLeadsFromSheet();
        const interval = setInterval(fetchLeadsFromSheet, 60000);
        return () => clearInterval(interval);
    }, [fetchLeadsFromSheet]);

    useEffect(() => {
        fetchLeadsFechadosFromSheet();
        const interval = setInterval(fetchLeadsFechadosFromSheet, 60000);
        return () => clearInterval(interval);
    }, [fetchLeadsFechadosFromSheet]);

    useEffect(() => {
        fetchUsuariosFromSheet();
        const interval = setInterval(fetchUsuariosFromSheet, 60000);
        return () => clearInterval(interval);
    }, [fetchUsuariosFromSheet]);


    // --- Funções de manipulação de estado local (adição/atualização) ---

    // const [ultimoFechadoId, setUltimoFechadoId] = useState(null); // Não usado no código fornecido.

    const adicionarUsuario = (usuario) => {
        // Se a adição for via GAS, o fetchUsuariosFromSheet já vai atualizar a lista.
        // Se for uma adição local antes do fetch, você pode adicionar.
        setUsuarios((prev) => [...prev, { ...usuario, id: String(prev.length + 1) }]); // Gera ID local provisório
    };

    const adicionarNovoLead = (novoLead) => {
        // Se a adição for via GAS, o fetchLeadsFromSheet já vai atualizar a lista.
        // Se for uma adição local antes do fetch, você pode adicionar.
        setLeads((prevLeads) => {
            // Verifica se o lead já existe pelo ID (se houver) ou por outro critério único (e.g., phone)
            if (novoLead.id && prevLeads.some(lead => lead.id === novoLead.id)) {
                return prevLeads;
            }
            return [novoLead, ...prevLeads];
        });
    };

    const atualizarStatusLead = async (id, novoStatus, phone) => {
        // Primeiro, chama a API para persistir a mudança
        const result = await saveLead(id, novoStatus);

        if (result.success) {
            // Atualiza o estado local apenas se a API for bem-sucedida
            setLeads((prev) =>
                prev.map((lead) =>
                    String(lead.id) === String(id) ? { ...lead, status: novoStatus, confirmado: true } : lead
                )
            );

            // Lógica para Leads Fechados/Perdidos
            if (novoStatus === 'Fechado' || novoStatus === 'Perdido') {
                // Força um re-fetch dos leads fechados para garantir que a aba esteja atualizada
                fetchLeadsFechadosFromSheet();
            }
        } else {
            alert(`Falha ao atualizar status do lead: ${result.message}`);
        }
    };


    const atualizarSeguradoraLead = (id, seguradora) => {
        // Esta função provavelmente atualizaria o 'insurer' no estado 'leads' para leads não fechados.
        // Para leads fechados, a lógica está no 'confirmarSeguradoraLead'.
        // Se for necessário para leads não fechados, mantenha. Caso contrário, pode ser removida.
        setLeads((prev) =>
            prev.map((lead) =>
                String(lead.id) === String(id)
                    ? { ...lead, insurer: seguradora, premioLiquido: "", comissao: "", parcelamento: "", VigenciaFinal: "" }
                    : lead
            )
        );
    };

    const confirmarSeguradoraLead = async (id, premio, seguradora, comissao, parcelamento, vigenciaFinal) => {
        const leadToUpdate = leadsFechados.find((lead) => String(lead.ID) === String(id));

        if (!leadToUpdate) {
            console.error(`Lead com ID ${id} não encontrado na lista de leads fechados.`);
            return;
        }

        const updatedLeadData = {
            ...leadToUpdate,
            Seguradora: seguradora,
            PremioLiquido: parseFloat(premio), // Garante que é um número
            Comissao: parseFloat(comissao),   // Garante que é um número
            Parcelamento: parseInt(parcelamento.replace("x", ""), 10) || 0, // Garante que é um número
            VigenciaFinal: vigenciaFinal || '', // Já vem como YYYY-MM-DD
        };

        const result = await alterarSeguradora(updatedLeadData);

        if (result.success) {
            // Atualiza o estado local apenas se a API for bem-sucedida
            setLeadsFechados((prev) =>
                prev.map((l) =>
                    String(l.ID) === String(id) ? {
                        ...l,
                        insurerConfirmed: true,
                        Seguradora: seguradora,
                        PremioLiquido: parseFloat(premio),
                        Comissao: parseFloat(comissao),
                        Parcelamento: parseInt(parcelamento.replace("x", ""), 10) || 0,
                        VigenciaFinal: vigenciaFinal || ''
                    } : l
                )
            );
            alert('Seguradora e detalhes do lead fechado atualizados com sucesso!');
        } else {
            alert(`Falha ao confirmar seguradora: ${result.message}`);
        }
    };


    const atualizarDetalhesLeadFechado = (id, campo, valor) => {
        // Esta função atualiza o estado local, mas as mudanças devem ser persistidas via `alterarSeguradora`
        // quando o usuário finalizar a edição (e.g., salvar um formulário).
        setLeadsFechados((prev) =>
            prev.map((lead) =>
                String(lead.ID) === String(id) ? { ...lead, [campo]: valor } : lead
            )
        );
    };

    const handleTransferLead = async (leadId, responsavelId) => {
        const usuarioParaTransferir = usuarios.find((u) => String(u.id) === String(responsavelId));

        if (!usuarioParaTransferir) {
            alert('Usuário responsável não encontrado.');
            return;
        }

        const result = await transferLead(leadId, usuarioParaTransferir.nome);

        if (result.success) {
            setLeads((prev) =>
                prev.map((lead) =>
                    String(lead.id) === String(leadId) ? { ...lead, responsavel: usuarioParaTransferir.nome } : lead
                )
            );
            alert('Lead transferido com sucesso!');
        } else {
            alert(`Falha ao transferir lead: ${result.message}`);
        }
    };


    const handleAtualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
        const usuarioParaAtualizar = usuarios.find((u) => String(u.id) === String(id));
        if (!usuarioParaAtualizar) return;

        const updatedData = { id: usuarioParaAtualizar.id };
        if (novoStatus !== null) updatedData.status = novoStatus;
        if (novoTipo !== null) updatedData.tipo = novoTipo;

        const result = await alterarUsuario(updatedData);

        if (result.success) {
            setUsuarios((prev) =>
                prev.map((usuario) =>
                    String(usuario.id) === String(id)
                        ? {
                            ...usuario,
                            ...(novoStatus !== null ? { status: novoStatus } : {}),
                            ...(novoTipo !== null ? { tipo: novoTipo } : {}),
                        }
                        : usuario
                )
            );
            alert('Usuário atualizado com sucesso!');
        } else {
            alert(`Falha ao atualizar usuário: ${result.message}`);
        }
    };


    const onAbrirLead = (lead) => {
        setLeadSelecionado(lead);

        let path = '/leads';
        if (lead.status === 'Fechado') path = '/leads-fechados';
        else if (lead.status === 'Perdido') path = '/leads-perdidos';

        navigate(path);
    };

    const handleLogin = () => {
        const usuarioEncontrado = usuarios.find(
            (u) => u.usuario === loginInput && u.senha === senhaInput && u.status === 'Ativo'
        );

        if (usuarioEncontrado) {
            setIsAuthenticated(true);
            setUsuarioLogado(usuarioEncontrado);
            // Redireciona para o dashboard apropriado após o login
            if (usuarioEncontrado.tipo === 'Admin') {
                navigate('/dashboard');
            } else {
                navigate('/dashboard'); // Ou '/user-dashboard' se tiver um separado
            }
        } else {
            alert('Login ou senha inválidos ou usuário inativo.');
        }
    };

    // Renderização do Login ou da Aplicação Principal
    if (!isAuthenticated) {
        return (
            <div
                className={`flex items-center justify-center min-h-screen bg-cover bg-center transition-opacity duration-1000 ${
                    backgroundLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                    backgroundImage: `url('/background.png')`,
                }}
            >
                <div className="bg-blue-900 bg-opacity-60 text-white p-10 rounded-2xl shadow-2xl w-full max-w-sm">
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-12 h-12 mb-2 flex items-center justify-center text-4xl text-yellow-400">
                            👑
                        </div>
                        <h1 className="text-xl font-semibold">GRUPO</h1>
                        <h2 className="text-2xl font-bold text-white">PRIMME SEGUROS</h2>
                        <p className="text-sm text-white">CORRETORA DE SEGUROS</p>
                    </div>

                    <input
                        type="text"
                        placeholder="Usuário"
                        value={loginInput}
                        onChange={(e) => setLoginInput(e.target.value)}
                        className="w-full mb-4 px-4 py-2 rounded text-black"
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={senhaInput}
                        onChange={(e) => setSenhaInput(e.target.value)}
                        className="w-full mb-2 px-4 py-2 rounded text-black"
                    />
                    <div className="text-right text-sm mb-4">
                        <a href="#" className="text-white underline">
                            Esqueci minha senha
                        </a>
                    </div>
                    <button
                        onClick={handleLogin}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        ENTRAR
                    </button>
                </div>
            </div>
        );
    }

    const isAdmin = usuarioLogado?.tipo === 'Admin';

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <Sidebar isAdmin={isAdmin} nomeUsuario={usuarioLogado} />

            <main style={{ flex: 1, overflow: 'auto' }}>
                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route
                        path="/dashboard"
                        element={
                            <Dashboard
                                leadsClosed={
                                    isAdmin
                                        ? leadsFechados
                                        : leadsFechados.filter((lead) => lead.Responsavel === usuarioLogado.nome)
                                }
                                leads={
                                    isAdmin
                                        ? leads
                                        : leads.filter((lead) => lead.responsavel === usuarioLogado.nome)
                                }
                                usuarioLogado={usuarioLogado}
                            />
                        }
                    />
                    <Route
                        path="/leads"
                        element={
                            <Leads
                                leads={isAdmin ? leads : leads.filter((lead) => lead.responsavel === usuarioLogado.nome)}
                                usuarios={usuarios}
                                onUpdateStatus={atualizarStatusLead}
                                fetchLeadsFromSheet={fetchLeadsFromSheet}
                                transferirLead={handleTransferLead} // Use o handleTransferLead
                                usuarioLogado={usuarioLogado}
                            />
                        }
                    />
                    <Route
                        path="/leads-fechados"
                        element={
                            <LeadsFechados
                                leads={isAdmin ? leadsFechados : leadsFechados.filter((lead) => lead.Responsavel === usuarioLogado.nome)}
                                usuarios={usuarios}
                                onUpdateInsurer={atualizarSeguradoraLead}
                                onConfirmInsurer={confirmarSeguradoraLead}
                                onUpdateDetalhes={atualizarDetalhesLeadFechado}
                                fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                                isAdmin={isAdmin}
                                // ultimoFechadoId={ultimoFechadoId} // Não usado no código, pode remover
                                onAbrirLead={onAbrirLead}
                                leadSelecionado={leadSelecionado}
                                formatarDataParaExibicao={formatarDataParaExibicao}
                            />
                        }
                    />
                    <Route
                        path="/leads-perdidos"
                        element={
                            <LeadsPerdidos
                                leads={isAdmin ? leads : leads.filter((lead) => lead.responsavel === usuarioLogado.nome)}
                                usuarios={usuarios}
                                fetchLeadsFromSheet={fetchLeadsFromSheet}
                                onAbrirLead={onAbrirLead}
                                isAdmin={isAdmin}
                                leadSelecionado={leadSelecionado}
                            />
                        }
                    />
                    <Route path="/buscar-lead" element={<BuscarLead
                        leads={leads}
                        fetchLeadsFromSheet={fetchLeadsFromSheet}
                        fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                    />} />
                    <Route
                        path="/criar-lead"
                        element={<CriarLead adicionarLead={adicionarNovoLead} createLead={createLead} />}
                    />
                    {isAdmin && (
                        <>
                            <Route path="/criar-usuario" element={<CriarUsuario adicionarUsuario={adicionarUsuario} createUser={createUser} />} />
                            <Route
                                path="/usuarios"
                                element={
                                    <Usuarios
                                        leads={isAdmin ? leads : leads.filter((lead) => lead.responsavel === usuarioLogado.nome)}
                                        usuarios={usuarios}
                                        fetchLeadsFromSheet={fetchLeadsFromSheet}
                                        fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                                        atualizarStatusUsuario={handleAtualizarStatusUsuario} // Use o handleAtualizarStatusUsuario
                                    />
                                }
                            />
                        </>
                    )}
                    <Route path="/ranking" element={<Ranking
                        usuarios={usuarios}
                        fetchLeadsFromSheet={fetchLeadsFromSheet}
                        fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                        leads={leads}
                        // Não há um fetchRankingData no código que você forneceu, mas seria o lugar para passar se existir
                        // fetchRankingData={fetchRankingData}
                    />} />
                    <Route path="*" element={<h1 style={{ padding: 20 }}>Página não encontrada</h1>} />
                </Routes>
            </main>
        </div>
    );
};

export default App;
