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
import CriarLead from './pages/CriarLead'; // Importa o novo componente CriarLead do diretório 'pages'

// URL do Google Apps Script para buscar leads
const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=getLeads';
// URL do Google Apps Script para buscar usuários
const GOOGLE_SHEETS_USERS = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';
// URL do Google Apps Script para buscar leads fechados
const GOOGLE_SHEETS_LEADS_FECHADOS = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=pegar_clientes_fechados'

const App = () => {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [leadsFechados, setLeadsFechados] = useState([]);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [shouldRefetchLeads, setShouldRefetchLeads] = useState(false); // Novo estado para forçar o re-fetch

  // Efeito para pré-carregar a imagem de fundo
  useEffect(() => {
    const img = new Image();
    img.src = '/background.png';
    img.onload = () => setBackgroundLoaded(true);
  }, []);

  // INÍCIO - sincronização leads via Google Sheets
  const [leads, setLeads] = useState([]);
  const [leadSelecionado, setLeadSelecionado] = useState(null); // Estado para lead selecionado

  /**
   * Busca os leads da planilha Google Sheets.
   * Ordena os leads para que os mais recentes (ou recém-criados) apareçam no topo.
   */
  const fetchLeadsFromSheet = async () => {
      try {
        const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL );
        const data = await response.json();

          console.log(data)

        if (Array.isArray(data)) {
          // Ordena o array: leads com 'editado' vazio (novos) primeiro, depois por data decrescente
          const sortedData = data.sort((a, b) => {
            const dateA_editado = a.editado ? new Date(a.editado) : null;
            const dateB_editado = b.editado ? new Date(b.editado) : null;

            // Se 'editado' está vazio para 'a' mas não para 'b', 'a' vem primeiro
            if (!a.editado && b.editado) return -1;
            // Se 'editado' está vazio para 'b' mas não para 'a', 'b' vem primeiro
            if (a.editado && !b.editado) return 1;

            // Se ambos 'editado' estão vazios ou ambos estão preenchidos,
            // ordena pela data de 'editado' (se presente) ou 'data' (data de criação)
            const dateA = new Date(a.editado || a.data);
            const dateB = new Date(b.editado || b.data);

            return dateB.getTime() - dateA.getTime(); // decrescente (mais recente no topo)
          });

          // Formata os leads para o formato esperado pelo componente
          const formattedLeads = sortedData.map((item) => ({
            id: Number(item.id), // O ID agora é sempre fornecido pelo GAS
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

          console.log(formattedLeads)

          // Só atualiza leads se não houver lead selecionado para não atrapalhar o usuário
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
      } finally {
        setShouldRefetchLeads(false); // Reseta a flag após a busca
      }
    };

  // Efeito para buscar leads periodicamente ou quando um re-fetch é sinalizado
  useEffect(() => {
    fetchLeadsFromSheet(); // Busca inicial
    const interval = setInterval(() => {
      fetchLeadsFromSheet();
    }, 60000); // Atualiza a cada 60 segundos
    return () => clearInterval(interval); // Limpa o intervalo ao desmontar o componente
  }, [leadSelecionado, shouldRefetchLeads]); // Adicionada dependência para shouldRefetchLeads

  /**
   * Busca os leads fechados da planilha Google Sheets.
   */
  const fetchLeadsFechadosFromSheet = async () => {
    try {
      const response = await fetch(GOOGLE_SHEETS_LEADS_FECHADOS)
      const data = await response.json();
      setLeadsFechados(data); // Atribui os dados diretamente
    } catch (error) {
      console.error('Erro ao buscar leads fechados:', error);
      setLeadsFechados([]);
    }
  };

  // Efeito para buscar leads fechados periodicamente
  useEffect(() => {
    fetchLeadsFechadosFromSheet(); // Busca inicial
    const interval = setInterval(() => {
      fetchLeadsFechadosFromSheet();
    }, 60000); // Atualiza a cada 60 segundos
    return () => clearInterval(interval); // Limpa o intervalo
  }, []);

  const [usuarios, setUsuarios] = useState([]); // Estado para armazenar usuários

  /**
   * Busca os usuários da planilha Google Sheets.
   */
  useEffect(() => {
    const fetchUsuariosFromSheet = async () => {
      try {
        const response = await fetch(GOOGLE_SHEETS_USERS + '?v=pegar_usuario');
        const data = await response.json();

        if (Array.isArray(data)) {
          const formattedUsuarios = data.map((item) => ({
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

    fetchUsuariosFromSheet(); // Busca inicial
    const interval = setInterval(() => {
      fetchUsuariosFromSheet();
    }, 60000); // Atualiza a cada 60 segundos
    return () => clearInterval(interval); // Limpa o intervalo
  }, []);

  const [ultimoFechadoId, setUltimoFechadoId] = useState(null); // Estado para último ID fechado

  /**
   * Adiciona um novo usuário ao estado local.
   * @param {object} usuario - O objeto do usuário a ser adicionado.
   */
  const adicionarUsuario = (usuario) => {
    setUsuarios((prev) => [...prev, { ...usuario, id: prev.length + 1 }]);
  };

  /**
   * Sinaliza que um novo lead foi criado e que a lista de leads precisa ser re-buscada.
   * Não adiciona o lead diretamente ao estado aqui, pois ele será buscado completo do GAS.
   */
  const adicionarLead = (novoLead) => {
    setShouldRefetchLeads(true); // Sinaliza para o useEffect que um re-fetch é necessário
  };

  /**
   * Atualiza o status de um lead existente.
   * @param {number} id - O ID do lead.
   * @param {string} novoStatus - O novo status do lead.
   * @param {string} phone - O telefone do lead (usado para encontrar o lead).
   */
  const atualizarStatusLead = async (id, novoStatus, phone) => {
    // Atualiza leads principal no estado local imediatamente para feedback visual
    setLeads((prev) =>
      prev.map((lead) =>
        lead.phone === phone ? { ...lead, status: novoStatus, confirmado: true } : lead
      )
    );

    // Faz a chamada para o Apps Script via fetch POST para persistir a mudança
    try {
      await fetch(GOOGLE_SHEETS_USERS + '?v=alterar_status', { // Usando GOOGLE_SHEETS_USERS como base para o POST
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ id: id, status: novoStatus, phone: phone }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Após a atualização bem-sucedida no GAS, force um re-fetch completo dos leads
      setShouldRefetchLeads(true);
      // Também força um re-fetch dos leads fechados, caso o status tenha mudado para 'Fechado'
      fetchLeadsFechadosFromSheet();
    } catch (error) {
      console.error('Erro ao enviar atualização de status para o Google Apps Script:', error);
      // Opcional: Reverter o estado local se a atualização falhar
    }
    // A lógica de duplicação para Leads Fechados/Perdidos será tratada exclusivamente no GAS.
    // Não há necessidade de lógica de atualização local para leadsFechados aqui.
  };

  /**
   * Atualiza a seguradora de um lead.
   * @param {number} id - O ID do lead.
   * @param {string} seguradora - O nome da seguradora.
   */
  const atualizarSeguradoraLead = (id, seguradora) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id
          ? limparCamposLead({ ...lead, insurer: seguradora })
          : lead
      )
    );
  };

  /**
   * Limpa os campos de prêmio líquido, comissão e parcelamento de um lead.
   * @param {object} lead - O objeto lead.
   * @returns {object} O lead com os campos limpos.
   */
  const limparCamposLead = (lead) => ({
    ...lead,
    premioLiquido: "",
    comissao: "",
    parcelamento: "",
  })

  /**
   * Confirma os detalhes da seguradora para um lead fechado e envia para o GAS.
   * @param {number} id - O ID do lead.
   * @param {number} premio - O prêmio líquido.
   * @param {string} seguradora - A seguradora.
   * @param {number} comissao - A comissão.
   * @param {string} parcelamento - O parcelamento.
   */
  const confirmarSeguradoraLead = (id, premio, seguradora, comissao, parcelamento) => {
    const lead = leadsFechados.find((lead) => lead.ID == id);
    if (!lead) return;

    lead.Seguradora = seguradora;
    lead.PremioLiquido = premio;
    lead.Comissao = comissao;
    lead.Parcelamento = parcelamento;

    setLeadsFechados((prev) => {
      const atualizados = prev.map((l) =>
        l.ID === id ? { ...l, insurerConfirmed: true } : l
      );
      return atualizados;
    });

    try {
      fetch(GOOGLE_SHEETS_USERS + '?v=alterar_seguradora', { // Usando GOOGLE_SHEETS_USERS como base para o POST
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ lead: lead }),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Erro ao enviar lead:', error);
    }
  };

  /**
   * Atualiza detalhes específicos de um lead fechado.
   * @param {number} id - O ID do lead.
   * @param {string} campo - O nome do campo a ser atualizado.
   * @param {*} valor - O novo valor para o campo.
   */
  const atualizarDetalhesLeadFechado = (id, campo, valor) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id ? { ...lead, [campo]: valor } : lead
      )
    );
  };

  /**
   * Transfere a responsabilidade de um lead para outro usuário.
   * @param {number} leadId - O ID do lead.
   * @param {number|null} responsavelId - O ID do novo responsável, ou null para desatribuir.
   */
  const transferirLead = (leadId, responsavelId) => {
    if (responsavelId === null) {
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, responsavel: null } : lead
        )
      );
      return;
    }

    let usuario = usuarios.find((u) => u.id == responsavelId);
    if (!usuario) {
      console.warn("Usuário não encontrado para o ID:", responsavelId);
      return;
    }

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, responsavel: usuario.nome } : lead
      )
    );
  };

  /**
   * Atualiza o status ou tipo de um usuário e envia para o GAS.
   * @param {number} id - O ID do usuário.
   * @param {string} [novoStatus=null] - O novo status do usuário.
   * @param {string} [novoTipo=null] - O novo tipo do usuário.
   */
  const atualizarStatusUsuario = (id, novoStatus = null, novoTipo = null) => {
    const usuario = usuarios.find((u) => u.id === id);
    if (!usuario) return;

    if (novoStatus !== null) usuario.status = novoStatus;
    if (novoTipo !== null) usuario.tipo = novoTipo;

    try {
      fetch(GOOGLE_SHEETS_USERS + '?v=alterar_usuario', { // Usando GOOGLE_SHEETS_USERS como base para o POST
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ usuario: usuario }),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Erro ao enviar atualização de usuário:', error);
    }

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
  };

  /**
   * Abre os detalhes de um lead e navega para a rota apropriada.
   * @param {object} lead - O objeto lead a ser aberto.
   */
  const onAbrirLead = (lead) => {
    setLeadSelecionado(lead);
    let path = '/leads';
    if (lead.status === 'Fechado') path = '/leads-fechados';
    else if (lead.status === 'Perdido') path = '/leads-perdidos';
    navigate(path);
  };

  /**
   * Lida com o processo de login do usuário.
   */
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

  // Renderiza a tela de login se não estiver autenticado
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

  // Renderiza a aplicação principal se autenticado
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
                leads={
                  isAdmin
                    ? leads
                    : leads.filter((lead) => lead.responsavel === usuarioLogado.nome || lead.responsavel === '')
                }
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
          {/* Nova rota para CriarLead */}
          <Route 
            path="/criar-lead" 
            element={<CriarLead adicionarLead={adicionarLead} />} 
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
