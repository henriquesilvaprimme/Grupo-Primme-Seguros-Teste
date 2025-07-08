import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Importe suas URLs centralizadas
import { API_ENDPOINTS } from './config/api'; // Ajuste o caminho se necessário

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Leads from './Leads';
import LeadsFechados from './LeadsFechados';
import LeadsPerdidos from './LeadsPerdidos';
import BuscarLead from './BuscarLead'; // Caminho corrigido conforme a discussão anterior
import CriarUsuario from './pages/CriarUsuario';
import Usuarios from './pages/Usuarios';
import Ranking from './pages/Ranking';


const App = () => {
  const navigate = useNavigate();

  // ... (seus estados existentes) ...
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [leadsFechados, setLeadsFechados] = useState([]);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [leads, setLeads] = useState([]);
  const [leadSelecionado, setLeadSelecionado] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [ultimoFechadoId, setUltimoFechadoId] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/background.png';
    img.onload = () => setBackgroundLoaded(true);
  }, []);

  // Funções de fetch memoizadas com useCallback
  const fetchLeadsFromSheet = useCallback(async () => {
    try {
      // Usando a URL do API_ENDPOINTS
      const response = await fetch(API_ENDPOINTS.GET_LEADS);
      const data = await response.json();

      if (Array.isArray(data)) {
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.editado);
          const dateB = new Date(b.editado);
          return dateB - dateA; // decrescente (mais recente no topo)
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
      // Usando a URL do API_ENDPOINTS
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
      // Usando a URL do API_ENDPOINTS
      const response = await fetch(API_ENDPOINTS.GET_USUARIOS);
      const data = await response.json();

      if (Array.isArray(data)) {
        const formattedUsuarios = data.map((item) => ({
          id: item.ID || item.id || '',
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

  // ... (Restante do seu código useEffect e funções de manipulação de dados) ...

  const adicionarUsuario = async (usuario) => {
    try {
      const newId = usuarios.length > 0 ? Math.max(...usuarios.map(u => parseInt(u.id))) + 1 : 1;

      const newUser = {
        ...usuario,
        id: newId,
        status: usuario.status || 'Ativo',
        tipo: usuario.tipo || 'Usuario',
      };

      const response = await fetch(API_ENDPOINTS.POST_CRIAR_USUARIO, { // Usando a URL do API_ENDPOINTS
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setUsuarios((prev) => [...prev, newUser]);
        alert('Usuário criado com sucesso!');
        fetchUsuariosFromSheet();
      } else {
        alert(data.message || 'Erro ao criar usuário.');
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao comunicar com o servidor para criar usuário.');
    }
  };

  const atualizarStatusLead = async (id, novoStatus, phone) => {
    const leadToUpdate = leads.find((lead) => lead.phone === phone);
    if (!leadToUpdate) {
      console.error("Lead não encontrado para atualização de status.");
      return;
    }

    const originalStatus = leadToUpdate.status;
    const originalConfirmado = leadToUpdate.confirmado;

    setLeads((prev) =>
      prev.map((lead) =>
        lead.phone === phone ? { ...lead, status: novoStatus, confirmado: true } : lead
      )
    );

    if (novoStatus === 'Fechado') {
      const jaExiste = leadsFechados.some((lead) => lead.phone === phone);

      if (jaExiste) {
        setLeadsFechados((prev) => {
          const atualizados = prev.map((lead) =>
            lead.phone === phone ? { ...lead, Status: novoStatus, confirmado: true } : lead
          );
          return atualizados;
        });
      } else {
        const novoLeadFechado = {
          ID: leadToUpdate.id || crypto.randomUUID(),
          name: leadToUpdate.name,
          vehicleModel: leadToUpdate.vehiclemodel,
          vehicleYearModel: leadToUpdate.vehicleyearmodel,
          city: leadToUpdate.city,
          phone: leadToUpdate.phone,
          insurer: leadToUpdate.insurancetype || leadToUpdate.insuranceType || "",
          Data: leadToUpdate.createdAt || new Date().toISOString(),
          Responsavel: leadToUpdate.responsavel || "",
          Status: "Fechado",
          Seguradora: leadToUpdate.Seguradora || "",
          PremioLiquido: leadToUpdate.premioLiquido || "",
          Comissao: leadToUpdate.comissao || "",
          Parcelamento: leadToUpdate.parcelamento || "",
          id: leadToUpdate.id || null,
          usuario: leadToUpdate.usuario || "",
          nome: leadToUpdate.nome || "",
          email: leadToUpdate.email || "",
          senha: leadToUpdate.senha || "",
          status: leadToUpdate.status || "Ativo",
          tipo: leadToUpdate.tipo || "Usuario",
          "Ativo/Inativo": leadToUpdate["Ativo/Inativo"] || "Ativo",
          confirmado: true
        };
        setLeadsFechados((prev) => [...prev, novoLeadFechado]);
      }
    }

    try {
      const response = await fetch(API_ENDPOINTS.POST_ALTERAR_STATUS, { // Usando a URL do API_ENDPOINTS
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
      } else {
        console.error('Erro ao atualizar status do lead no Google Sheets:', data.message);
        setLeads((prev) =>
          prev.map((lead) =>
            lead.phone === phone ? { ...lead, status: originalStatus, confirmado: originalConfirmado } : lead
          )
        );
        alert('Erro ao atualizar status do lead no servidor.');
      }
    } catch (error) {
      console.error('Erro na requisição para atualizar status do lead:', error);
      setLeads((prev) =>
        prev.map((lead) =>
          lead.phone === phone ? { ...lead, status: originalStatus, confirmado: originalConfirmado } : lead
        )
      );
      alert('Erro de comunicação com o servidor ao atualizar status.');
    }
  };

  const confirmarSeguradoraLead = async (id, premio, seguradora, comissao, parcelamento, vigenciaFinal) => {
    const lead = leadsFechados.find((l) => l.ID == id);
    if (!lead) {
      console.error("Lead fechado não encontrado para confirmar seguradora.");
      return;
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
      const response = await fetch(API_ENDPOINTS.POST_ALTERAR_SEGURADORA, { // Usando a URL do API_ENDPOINTS
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
      } else {
        console.error('Erro ao atualizar seguradora no Google Sheets:', data.message);
        setLeadsFechados((prev) =>
          prev.map((l) => (l.ID === id ? originalLeadData : l))
        );
        alert('Erro ao atualizar seguradora no servidor.');
      }
    } catch (error) {
      console.error('Erro na requisição para confirmar seguradora:', error);
      setLeadsFechados((prev) =>
        prev.map((l) => (l.ID === id ? originalLeadData : l))
      );
      alert('Erro de comunicação com o servidor ao confirmar seguradora.');
    }
  };

  const transferirLead = async (leadId, responsavelId) => {
    const leadToUpdate = leads.find((lead) => lead.id === leadId);
    if (!leadToUpdate) {
      console.error("Lead não encontrado para transferência.");
      return;
    }

    const originalResponsavel = leadToUpdate.responsavel;

    let usuarioNome = null;
    if (responsavelId !== null) {
      let usuario = usuarios.find((u) => u.id == responsavelId);
      if (!usuario) {
        console.error("Usuário responsável não encontrado.");
        return;
      }
      usuarioNome = usuario.nome;
    }

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, responsavel: usuarioNome } : lead
      )
    );

    try {
      const response = await fetch(API_ENDPOINTS.POST_ALTERAR_ATRIBUIDO, { // Usando a URL do API_ENDPOINTS
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
      } else {
        console.error('Erro ao transferir lead no Google Sheets:', data.message);
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, responsavel: originalResponsavel } : lead
          )
        );
        alert('Erro ao transferir lead no servidor.');
      }
    } catch (error) {
      console.error('Erro na requisição para transferir lead:', error);
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, responsavel: originalResponsavel } : lead
        )
      );
      alert('Erro de comunicação com o servidor ao transferir lead.');
    }
  };

  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) return;

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
      const response = await fetch(API_ENDPOINTS.POST_ALTERAR_USUARIO, { // Usando a URL do API_ENDPOINTS
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
      } else {
        console.error('Erro ao atualizar usuário no Google Sheets:', data.message);
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, status: originalStatus, tipo: originalTipo } : u
          )
        );
        alert('Erro ao atualizar usuário no servidor.');
      }
    } catch (error) {
      console.error('Erro na requisição para atualizar usuário:', error);
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, status: originalStatus, tipo: originalTipo } : u
        )
      );
      alert('Erro de comunicação com o servidor ao atualizar usuário.');
    }
  };


  // ... (resto do seu componente App.jsx) ...

  const atualizarDetalhesLeadFechado = (id, campo, valor) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id ? { ...lead, [campo]: valor } : lead
      )
    );
    // Para persistir essas mudanças, uma chamada ao GAS seria necessária aqui
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
    } else {
      alert('Login ou senha inválidos ou usuário inativo.');
    }
  };

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
                ultimoFechadoId={ultimoFechadoId}
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
                fetchLeadsFromSheet={fetchLeadsFromSheet}
                fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
                leads={leads}
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
