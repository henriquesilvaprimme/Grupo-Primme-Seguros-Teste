import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Importe suas URLs centralizadas
import { API_ENDPOINTS } from './config/api';

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

// Função utilitária para formatar a data para exibição no frontend (DD/Mês/AA)
const formatarDataParaExibicao = (dataString) => {
  if (!dataString) return '';
  try {
    let dateObj;
    // Tenta reconhecer o formato YYYY-MM-DD (que o GAS enviaria)
    const partesHifen = dataString.match(/^(\d{4})-(\d{2})-(\d{2})(T.*)?$/); // Inclui T para ISO
    if (partesHifen) {
      dateObj = new Date(dataString); // Date constructor pode lidar com ISO 8601
    } else {
      // Se não for YYYY-MM-DD, tenta parsear DD/MM/YYYY (do Sheets como texto)
      const partesBarra = dataString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (partesBarra) {
        dateObj = new Date(`${partesBarra[3]}-${partesBarra[2]}-${partesBarra[1]}T00:00:00`);
      } else {
        // Última tentativa de parsear qualquer formato válido
        dateObj = new Date(dataString);
      }
    }

    if (isNaN(dateObj.getTime())) {
      console.warn('formatarDataParaExibicao: Data inválida detectada:', dataString);
      return dataString; // Retorna a string original se inválido
    }

    const dia = String(dateObj.getDate()).padStart(2, '0');
    const mesIndex = dateObj.getMonth();
    const ano = dateObj.getFullYear();
    const nomeMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
                       "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const mesExtenso = nomeMeses[mesIndex];
    const anoCurto = String(ano).substring(2);

    return `${dia}/${mesExtenso}/${anoCurto}`; // Ex: 08/Julho/25
  } catch (e) {
    console.error("Erro na função formatarDataParaExibicao:", e);
    return dataString; // Em caso de erro, retorna a string original
  }
};


