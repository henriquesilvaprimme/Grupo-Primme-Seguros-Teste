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

const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=getLeads';
const GOOGLE_SHEETS_USERS = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';
const GOOGLE_SHEETS_LEADS_FECHADOS = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=pegar_clientes_fechados'

const App = () => {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  const [leads, setLeads] = useState([]);
  const [leadsFechados, setLeadsFechados] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [leadSelecionado, setLeadSelecionado] = useState(null);

  // Carrega imagem de fundo
  useEffect(() => {
    const img = new Image();
    img.src = '/background.png';
    img.onload = () => setBackgroundLoaded(true);
  }, []);

  // Função auxiliar para formatar a data para exibição no frontend (DD/Mês/AA ou DD/MM/YYYY)
  const formatarDataParaExibicao = (dataString) => {
    if (!dataString) return '';
    try {
      let dateObj;
      // Tenta parsear como ISO 8601 (com T e Z) ou YYYY-MM-dd
      if (dataString.includes('T')) {
        dateObj = new Date(dataString);
      } else if (dataString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateObj = new Date(dataString + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso horário
      } else {
        // Tenta parsear como DD/MM/YYYY
        const partesBarra = dataString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (partesBarra) {
          dateObj = new Date(`${partesBarra[3]}-${partesBarra[2]}-${partesBarra[1]}T00:00:00`);
        } else {
          dateObj = new Date(dataString); // Última tentativa de parsear
        }
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

      return `${dia}/${mesExtenso}/${anoCurto}`; // Ex: 08/Julho/25
    } catch (error) {
      console.error('Erro ao formatar data para exibição:', error);
      return dataString;
    }
  };


  // --- Funções de Fetch de Dados ---
  const fetchLeadsFromSheet = useCallback(async () => {
    try {
      const response = await fetch(`${GOOGLE_APPS_SCRIPT_BASE_URL}?v=getLeads`);
      if (!response.ok) {
        throw new Error(`Erro ao buscar leads: ${response.status} ${response.statusText}`);
      }
      const data = await response.json(); // Aqui pode ler JSON normalmente para GET

      if (Array.isArray(data)) {
        const sortedData = data.sort((a, b) => {
          const dateA = new Date(a.editado);
          const dateB = new Date(b.editado);
          return dateB - dateA;
        });

        const formattedLeads = sortedData.map((item, index) => ({
          id: item.id ? String(item.id) : String(index + 1), // Garante que o ID é string
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
          usuarioId: item.usuarioId ? String(item.usuarioId) : null, // Garante que o ID do usuário é string
          premioLiquido: item.premioLiquido || '',
          comissao: item.comissao || '',
          parcelamento: item.parcelamento || '',
          VigenciaFinal: item.VigenciaFinal || '', // Já vem no formato correto do GAS
          createdAt: item.data || new Date().toISOString(),
          responsavel: item.responsavel || '',
          editado: item.editado || ''
        }));

        setLeads(formattedLeads);
      } else {
        setLeads([]);
      }
    } catch (error) {
      console.error('Erro ao buscar leads da planilha:', error);
      setLeads([]);
    }
  }, []); // Dependência vazia, pois o URL é constante

  const fetchLeadsFechadosFromSheet = useCallback(async () => {
    try {
      const response = await fetch(`${GOOGLE_APPS_SCRIPT_BASE_URL}?v=pegar_clientes_fechados`);
      if (!response.ok) {
        throw new Error(`Erro ao buscar leads fechados: ${response.status} ${response.statusText}`);
      }
      const data = await response.json(); // Aqui pode ler JSON normalmente para GET

      setLeadsFechados(data);
    } catch (error) {
      console.error('Erro ao buscar leads fechados:', error);
      setLeadsFechados([]);
    }
  }, []); // Dependência vazia, pois o URL é constante

  const fetchUsuariosFromSheet = useCallback(async () => {
    try {
      const response = await fetch(`${GOOGLE_APPS_SCRIPT_BASE_URL}?v=pegar_usuario`);
      if (!response.ok) {
        throw new Error(`Erro ao buscar usuários: ${response.status} ${response.statusText}`);
      }
      const data = await response.json(); // Aqui pode ler JSON normalmente para GET

      if (Array.isArray(data)) {
        const formattedUsuarios = data.map((item) => ({
          id: String(item.id) || '', // Garante que o ID é string
          usuario: item.usuario || '',
          nome: item.nome || '',
          email: item.email || '',
          senha: item.senha || '',
          status: item.status || 'Ativo', // Default para 'Ativo'
          tipo: item.tipo || 'Usuario Comum', // Default para 'Usuario Comum'
        }));
        setUsuarios(formattedUsuarios);
      } else {
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários do Google Sheets:', error);
      setUsuarios([]);
    }
  }, []); // Dependência vazia, pois o URL é constante

  // --- Efeitos para Carregar Dados e Atualizar Automaticamente ---
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

  // --- Funções de Manipulação de Dados ---
  const adicionarUsuario = useCallback(async (usuario) => {
    // Esta função deveria chamar o GAS diretamente para adicionar e, em seguida,
    // chamar fetchUsuariosFromSheet() para atualizar a lista.
    // Mantendo a estrutura para você adaptar em CriarUsuario.jsx.
    // Exemplo de como CriarUsuario deveria fazer:
    /*
    try {
      const response = await fetch(`${GOOGLE_APPS_SCRIPT_BASE_URL}?v=criar_usuario`, {
        method: 'POST',
        mode: 'no-cors', // Se mantiver no-cors, não pode ler response.json()
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuario),
      });
      if (response.ok) { // Apenas verifica se a requisição HTTP foi OK
        console.log("Usuário enviado para o GAS com sucesso.");
        // Re-fetch para atualizar a lista após a operação
        await fetchUsuariosFromSheet();
        return true;
      } else {
        console.error("Erro ao enviar usuário para o GAS:", response.status);
        return false;
      }
    } catch (error) {
      console.error("Erro na comunicação para criar usuário:", error);
      return false;
    }
    */
  }, []);

  const adicionarNovoLead = useCallback(async (novoLead) => {
    // Similar a adicionarUsuario, o ideal é que CriarLead chame o GAS e,
    // em caso de sucesso, você faça um fetchLeadsFromSheet().
    // Mantendo a estrutura para você adaptar em CriarLead.jsx.
    setLeads((prevLeads) => {
      // Verifique por 'id' se o ID é único ou outro campo identificador
      if (!prevLeads.some(lead => lead.id === novoLead.id)) {
        return [novoLead, ...prevLeads];
      }
      return prevLeads;
    });
  }, []);

  const atualizarStatusLead = useCallback(async (id, novoStatus, phone) => {
    // Encontra o lead no estado atual
    const leadToUpdate = leads.find(lead => lead.phone === phone);
    if (!leadToUpdate) {
      console.error("Lead não encontrado para atualização de status:", phone);
      return;
    }

    try {
      const response = await fetch(`${GOOGLE_APPS_SCRIPT_BASE_URL}?v=alterar_status`, {
        method: 'POST',
        mode: 'no-cors', // Mantido no-cors
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone, // Enviando o telefone como identificador
          status: novoStatus
        }),
      });

      if (response.ok) { // Apenas verifica se a requisição HTTP foi OK
        console.log('Status do lead enviado ao Sheets com sucesso.');
        // Atualiza o estado local e re-sincroniza após o envio
        setLeads(prevLeads =>
          prevLeads.map(lead =>
            lead.phone === phone ? { ...lead, status: novoStatus, confirmado: true } : lead
          )
        );
        // Re-fetch para garantir a sincronização total
        fetchLeadsFromSheet();
        if (novoStatus === 'Fechado' || novoStatus === 'Perdido') {
            fetchLeadsFechadosFromSheet(); // Para Leads Fechados
        }
      } else {
        console.error('Erro ao enviar status do lead para o Apps Script:', response.status);
        alert(`Erro ao comunicar com o servidor: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao enviar dados para o Apps Script (atualizar_status):', error);
      alert(`Erro de rede ou ao processar requisição: ${error.message}`);
    }
  }, [leads, fetchLeadsFromSheet, fetchLeadsFechadosFromSheet]);

  const atualizarSeguradoraLead = useCallback((id, seguradora) => {
    // Esta função só atualiza o estado local, o envio ao GAS ocorre em 'confirmarSeguradoraLead'.
    setLeadsFechados((prev) =>
      prev.map((lead) =>
        lead.ID === id
          ? { ...lead, insurer: seguradora, premioLiquido: "", comissao: "", parcelamento: "", VigenciaFinal: "" }
          : lead
      )
    );
  }, []);

  const confirmarSeguradoraLead = useCallback(async (id, premio, seguradora, comissao, parcelamento, vigenciaFinal) => {
    const lead = leadsFechados.find((lead) => lead.ID === id);
    if (!lead) {
      console.error(`Lead com ID ${id} não encontrado na lista de leads fechados.`);
      alert(`Erro: Lead com ID ${id} não encontrado.`);
      return;
    }

    const dataToSend = {
      lead: {
        ID: lead.ID,
        Seguradora: seguradora,
        PremioLiquido: premio,
        Comissao: comissao,
        Parcelamento: parcelamento,
        VigenciaFinal: vigenciaFinal || ''
      }
    };

    console.log("Enviando para o GAS (confirmar_seguradora):", dataToSend);

    try {
      const response = await fetch(`${GOOGLE_APPS_SCRIPT_BASE_URL}?v=alterar_seguradora`, {
        method: 'POST',
        mode: 'no-cors', // Mantido no-cors
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) { // Apenas verifica se a requisição HTTP foi OK
        console.log('Dados da seguradora enviados ao Sheets com sucesso.');
        // Atualiza o estado local e re-sincroniza após o envio
        setLeadsFechados((prev) =>
          prev.map((l) =>
            l.ID === id ? {
              ...l,
              insurerConfirmed: true,
              Seguradora: seguradora,
              PremioLiquido: premio,
              Comissao: comissao,
              Parcelamento: parcelamento,
              VigenciaFinal: vigenciaFinal || ''
            } : l
          )
        );
        fetchLeadsFechadosFromSheet(); // Re-fetch para garantir a sincronização
      } else {
        console.error('Erro ao enviar dados da seguradora para o Apps Script:', response.status);
        alert(`Erro ao comunicar com o servidor: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao enviar dados para o Apps Script (confirmar_seguradora):', error);
      alert(`Erro de rede ou ao processar requisição: ${error.message}`);
    }
  }, [leadsFechados, fetchLeadsFechadosFromSheet]);

  const atualizarDetalhesLeadFechado = useCallback((id, campo, valor) => {
    // Esta função só atualiza o estado local. O envio ao GAS deve ser feito
    // em conjunto com a 'confirmarSeguradoraLead' ou uma função similar para cada campo.
    setLeadsFechados((prev) =>
      prev.map((lead) =>
        lead.ID === id ? { ...lead, [campo]: valor } : lead
      )
    );
  }, []);

  const transferirLead = useCallback(async (leadId, responsavelId) => {
    // Encontra o lead para obter o 'id' da linha na planilha
    const lead = leads.find(l => l.id === leadId);
    if (!lead) {
        console.error("Lead não encontrado para transferência:", leadId);
        return;
    }

    let usuarioNome = null;
    if (responsavelId !== null) {
      const usuario = usuarios.find((u) => u.id === String(responsavelId));
      if (usuario) {
        usuarioNome = usuario.nome;
      } else {
        console.error("Usuário responsável não encontrado para ID:", responsavelId);
        alert("Erro: Usuário responsável não encontrado.");
        return;
      }
    }

    try {
        const response = await fetch(`${GOOGLE_APPS_SCRIPT_BASE_URL}?v=alterar_atribuido`, {
            method: 'POST',
            mode: 'no-cors', // Mantido no-cors
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: lead.id, // O ID que o GAS espera para encontrar a linha
                usuarioId: responsavelId
            }),
        });

        if (response.ok) { // Apenas verifica se a requisição HTTP foi OK
            console.log('Lead transferido para o Sheets com sucesso.');
            // Atualiza o estado local e re-sincroniza após o envio
            setLeads((prev) =>
                prev.map((l) =>
                    l.id === leadId ? { ...l, responsavel: usuarioNome } : l
                )
            );
            fetchLeadsFromSheet(); // Re-fetch para garantir a sincronização
        } else {
            console.error('Erro ao enviar transferência de lead para o Apps Script:', response.status);
            alert(`Erro ao comunicar com o servidor: ${response.status}`);
        }
    } catch (error) {
        console.error('Erro ao enviar dados para o Apps Script (transferir_lead):', error);
        alert(`Erro de rede ou ao processar requisição: ${error.message}`);
    }
}, [leads, usuarios, fetchLeadsFromSheet]);

  const atualizarStatusUsuario = useCallback(async (id, novoStatus = null, novoTipo = null) => {
    const usuarioParaAtualizar = usuarios.find((usuario) => usuario.id === id);

    if (!usuarioParaAtualizar) {
      console.error('Usuário não encontrado para o ID:', id);
      return;
    }

    // Cria um novo objeto para enviar, sem modificar o estado diretamente
    const usuarioModificado = { ...usuarioParaAtualizar };

    if (novoStatus !== null) {
      usuarioModificado.status = novoStatus;
    }
    if (novoTipo !== null) {
      usuarioModificado.tipo = novoTipo;
    }

    console.log("Dados do usuário a serem enviados para o GAS (atualizar_usuario):", usuarioModificado);

    try {
      const response = await fetch(`${GOOGLE_APPS_SCRIPT_BASE_URL}?v=alterar_usuario`, {
        method: 'POST',
        mode: 'no-cors', // Mantido no-cors
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: usuarioModificado // Envia o objeto 'usuario' completo
        }),
      });

      if (response.ok) { // Apenas verifica se a requisição HTTP foi OK
        console.log('Usuário enviado ao Sheets com sucesso.');
        // Atualiza o estado local e re-sincroniza após o envio
        setUsuarios(prevUsuarios =>
          prevUsuarios.map(u =>
            u.id === usuarioModificado.id ? usuarioModificado : u
          )
        );
        fetchUsuariosFromSheet(); // Re-fetch para garantir a sincronização
      } else {
        console.error('Erro ao enviar usuário para o Apps Script:', response.status);
        alert(`Erro ao comunicar com o servidor: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao enviar dados para o Apps Script (atualizar_usuario):', error);
      alert(`Erro de rede ou ao processar requisição: ${error.message}`);
    }
  }, [usuarios, fetchUsuariosFromSheet]);

  const onAbrirLead = useCallback((lead) => {
    setLeadSelecionado(lead);

    let path = '/leads';
    if (lead.status === 'Fechado') path = '/leads-fechados';
    else if (lead.status === 'Perdido') path = '/leads-perdidos';

    navigate(path);
  }, [navigate]);

  const handleLogin = useCallback(() => {
    const usuarioEncontrado = usuarios.find(
      (u) => u.usuario === loginInput && u.senha === senhaInput && u.status === 'Ativo'
    );

    if (usuarioEncontrado) {
      setIsAuthenticated(true);
      setUsuarioLogado(usuarioEncontrado);
    } else {
      alert('Login ou senha inválidos ou usuário inativo.');
    }
  }, [loginInput, senhaInput, usuarios]); // Depende dos estados de input e da lista de usuários

  const isAdmin = usuarioLogado?.tipo === 'Admin';

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
