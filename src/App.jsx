import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Leads from './Leads';
import LeadsFechados from './LeadsFechados';
import LeadsPerdidos from './LeadsPerdidos';
import BuscarLead from './BuscarLead';
import CriarUsuario from './pages/CriarUsuario';
import Usuarios from './pages/Usuarios';
import Ranking from './pages/Ranking';

// Consolidate your GAS URLs.
// It's good practice to have a base URL and append parameters.
const BASE_GAS_URL = 'https://script.google.com/macros/s/AKfycbzJ_WH3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec';

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
  const [ultimoFechadoId, setUltimoFechadoId] = useState(null); // This state seems unused in your current code.

  useEffect(() => {
    const img = new Image();
    img.src = '/background.png';
    img.onload = () => setBackgroundLoaded(true);
  }, []);

  // Use useCallback to memoize fetch functions to avoid unnecessary re-renders
  // and issues with useEffect dependencies.

  const fetchLeadsFromSheet = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_GAS_URL}?v=getLeads`);
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
  }, [leadSelecionado]); // leadSelecionado as a dependency for useCallback

  const fetchLeadsFechadosFromSheet = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_GAS_URL}?v=pegar_clientes_fechados`);
      const data = await response.json();
      setLeadsFechados(data);
    } catch (error) {
      console.error('Erro ao buscar leads fechados:', error);
      setLeadsFechados([]);
    }
  }, []); // No dependencies, as it fetches all closed leads

  const fetchUsuariosFromSheet = useCallback(async () => {
    try {
      const response = await fetch(`${BASE_GAS_URL}?v=pegar_usuario`);
      const data = await response.json();

      if (Array.isArray(data)) {
        const formattedUsuarios = data.map((item, index) => ({
          id: item.ID || item.id || '', // Using item.ID based on your GAS output for 'pegar_usuario'
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
  }, []); // No dependencies, as it fetches all users

  // Initial data fetch and polling setup
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
  }, [fetchLeadsFromSheet, fetchLeadsFechadosFromSheet, fetchUsuariosFromSheet]); // Dependencies for useEffect

  // Function to add a new user (called from CriarUsuario)
  const adicionarUsuario = async (usuario) => {
    try {
      // Find the next available ID by checking existing users
      const newId = usuarios.length > 0 ? Math.max(...usuarios.map(u => parseInt(u.id))) + 1 : 1;

      const newUser = {
        ...usuario,
        id: newId, // Assign the new ID
        status: usuario.status || 'Ativo',
        tipo: usuario.tipo || 'Usuario',
      };

      const response = await fetch(`${BASE_GAS_URL}?v=criar_usuario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Crucial for GAS doPost
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json(); // Assuming GAS returns a JSON response now

      if (data.status === 'success') {
        setUsuarios((prev) => [...prev, newUser]); // Update local state
        alert('Usuário criado com sucesso!');
        fetchUsuariosFromSheet(); // Re-fetch to ensure sync
      } else {
        alert(data.message || 'Erro ao criar usuário.');
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao comunicar com o servidor para criar usuário.');
    }
  };

  const limparCamposLead = (lead) => ({
    ...lead,
    premioLiquido: "",
    comissao: "",
    parcelamento: "",
  });

  const atualizarStatusLead = async (id, novoStatus, phone) => {
    try {
      // Find the lead to get its original data before updating status
      const leadToUpdate = leads.find((lead) => lead.phone === phone);
      if (!leadToUpdate) {
        console.error("Lead não encontrado para atualização de status.");
        return;
      }

      // Optimistic UI update: update local state immediately
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
            id: leadToUpdate.id || null, // Keep original ID if available, for matching
            usuario: leadToUpdate.usuario || "",
            nome: leadToUpdate.nome || "",
            email: leadToUpdate.email || "",
            senha: leadToUpdate.senha || "",
            status: leadToUpdate.status || "Ativo", // This refers to user status in some contexts, be careful
            tipo: leadToUpdate.tipo || "Usuario", // This refers to user type
            "Ativo/Inativo": leadToUpdate["Ativo/Inativo"] || "Ativo", // Check this column name
            confirmado: true
          };
          setLeadsFechados((prev) => [...prev, novoLeadFechado]);
        }
      }

      // Now, send the update to Google Apps Script
      const response = await fetch(`${BASE_GAS_URL}?v=alterar_status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Crucial for GAS doPost
        },
        body: JSON.stringify({ phone: phone, status: novoStatus }),
      });

      const data = await response.json(); // Assuming GAS returns JSON
      if (data.status === 'success') {
        console.log('Status do lead atualizado no Google Sheets:', data.message);
        // Re-fetch data after a successful update to ensure full consistency, especially for new Leads Fechados/Perdidos
        fetchLeadsFromSheet();
        fetchLeadsFechadosFromSheet();
      } else {
        console.error('Erro ao atualizar status do lead no Google Sheets:', data.message);
        // Rollback UI if update failed on backend
        setLeads((prev) =>
          prev.map((lead) =>
            lead.phone === phone ? { ...lead, status: leadToUpdate.status, confirmado: leadToUpdate.confirmado } : lead
          )
        );
        alert('Erro ao atualizar status do lead no servidor.');
      }
    } catch (error) {
      console.error('Erro na requisição para atualizar status do lead:', error);
      alert('Erro de comunicação com o servidor ao atualizar status.');
    }
  };

  const confirmarSeguradoraLead = async (id, premio, seguradora, comissao, parcelamento, vigenciaFinal) => {
    try {
      const lead = leadsFechados.find((l) => l.ID == id);
      if (!lead) {
        console.error("Lead fechado não encontrado para confirmar seguradora.");
        return;
      }

      // Create a copy to update and send to GAS, ensuring correct keys for GAS
      const updatedLeadData = {
        ID: lead.ID,
        Seguradora: seguradora,
        PremioLiquido: parseFloat(premio), // Ensure number format
        Comissao: parseFloat(comissao),   // Ensure number format
        Parcelamento: parcelamento,       // Keep as string if it's "12x"
        VigenciaFinal: vigenciaFinal // Add new field for VigenciaFinal
      };

      // Optimistic UI update
      setLeadsFechados((prev) =>
        prev.map((l) =>
          l.ID === id
            ? {
                ...l,
                Seguradora: seguradora,
                PremioLiquido: premio,
                Comissao: comissao,
                Parcelamento: parcelamento,
                VigenciaFinal: vigenciaFinal, // Update locally
                insurerConfirmed: true,
              }
            : l
        )
      );

      const response = await fetch(`${BASE_GAS_URL}?v=alterar_seguradora`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Crucial for GAS doPost
        },
        body: JSON.stringify({ lead: updatedLeadData }),
      });

      const data = await response.json(); // Assuming GAS returns JSON
      if (data.status === 'success') {
        console.log('Seguradora e detalhes atualizados no Google Sheets:', data.message);
        fetchLeadsFechadosFromSheet(); // Re-fetch to ensure sync
      } else {
        console.error('Erro ao atualizar seguradora no Google Sheets:', data.message);
        // Rollback UI if update failed on backend
        setLeadsFechados((prev) =>
          prev.map((l) => (l.ID === id ? { ...lead, insurerConfirmed: false } : l))
        );
        alert('Erro ao atualizar seguradora no servidor.');
      }
    } catch (error) {
      console.error('Erro na requisição para confirmar seguradora:', error);
      alert('Erro de comunicação com o servidor ao confirmar seguradora.');
    }
  };

  const transferirLead = async (leadId, responsavelId) => {
    try {
      // Find the lead to update and its original responsavel
      const leadToUpdate = leads.find((lead) => lead.id === leadId);
      if (!leadToUpdate) {
        console.error("Lead não encontrado para transferência.");
        return;
      }

      let usuarioNome = null;
      if (responsavelId !== null) {
        let usuario = usuarios.find((u) => u.id == responsavelId);
        if (!usuario) {
          console.error("Usuário responsável não encontrado.");
          return;
        }
        usuarioNome = usuario.nome;
      }

      // Optimistic UI update
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, responsavel: usuarioNome } : lead
        )
      );

      // Send update to GAS
      const response = await fetch(`${BASE_GAS_URL}?v=alterar_atribuido`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Crucial for GAS doPost
        },
        body: JSON.stringify({ id: leadId, usuarioId: responsavelId }), // Send lead ID and new user ID
      });

      const data = await response.json(); // Assuming GAS returns JSON
      if (data.status === 'success') {
        console.log('Lead transferido no Google Sheets:', data.message);
        fetchLeadsFromSheet(); // Re-fetch to ensure sync
      } else {
        console.error('Erro ao transferir lead no Google Sheets:', data.message);
        // Rollback UI if update failed on backend
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === leadId ? { ...lead, responsavel: leadToUpdate.responsavel } : lead
          )
        );
        alert('Erro ao transferir lead no servidor.');
      }
    } catch (error) {
      console.error('Erro na requisição para transferir lead:', error);
      alert('Erro de comunicação com o servidor ao transferir lead.');
    }
  };


  const atualizarStatusUsuario = async (id, novoStatus = null, novoTipo = null) => {
    try {
      const usuario = usuarios.find((u) => u.id === id);
      if (!usuario) return;

      // Prepare data for GAS: only send what's relevant to the update
      const updateData = {
        usuario: {
          id: id,
          status: novoStatus !== null ? novoStatus : usuario.status,
          tipo: novoTipo !== null ? novoTipo : usuario.tipo,
        },
      };

      // Optimistic UI update
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

      const response = await fetch(`${BASE_GAS_URL}?v=alterar_usuario`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Crucial for GAS doPost
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json(); // Assuming GAS returns JSON
      if (data.status === 'success') {
        console.log('Status/Tipo do usuário atualizado no Google Sheets:', data.message);
        fetchUsuariosFromSheet(); // Re-fetch to ensure sync
      } else {
        console.error('Erro ao atualizar usuário no Google Sheets:', data.message);
        // Rollback UI if update failed on backend (requires storing original state)
        alert('Erro ao atualizar usuário no servidor.');
      }
    } catch (error) {
      console.error('Erro na requisição para atualizar usuário:', error);
      alert('Erro de comunicação com o servidor ao atualizar usuário.');
    }
  };


  // No direct `atualizarSeguradoraLead` function in your original code that uses this.
  // It seems `confirmarSeguradoraLead` handles the update.

  const atualizarDetalhesLeadFechado = (id, campo, valor) => {
    // This function likely updates only local state.
    // If these changes also need to be persisted, you'll need another GAS call.
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
                // Removed onUpdateInsurer as confirmarSeguradoraLead seems to be the main point of update
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
