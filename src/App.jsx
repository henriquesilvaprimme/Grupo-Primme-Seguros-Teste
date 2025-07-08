import React, { useState, useEffect } from 'react';
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
import CriarLead from './pages/CriarLead';

// URLs do Google Apps Script
const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=getLeads';
const GOOGLE_SHEETS_USERS = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';
const GOOGLE_SHEETS_LEADS_FECHADOS = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=pegar_clientes_fechados'

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

  const fetchLeadsFromSheet = async () => {
    try {
      const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL);
      const data = await response.json();

      if (Array.isArray(data)) {
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.editado);
          const dateB = new Date(b.editado);
          return dateB - dateA;
        });

        const formattedLeads = sortedData.map((item, index) => ({
          id: item.id ? Number(item.id) : index + 1,
          name: item.name || '',
          vehicleModel: item.vehiclemodel || '',
          vehicleYearModel: item.vehicleyearmodel || '',
          city: item.city || '',
          phone: item.phone || '',
          insuranceType: item.insurancetype || '',
          status: item.status || 'Selecione o status',
          confirmado: item.confirmado === 'true' || item.confirmado === true, // Assumindo que essa prop vem do GAS se confirmada
          insurer: item.insurer || '', // Esta deve ser a seguradora atual, se aplicável
          insurerConfirmed: item.insurerConfirmed === 'true' || item.insurerConfirmed === true,
          usuarioId: item.usuarioId ? Number(item.usuarioId) : null,
          premioLiquido: item.premioLiquido || '',
          comissao: item.comissao || '',
          parcelamento: item.parcelamento || '',
          VigenciaFinal: item.VigenciaFinal || '', // Mantenha esta aqui para leads fechados, mas para leads "normais" pode ser vazio
          createdAt: item.data || new Date().toISOString(), // Usando 'data' do GAS como 'createdAt'
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
  };

  useEffect(() => {
    fetchLeadsFromSheet();

    const interval = setInterval(() => {
      fetchLeadsFromSheet();
    }, 60000);

    return () => clearInterval(interval);
  }, [leadSelecionado]);


  // ** FUNÇÃO CORRIGIDA PARA PEGAR LEADS FECHADOS **
  const fetchLeadsFechadosFromSheet = async () => {
    try {
      const response = await fetch(GOOGLE_SHEETS_LEADS_FECHADOS);
      const data = await response.json(); // Data já vem como array de objetos

      if (Array.isArray(data)) {
        // Mapeia os dados para a estrutura esperada pelo frontend
        const formattedLeadsFechados = data.map(item => ({
          id: String(item.ID), // Use ID como string
          name: item.Name || '',
          vehicleModel: item['Vehicle Model'] || '', // Corrigido para "Vehicle Model"
          vehicleYearModel: item['Vehicle Year Model'] || '', // Corrigido para "Vehicle Year Model"
          city: item.City || '',
          phone: item.Phone || '',
          insuranceType: item['Ins. Type'] || '', // Corrigido para "Ins. Type"
          createdAt: item.Data || '', // Corrigido para "Data"
          responsavel: item.Responsavel || '',
          status: item.Status || 'Fechado', // O status deve ser "Fechado"
          insurer: item.Seguradora || '', // Corrigido para "Seguradora"
          premioLiquido: item['Premio Liquido'] || '', // Corrigido para "Premio Liquido"
          comissao: item.Comissao || '',
          parcelamento: item.Parcelamento || '',
          VigenciaFinal: item.FimVigencia || '', // **CORRIGIDO: Agora mapeia para 'FimVigencia' do GAS**
          editado: item.Editado || '', // Corrigido para "Editado"

          // Dados do usuário, se houver no objeto retornado pelo joinUsersClosed
          usuarioId: item.usuarioId || null,
          username: item.username || '',
          nomeUsuario: item.nomeUsuario || '',
          emailUsuario: item.emailUsuario || '',
          statusUsuario: item.statusUsuario || '',
          tipoUsuario: item.tipoUsuario || '',
        }));
        setLeadsFechados(formattedLeadsFechados);
      } else {
        setLeadsFechados([]);
      }
    } catch (error) {
      console.error('Erro ao buscar leads fechados:', error);
      setLeadsFechados([]);
    }
  };

  useEffect(() => {
    fetchLeadsFechadosFromSheet();

    const interval = setInterval(() => {
      fetchLeadsFechadosFromSheet();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    const fetchUsuariosFromSheet = async () => {
      try {
        const response = await fetch(GOOGLE_SHEETS_USERS + '?v=pegar_usuario');
        const data = await response.json();

        if (Array.isArray(data)) {
          const formattedUsuarios = data.map((item) => ({ // Removido index, pois não é necessário aqui
            id: item.id || '',
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
    };

    fetchUsuariosFromSheet();

    const interval = setInterval(() => {
      fetchUsuariosFromSheet();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const [ultimoFechadoId, setUltimoFechadoId] = useState(null);

  const adicionarUsuario = (usuario) => {
    setUsuarios((prev) => [...prev, { ...usuario, id: prev.length + 1 }]);
  };

  const adicionarNovoLead = (novoLead) => {
    setLeads((prevLeads) => {
      // Verifica se o lead já existe pelo ID (se houver) ou por outro identificador único
      // Ajuste para usar `novoLead.ID` se essa for a propriedade única no objeto `novoLead`
      if (!prevLeads.some(lead => String(lead.id) === String(novoLead.ID))) { // Converter ambos para string para comparação
        return [novoLead, ...prevLeads];
      }
      return prevLeads;
    });
  };

  const atualizarStatusLeadAntigo = (id, novoStatus, phone) => {
    if (novoStatus === 'Fechado') {
      setLeadsFechados((prev) => {
        const atualizados = prev.map((leadsFechados) =>
          leadsFechados.phone === phone ? { ...leadsFechados, Status: novoStatus, confirmado: true } : leadsFechados
        );
        return atualizados;
      });
    }

    setLeads((prev) =>
      prev.map((lead) =>
        lead.phone === phone ? { ...lead, status: novoStatus, confirmado: true } : lead
      )
    );
  };

  const atualizarStatusLead = (id, novoStatus, phone) => {
    setLeads((prev) =>
      prev.map((lead) =>
        String(lead.phone) === String(phone) ? { ...lead, status: novoStatus, confirmado: true } : lead // Garante comparação de string
      )
    );

    if (novoStatus === 'Fechado') {
      setLeadsFechados((prev) => {
        const leadExistenteFechado = prev.find((lead) => String(lead.phone) === String(phone)); // Verifica por telefone
        if (leadExistenteFechado) {
          // Se já existe, apenas atualiza o status se necessário
          return prev.map((lead) =>
            String(lead.phone) === String(phone) ? { ...lead, Status: novoStatus, confirmado: true } : lead
          );
        } else {
          // Se não existe, encontra na lista principal e adiciona
          const leadParaAdicionar = leads.find((lead) => String(lead.phone) === String(phone));

          if (leadParaAdicionar) {
            const novoLeadFechado = {
              id: leadParaAdicionar.id || crypto.randomUUID(), // Usar `id` como chave principal
              ID: leadParaAdicionar.id || crypto.randomUUID(), // Manter `ID` para compatibilidade com GAS
              name: leadParaAdicionar.name,
              vehicleModel: leadParaAdicionar.vehicleModel,
              vehicleYearModel: leadParaAdicionar.vehicleYearModel,
              city: leadParaAdicionar.city,
              phone: leadParaAdicionar.phone,
              // Use insuranceType do lead original, que já vem formatado
              insuranceType: leadParaAdicionar.insuranceType || leadParaAdicionar.insurer || '',
              createdAt: leadParaAdicionar.createdAt || new Date().toISOString(),
              responsavel: leadParaAdicionar.responsavel || '',
              status: "Fechado", // Já está definido aqui
              Seguradora: leadParaAdicionar.insurer || "", // Mapeia para a seguradora inicial do lead principal
              PremioLiquido: leadParaAdicionar.premioLiquido || "",
              Comissao: leadParaAdicionar.comissao || "",
              Parcelamento: leadParaAdicionar.parcelamento || "",
              VigenciaFinal: leadParaAdicionar.VigenciaFinal || "", // Mantém VigenciaFinal do lead principal
              confirmado: true
            };
            return [...prev, novoLeadFechado];
          }
          console.warn("Lead não encontrado na lista principal para adicionar aos fechados.");
          return prev;
        }
      });
    }
  };


  const atualizarSeguradoraLead = (id, seguradora) => {
    setLeadsFechados((prev) =>
      prev.map((lead) =>
        String(lead.id) === String(id) // Usar 'id'
          ? limparCamposLead({ ...lead, Seguradora: seguradora })
          : lead
      )
    );
  };

  const limparCamposLead = (lead) => ({
    ...lead,
    PremioLiquido: "",
    Comissao: "",
    Parcelamento: "",
    VigenciaFinal: "",
  });

  const confirmarSeguradoraLead = (id, premio, seguradora, comissao, parcelamento, vigenciaFinal) => {
    // Encontrar o lead na lista local de leadsFechados
    const lead = leadsFechados.find((l) => String(l.id) === String(id));

    if (!lead) {
      console.error(`Lead com ID ${id} não encontrado na lista de leads fechados.`);
      return;
    }

    // Atualiza o estado local primeiro
    setLeadsFechados((prev) => {
      const atualizados = prev.map((l) =>
        String(l.id) === String(id) ? {
          ...l,
          insurerConfirmed: true, // Se essa prop for usada
          Seguradora: seguradora,
          PremioLiquido: premio,
          Comissao: comissao,
          Parcelamento: parcelamento,
          VigenciaFinal: vigenciaFinal, // Atualiza a VigenciaFinal no estado
        } : l
      );
      return atualizados;
    });

    // Prepara os dados para enviar ao Google Apps Script (GAS)
    // Os nomes das propriedades devem coincidir com o que o GAS espera
    const dataToSend = {
      lead: {
        ID: String(lead.id), // ID do lead
        Seguradora: seguradora,
        PremioLiquido: premio,
        Comissao: comissao,
        Parcelamento: parcelamento,
        VigenciaFinal: vigenciaFinal, // Envia VigenciaFinal para o GAS
      },
    };

    try {
      fetch('https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?v=alterar_seguradora', {
        method: 'POST',
        mode: 'no-cors', // Necessário para evitar erro CORS no browser
        body: JSON.stringify(dataToSend),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(response => {
          // Como mode: 'no-cors' não permite ler a resposta,
          // assumimos sucesso se não houver erro na requisição.
          console.log("Requisição de atualização de seguradora enviada.");
          // Opcional: Re-fetch os leads fechados após um pequeno atraso para garantir que as alterações foram salvas.
          setTimeout(fetchLeadsFechadosFromSheet, 2000);
      })
      .catch(error => {
          console.error('Erro ao enviar lead para o GAS:', error);
      });
    } catch (error) {
      console.error('Erro ao preparar requisição de seguradora:', error);
    }
  };


  const atualizarDetalhesLeadFechado = (id, campo, valor) => {
    setLeadsFechados((prev) =>
      prev.map((lead) =>
        String(lead.id) === String(id) ? { ...lead, [campo]: valor } : lead
      )
    );
  };

  const transferirLead = (leadId, responsavelId) => {
    if (responsavelId === null) {
      setLeads((prev) =>
        prev.map((lead) =>
          String(lead.id) === String(leadId) ? { ...lead, responsavel: null } : lead
        )
      );
      return;
    }

    let usuario = usuarios.find((u) => String(u.id) === String(responsavelId));

    if (!usuario) {
      return;
    }

    setLeads((prev) =>
      prev.map((lead) =>
        String(lead.id) === String(leadId) ? { ...lead, responsavel: usuario.nome } : lead
      )
    );

    // Enviar a alteração para o GAS
    try {
      fetch('https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?v=alterar_atribuido', {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          id: leadId,
          usuarioId: responsavelId
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Erro ao enviar alteração de atribuição para o GAS:', error);
    }
  };

  const atualizarStatusUsuario = (id, novoStatus = null, novoTipo = null) => {
    // Encontrar o usuário na lista local
    const usuarioParaAtualizar = usuarios.find((u) => String(u.id) === String(id));
    if (!usuarioParaAtualizar) return;

    // Criar um objeto com os dados a serem enviados ao GAS
    const dataToSend = {
      usuario: {
        id: String(usuarioParaAtualizar.id), // ID é crucial para o GAS encontrar o usuário
        usuario: usuarioParaAtualizar.usuario,
        nome: usuarioParaAtualizar.nome,
        email: usuarioParaAtualizar.email,
        senha: usuarioParaAtualizar.senha,
        status: novoStatus !== null ? novoStatus : usuarioParaAtualizar.status,
        tipo: novoTipo !== null ? novoTipo : usuarioParaAtualizar.tipo,
      },
    };

    // Enviar a alteração para o GAS
    try {
      fetch('https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?v=alterar_usuario', {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(dataToSend),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(response => {
          console.log("Requisição de atualização de usuário enviada.");
          // Atualiza o estado local APÓS o envio para o GAS (ou assume sucesso)
          setUsuarios((prev) =>
              prev.map((u) =>
                  String(u.id) === String(id)
                      ? {
                          ...u,
                          ...(novoStatus !== null ? { status: novoStatus } : {}),
                          ...(novoTipo !== null ? { tipo: novoTipo } : {}),
                      }
                      : u
              )
          );
      })
      .catch(error => {
          console.error('Erro ao enviar alteração de usuário para o GAS:', error);
      });
    } catch (error) {
      console.error('Erro ao preparar requisição de usuário:', error);
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
                onUpdateInsurer={atualizarSeguradoraLead}
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
          <Route path="/buscar-lead" element={<BuscarLead
            leads={leads}
            fetchLeadsFromSheet={fetchLeadsFromSheet}
            fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
          />} />
          <Route
            path="/criar-lead"
            element={<CriarLead adicionarLead={adicionarNovoLead} />}
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
          <Route path="/ranking" element={<Ranking
            usuarios={usuarios}
            fetchLeadsFromSheet={fetchLeadsFromSheet}
            fetchLeadsFechadosFromSheet={fetchLeadsFechadosFromSheet}
            leads={leads} />} />
          <Route path="*" element={<h1 style={{ padding: 20 }}>Página não encontrada</h1>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
