import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Importe suas URLs centralizadas
import { API_ENDPOINTS } from './config/api'; // Ajuste o caminho se necessário

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Leads from './Leads';
import LeadsFechados from './LeadsFechados';
import LeadsPerdidos from './LeadsPerdidos';
import BuscarLead from './BuscarLead';
import CriarUsuario from './pages/CriarUsuario';
import Usuarios from './pages/Usuarios';
import Ranking from './pages/Ranking';
import CriarLead from './pages/CriarLead'; // Importa o CriarLead

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
          vehicleModel: item.vehiclemodel || item.vehiclemodel || '',
          vehicleYearModel: item.vehicleyearmodel || item.vehicleyearmodel || '',
          city: item.city || '',
          phone: item.phone || item.Telefone || '',
          insuranceType: item.insurancetype || '',
          status: item.status || 'Selecione o status',
          confirmado: item.confirmado === 'true' || item.confirmado === true,
          insurer: item.insurer || '',
          insurerConfirmed: item.insurerConfirmed === 'true' || item.insurerConfirmed === true,
          usuarioId: item.usuarioId ? Number(item.usuarioId) : null,
          premioLiquido: item.premioLiquido || '',
          comissao: item.comissao || '',
          parcelamento: item.parcelamento || '',
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
          status: item.Status || 'Ativo', // Usar 'Status' conforme o GAS
          tipo: item.Tipo || 'Usuario',   // Usar 'Tipo' conforme o GAS
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
        alert('Usuário criado com sucesso!');
        fetchUsuariosFromSheet(); // Re-fetch para sincronizar
        return { status: 'success' };
      } else {
        alert(data.message || 'Erro ao criar usuário.');
        return { status: 'error', message: data.message };
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao comunicar com o servidor para criar usuário.');
      return { status: 'error', message: error.message };
    }
  };

  const atualizarStatusLead = async (id, novoStatus, phone) => {
    const leadToUpdate = leads.find((lead) => lead.phone === phone);
    if (!leadToUpdate) {
      console.error("Lead não encontrado para atualização de status.");
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
        alert('Erro ao atualizar status do lead no servidor.');
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
      alert('Erro de comunicação com o servidor ao atualizar status.');
      return { status: 'error', message: error.message };
    }
  };

  const confirmarSeguradoraLead = async (id, premio, seguradora, comissao, parcelamento, vigenciaFinal) => {
    const lead = leadsFechados.find((l) => l.ID == id);
    if (!lead) {
      console.error("Lead fechado não encontrado para confirmar seguradora.");
      return { status: 'error', message: 'Lead não encontrado.' };
    }

    const originalLeadData = { ...lead };

    const updatedLeadData = {
      ID: lead.ID,
      Seguradora: seguradora,
      PremioLiquido: parseFloat(premio),
      Comissao: parseFloat(comissao),
      Parcelamento: parcelamento,
      VigenciaFinal: vigenciaFinal
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
        fetchLeadsFechadosFromSheet();
        return { status: 'success' };
      } else {
        console.error('Erro ao atualizar seguradora no Google Sheets:', data.message);
        setLeadsFechados((prev) =>
          prev.map((l) => (l.ID === id ? originalLeadData : l))
        );
        alert('Erro ao atualizar seguradora no servidor.');
        return { status: 'error', message: data.message };
      }
    } catch (error) {
      console.error('Erro na requisição para confirmar seguradora:', error);
      setLeadsFechados((prev) =>
        prev.map((l) => (l.ID === id ? originalLeadData : l))
      );
      alert('Erro de comunicação com o servidor ao confirmar seguradora.');
      return { status: 'error', message: error.message };
    }
  };

  const transferirLead = async (leadId, responsavelId) => {
    const leadToUpdate = leads.find((lead) => lead.id === leadId);
    if (!leadToUpdate) {
      console.error("Lead não encontrado para transferência.");
      return { status: 'error', message: 'Lead não encontrado.' };
    }

    const originalResponsavel = leadToUpdate.responsavel;

    let usuarioNome = null;
    if (responsavelId !== null) {
      let usuario = usuarios.find((u) => u.id == responsavelId);
      if (!usuario) {
        console.error("Usuário responsável não encontrado.");
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
        fetchLeadsFromSheet();
        return { status: 'success' };
      } else {
        console.error('Erro ao transferir lead no Google Sheets:', data.message);
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, responsavel: originalResponsavel } : lead
          )
        );
        alert('Erro ao transferir lead no servidor.');
        return { status: 'error', message: data.message };
      }
    } catch (error) {
      console.error('Erro na requisição para transferir lead:', error);
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, responsavel: originalResponsavel } : lead
        )
      );
      alert('Erro de comunicação com o servidor ao transferir lead.');
      return { status: 'error', message: error.message };
    }
  };

  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) return { status: 'error', message: 'Usuário não encontrado.' };

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
        fetchUsuariosFromSheet();
        return { status: 'success' };
      } else {
        console.error('Erro ao atualizar usuário no Google Sheets:', data.message);
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, status: originalStatus, tipo: originalTipo } : u
          )
        );
        alert('Erro ao atualizar usuário no servidor.');
        return { status: 'error', message: data.message };
      }
    } catch (error) {
      console.error('Erro na requisição para atualizar usuário:', error);
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status: originalStatus, tipo: originalTipo } : u
        )
      );
      alert('Erro de comunicação com o servidor ao atualizar usuário.');
      return { status: 'error', message: error.message };
    }
  };

  // Nova função para criar leads, passada para CriarLead.jsx
  const onCreateLead = async (novoLeadData) => {
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
        fetchLeadsFromSheet(); // Atualiza a lista de leads
        return { status: 'success' };
      } else {
        console.error('Erro ao criar lead no Google Sheets:', data.message);
        return { status: 'error', message: data.message };
      }
    } catch (error) {
      console.error('Erro na requisição para criar lead:', error);
      return { status: 'error', message: error.message };
    }
  };


  const atualizarDetalhesLeadFechado = (id, campo, valor) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id ? { ...lead, [campo]: valor } : lead
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
    } else {
      console.warn("Nenhum usuário encontrado com as credenciais ou status inativo.");
      alert('Login ou senha inválidos ou usuário inativo.');
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
                transferirLead={transferirLead}
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
                onConfirmInsurer={confirmarSeguradoraLead}
                onUpdateDetalhes={atualizarDetalhesLeadFechado}
                fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                isAdmin={isAdmin}
                // ultimoFechadoId={ultimoFechadoId} // Não usado no LeadsFechados atual
                onAbrirLead={onAbrirLead}
                leadSelecionado={leadSelecionado}
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
          <Route
            path="/buscar-lead"
            element={
              <BuscarLead
                leads={leads}
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
              />
            }
          />
          <Route
            path="/criar-lead"
            element={<CriarLead onCreateLead={onCreateLead} />} // Passa a nova prop
          />
          {isAdmin && (
            <>
              <Route path="/criar-usuario" element={<CriarUsuario adicionarUsuario={adicionarUsuario} />} />
              <Route
                path="/usuarios"
                element={
                  <Usuarios
                    leads={isAdmin ? leads : leads.filter((lead) => lead.responsavel === usuarioLogado.nome)}
                    usuarios={usuarios}
                    fetchLeadsFromSheet={fetchLeadsFromSheet}
                    fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                    atualizarStatusUsuario={atualizarStatusUsuario}
                  />
                }
              />
            </>
          )}
          <Route
            path="/ranking"
            element={
              <Ranking
                usuarios={usuarios}
                // Passa leads e leadsFechados para o Ranking
                leads={leads}
                leadsFechados={leadsFechados}
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
              />
            }
          />
          <Route path="*" element={<h1 style={{ padding: 20 }}>Página não encontrada</h1>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