const App = () => {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [leadsFechados, setLeadsFechados] = useState([]);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [leads, setLeads] = useState([]);
  const [leadSelecionado, setLeadSelecionado] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState(''); // Novo estado para mensagens de feedback

  useEffect(() => {
    const img = new Image();
    img.src = '/background.png';
    img.onload = () => setBackgroundLoaded(true);
  }, []);

  // --- Funções de Fetch Memoizadas com useCallback ---
  const fetchLeadsFromSheet = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_LEADS);
      const data = await response.json();

      if (Array.isArray(data)) {
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.editado);
          const dateB = new Date(b.editado);
          return dateB - dateA;
        });

        const formattedLeads = sortedData.map((item, index) => ({
          id: item.id ? Number(item.id) : index + 1,
          name: item.name || item.Name || '',
          vehicleModel: item.vehiclemodel || item.vehicleModel || '',
          vehicleYearModel: item.vehicleyearmodel || item.vehicleYearModel || '',
          city: item.city || '',
          phone: item.phone || item.Telefone || '',
          insuranceType: item.insurancetype || item.insuranceType || '',
          status: item.status || 'Selecione o status',
          confirmado: item.confirmado === 'true' || item.confirmado === true,
          insurer: item.insurer || '',
          insurerConfirmed: item.insurerConfirmed === 'true' || item.insurerConfirmed === true,
          usuarioId: item.usuarioId ? Number(item.usuarioId) : null,
          premioLiquido: item.premioLiquido || '',
          comissao: item.comissao || '',
          parcelamento: item.parcelamento || '',
          VigenciaFinal: item.VigenciaFinal || '',
          createdAt: item.data || new Date().toISOString(),
          responsavel: item.responsavel || '',
          editado: item.editado || ''
        }));

        if (!leadSelecionado) {
          setLeads(formattedLeads);
        }
      } else {
        if (!leadSelecionado) {
          setLeads([]);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      if (!leadSelecionado) {
        setLeads([]);
      }
    }
  }, [leadSelecionado]);

  const fetchLeadsFechadosFromSheet = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.GET_LEADS_FECHADOS);
      const data = await response.json();
      setLeadsFechados(data);
    } catch (error) {
      console.error('Erro ao buscar leads fechados:', error);
      setLeadsFechados([]);
    }
  }, []);

  const fetchUsuariosFromSheet = useCallback(async () => {
    try {
      console.log("Tentando buscar usuários de:", API_ENDPOINTS.GET_USUARIOS);
      const response = await fetch(API_ENDPOINTS.GET_USUARIOS);
      const data = await response.json();
      console.log("Dados de usuários recebidos do GAS:", data);

      if (Array.isArray(data)) {
        const formattedUsuarios = data.map((item) => ({
          id: item.ID || item.id || '',
          usuario: item.usuario || '',
          nome: item.nome || '',
          email: item.email || '',
          senha: item.senha || '',
          status: item.Status || 'Ativo',
          tipo: item.Tipo || 'Usuario',
        }));
        setUsuarios(formattedUsuarios);
        console.log("Usuários formatados e definidos:", formattedUsuarios);
      } else {
        setUsuarios([]);
        console.warn("Dados de usuários não são um array:", data);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários do Google Sheets:', error);
      setUsuarios([]);
    }
  }, []);

  // --- Efeitos para carregar dados e configurar o polling ---
  useEffect(() => {
    fetchLeadsFromSheet();
    fetchLeadsFechadosFromSheet();
    fetchUsuariosFromSheet();

    const leadsInterval = setInterval(fetchLeadsFromSheet, 60000);
    const leadsFechadosInterval = setInterval(fetchLeadsFechadosFromSheet, 60000);
    const usuariosInterval = setInterval(fetchUsuariosFromSheet, 60000);

    return () => {
      clearInterval(leadsInterval);
      clearInterval(leadsFechadosInterval);
      clearInterval(usuariosInterval);
    };
  }, [fetchLeadsFromSheet, fetchLeadsFechadosFromSheet, fetchUsuariosFromSheet]);


  // --- Funções de Manipulação de Dados ---
  const adicionarUsuario = async (usuario) => {
    setFeedbackMessage(''); // Limpa mensagens anteriores
    try {
      const response = await fetch(API_ENDPOINTS.POST_CRIAR_USUARIO, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(usuario),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setFeedbackMessage('✅ Usuário criado com sucesso!');
        fetchUsuariosFromSheet(); // Re-fetch para sincronizar
        return { status: 'success' };
      } else {
        setFeedbackMessage(`❌ Erro ao criar usuário: ${data.message || 'Erro desconhecido.'}`);
        return { status: 'error', message: data.message };
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      setFeedbackMessage('❌ Erro ao comunicar com o servidor para criar usuário.');
      return { status: 'error', message: error.message };
    }
  };

  const atualizarStatusLead = async (id, novoStatus, phone) => {
    setFeedbackMessage(''); // Limpa mensagens anteriores
    const leadToUpdate = leads.find((lead) => lead.phone === phone);
    if (!leadToUpdate) {
      console.error("Lead não encontrado para atualização de status.");
      setFeedbackMessage('❌ Lead não encontrado para atualização de status.');
      return { status: 'error', message: 'Lead não encontrado.' };
    }

    const originalStatus = leadToUpdate.status;
    const originalConfirmado = leadToUpdate.confirmado;

    // Otimistic update
    setLeads((prev) =>
      prev.map((lead) =>
        lead.phone === phone ? { ...lead, status: novoStatus, confirmado: true } : lead
      )
    );

    try {
      const response = await fetch(API_ENDPOINTS.POST_ALTERAR_STATUS, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ phone: phone, status: novoStatus }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        console.log('Status do lead atualizado no Google Sheets:', data.message);
        setFeedbackMessage('✅ Status do lead atualizado com sucesso!');
        fetchLeadsFromSheet();
        fetchLeadsFechadosFromSheet();
        return { status: 'success' };
      } else {
        console.error('Erro ao atualizar status do lead no Google Sheets:', data.message);
        // Reverte o estado em caso de erro
        setLeads((prev) =>
          prev.map((lead) =>
            lead.phone === phone ? { ...lead, status: originalStatus, confirmado: originalConfirmado } : lead
          )
        );
        setFeedbackMessage(`❌ Erro ao atualizar status do lead: ${data.message || 'Erro desconhecido.'}`);
        return { status: 'error', message: data.message };
      }
    } catch (error) {
      console.error('Erro na requisição para atualizar status do lead:', error);
      // Reverte o estado em caso de erro
      setLeads((prev) =>
        prev.map((lead) =>
          lead.phone === phone ? { ...lead, status: originalStatus, confirmado: originalConfirmado } : lead
        )
      );
      setFeedbackMessage('❌ Erro de comunicação com o servidor ao atualizar status.');
      return { status: 'error', message: error.message };
    }
  };

  const confirmarSeguradoraLead = async (id, premio, seguradora, comissao, parcelamento, vigenciaFinal) => {
    setFeedbackMessage(''); // Limpa mensagens anteriores
    const lead = leadsFechados.find((l) => l.ID == id);
    if (!lead) {
      console.error("Lead fechado não encontrado para confirmar seguradora.");
      setFeedbackMessage('❌ Lead fechado não encontrado para confirmar seguradora.');
      return { status: 'error', message: 'Lead não encontrado.' };
    }

    const originalLeadData = { ...lead };

    const updatedLeadData = {
      ID: lead.ID,
      Seguradora: seguradora,
      PremioLiquido: parseFloat(premio),
      Comissao: parseFloat(comissao),
      Parcelamento: parcelamento,
      VigenciaFinal: vigenciaFinal // VigenciaFinal já deve vir no formato YYYY-MM-DD
    };

    setLeadsFechados((prev) =>
      prev.map((l) =>
        l.ID === id
          ? {
              ...l,
              Seguradora: seguradora,
              PremioLiquido: premio,
              Comissao: comissao,
              Parcelamento: parcelamento,
              VigenciaFinal: vigenciaFinal,
              insurerConfirmed: true,
            }
          : l
      )
    );

    try {
      const response = await fetch(API_ENDPOINTS.POST_ALTERAR_SEGURADORA, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ lead: updatedLeadData }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        console.log('Seguradora e detalhes atualizados no Google Sheets:', data.message);
        setFeedbackMessage('✅ Seguradora e detalhes atualizados com sucesso!');
        fetchLeadsFechadosFromSheet();
        return { status: 'success' };
      } else {
        console.error('Erro ao atualizar seguradora no Google Sheets:', data.message);
        setLeadsFechados((prev) =>
          prev.map((l) => (l.ID === id ? originalLeadData : l))
        );
        setFeedbackMessage(`❌ Erro ao atualizar seguradora: ${data.message || 'Erro desconhecido.'}`);
        return { status: 'error', message: data.message };
      }
    } catch (error) {
      console.error('Erro na requisição para confirmar seguradora:', error);
      setLeadsFechados((prev) =>
        prev.map((l) => (l.ID === id ? originalLeadData : l))
      );
      setFeedbackMessage('❌ Erro de comunicação com o servidor ao confirmar seguradora.');
      return { status: 'error', message: error.message };
    }
  };

  const transferirLead = async (leadId, responsavelId) => {
    setFeedbackMessage(''); // Limpa mensagens anteriores
    const leadToUpdate = leads.find((lead) => lead.id === leadId);
    if (!leadToUpdate) {
      console.error("Lead não encontrado para transferência.");
      setFeedbackMessage('❌ Lead não encontrado para transferência.');
      return { status: 'error', message: 'Lead não encontrado.' };
    }

    const originalResponsavel = leadToUpdate.responsavel;

    let usuarioNome = null;
    if (responsavelId !== null) {
      let usuario = usuarios.find((u) => u.id == responsavelId);
      if (!usuario) {
        console.error("Usuário responsável não encontrado.");
        setFeedbackMessage('❌ Usuário responsável não encontrado.');
        return { status: 'error', message: 'Usuário responsável não encontrado.' };
      }
      usuarioNome = usuario.nome;
    }

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, responsavel: usuarioNome } : lead
      )
    );

    try {
      const response = await fetch(API_ENDPOINTS.POST_ALTERAR_ATRIBUIDO, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ id: leadId, usuarioId: responsavelId }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        console.log('Lead transferido no Google Sheets:', data.message);
        setFeedbackMessage('✅ Lead transferido com sucesso!');
        fetchLeadsFromSheet();
        return { status: 'success' };
      } else {
        console.error('Erro ao transferir lead no Google Sheets:', data.message);
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, responsavel: originalResponsavel } : lead
          )
        );
        setFeedbackMessage(`❌ Erro ao transferir lead: ${data.message || 'Erro desconhecido.'}`);
        return { status: 'error', message: data.message };
      }
    } catch (error) {
      console.error('Erro na requisição para transferir lead:', error);
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, responsavel: originalResponsavel } : lead
        )
      );
      setFeedbackMessage('❌ Erro de comunicação com o servidor ao transferir lead.');
      return { status: 'error', message: error.message };
    }
  };

  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    setFeedbackMessage(''); // Limpa mensagens anteriores
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) {
      setFeedbackMessage('❌ Usuário não encontrado para atualização.');
      return { status: 'error', message: 'Usuário não encontrado.' };
    }

    const originalStatus = usuario.status;
    const originalTipo = usuario.tipo;

    const updateData = {
      usuario: {
        id: id,
        status: novoStatus !== null ? novoStatus : usuario.status,
        tipo: novoTipo !== null ? novoTipo : usuario.tipo,
      },
    };

    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              ...(novoStatus !== null ? { status: novoStatus } : {}),
              ...(novoTipo !== null ? { tipo: novoTipo } : {}),
            }
          : u
      )
    );

    try {
      const response = await fetch(API_ENDPOINTS.POST_ALTERAR_USUARIO, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      if (data.status === 'success') {
        console.log('Status/Tipo do usuário atualizado no Google Sheets:', data.message);
        setFeedbackMessage('✅ Status/Tipo do usuário atualizado com sucesso!');
        fetchUsuariosFromSheet();
        return { status: 'success' };
      } else {
        console.error('Erro ao atualizar usuário no Google Sheets:', data.message);
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, status: originalStatus, tipo: originalTipo } : u
          )
        );
        setFeedbackMessage(`❌ Erro ao atualizar usuário: ${data.message || 'Erro desconhecido.'}`);
        return { status: 'error', message: data.message };
      }
    } catch (error) {
      console.error('Erro na requisição para atualizar usuário:', error);
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status: originalStatus, tipo: originalTipo } : u
        )
      );
      setFeedbackMessage('❌ Erro de comunicação com o servidor ao atualizar usuário.');
      return { status: 'error', message: error.message };
    }
  };

  // Função para criar leads, passada para CriarLead.jsx
  const onCreateLead = async (novoLeadData) => {
    setFeedbackMessage(''); // Limpa mensagens anteriores
    try {
      const response = await fetch(API_ENDPOINTS.POST_CRIAR_LEAD, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(novoLeadData),
      });

      const data = await response.json();
      if (data.status === 'success') {
        console.log('Lead criado com sucesso no Google Sheets:', data.message);
        setFeedbackMessage('✅ Lead criado com sucesso!');
        fetchLeadsFromSheet(); // Atualiza a lista de leads
        return { status: 'success' };
      } else {
        console.error('Erro ao criar lead no Google Sheets:', data.message);
        setFeedbackMessage(`❌ Erro ao criar lead: ${data.message || 'Erro desconhecido.'}`);
        return { status: 'error', message: data.message };
      }
    } catch (error) {
      console.error('Erro na requisição para criar lead:', error);
      setFeedbackMessage('❌ Erro de comunicação com o servidor ao criar lead.');
      return { status: 'error', message: error.message };
    }
  };


  const atualizarDetalhesLeadFechado = (id, campo, valor) => {
    setLeadsFechados((prev) =>
      prev.map((lead) =>
        lead.ID === id ? { ...lead, [campo]: valor } : lead
      )
    );
  };

  const onAbrirLead = (lead) => {
    setLeadSelecionado(lead);

    let path = '/leads';
    if (lead.status === 'Fechado') path = '/leads-fechados';
    else if (lead.status === 'Perdido') path = '/leads-perdidos';

    navigate(path);
  };

  // --- Lógica de Login ---
  const handleLogin = () => {
    setFeedbackMessage(''); // Limpa mensagens anteriores
    console.log("Tentando login com:", loginInput, senhaInput);
    console.log("Usuários disponíveis para comparação:", usuarios);

    const usuarioEncontrado = usuarios.find(
      (u) =>
        String(u.usuario).trim() === String(loginInput).trim() &&
        String(u.senha).trim() === String(senhaInput).trim() &&
        String(u.status).trim() === 'Ativo'
    );

    if (usuarioEncontrado) {
      console.log("Usuário encontrado:", usuarioEncontrado);
      setIsAuthenticated(true);
      setUsuarioLogado(usuarioEncontrado);
      setFeedbackMessage('✅ Login realizado com sucesso!');
    } else {
      console.warn("Nenhum usuário encontrado com as credenciais ou status inativo.");
      setFeedbackMessage('❌ Login ou senha inválidos ou usuário inativo.');
    }
  };

  // --- Renderização Condicional do Login ---
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
          {feedbackMessage && (
            <p className={`mt-4 text-center ${feedbackMessage.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
              {feedbackMessage}
            </p>
          )}
        </div>
      </div>
    );
  }

  // --- Layout Principal (Após Login) ---
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
                    : leadsFechados.filter((lead) => String(lead.Responsavel).trim() === String(usuarioLogado.nome).trim())
                }
                leads={
                  isAdmin
                    ? leads
                    : leads.filter((lead) => String(lead.responsavel).trim() === String(usuarioLogado.nome).trim())
                }
                usuarioLogado={usuarioLogado}
              />
            }
          />
          <Route
            path="/leads"
            element={
              <Leads
                leads={isAdmin ? leads : leads.filter((lead) => String(lead.responsavel).trim() === String(usuarioLogado.nome).trim())}
                usuarios={usuarios}
                onUpdateStatus={atualizarStatusLead}
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                transferirLead={transferirLead}
                usuarioLogado={usuarioLogado}
              />
            }
          />
          <Route
            path="/leads-fechados"
            element={
              <LeadsFechados
                leads={isAdmin ? leadsFechados : leadsFechados.filter((lead) => String(lead.Responsavel).trim() === String(usuarioLogado.nome).trim())}
                usuarios={usuarios}
                onConfirmInsurer={confirmarSeguradoraLead}
                onUpdateDetalhes={atualizarDetalhesLeadFechado}
                fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                isAdmin={isAdmin}
                leadSelecionado={leadSelecionado}
                formatarDataParaExibicao={formatarDataParaExibicao}
              />
            }
          />
          <Route
            path="/leads-perdidos"
            element={
              <LeadsPerdidos
                leads={isAdmin ? leads : leads.filter((lead) => String(lead.responsavel).trim() === String(usuarioLogado.nome).trim())}
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
            element={<CriarLead onCreateLead={onCreateLead} />}
          />
          {isAdmin && (
            <>
              <Route path="/criar-usuario" element={<CriarUsuario adicionarUsuario={adicionarUsuario} />} />
              <Route
                path="/usuarios"
                element={
                  <Usuarios
                    leads={isAdmin ? leads : leads.filter((lead) => String(lead.responsavel).trim() === String(usuarioLogado.nome).trim())}
                    usuarios={usuarios}
                    fetchLeadsFromSheet={fetchLeadsFromSheet}
                    fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                    atualizarStatusUsuario={atualizarStatusUsuario}
                  />
                }
              />
            </>
          )}
          <Route path="/ranking" element={<Ranking
            usuarios={usuarios}
            leads={leads}
            leadsFechados={leadsFechados}
            fetchLeadsFromSheet={fetchLeadsFromSheet}
            fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
          />} />
          <Route path="*" element={<h1 style={{ padding: 20 }}>Página não encontrada</h1>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
