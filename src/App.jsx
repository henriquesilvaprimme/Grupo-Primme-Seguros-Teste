import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Leads from './Leads';
import LeadsFechados from './LeadsFechados';
import LeadsPerdidos from './LeadsPerdidos';
import BuscarLead from './BuscarLead';
import CriarUsuario from './pages/CriarUsuario';
import Usuarios from './pages/Usuarios'; // Certifique-se de que este caminho está correto
import Ranking from './pages/Ranking';
import CriarLead from './pages/CriarLead';

// *** IMPORTANTE: Substitua este URL pelo URL DE IMPLANTAÇÃO do seu Web App Google Apps Script. ***
// Você encontra isso em seu projeto Apps Script > Implementar > Nova implantação ou Gerenciar implantações.
// Deve ser algo como 'https://script.google.com/macros/s/SEU_ID_DE_IMPLANTACAO_UNICO_AQUI/exec'
const BASE_GAS_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';


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

  // Função auxiliar para formatar a data para exibição no frontend (DD/Mês/AA ou DD/MM/YYYY)
  const formatarDataParaExibicao = (dataString) => {
    if (!dataString) return '';
    try {
      let dateObj;
      // Tenta parsear formato ISO (YYYY-MM-DDTHH:mm:ss.000Z) ou YYYY-MM-DD
      if (dataString.includes('T')) {
        dateObj = new Date(dataString);
      } else {
        const partesHifen = dataString.match(/^(\d{4})-(\d{2})-(\d{2})$/); // Formato YYYY-MM-DD
        const partesBarra = dataString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); // Formato DD/MM/YYYY

        if (partesHifen) {
          dateObj = new Date(dataString + 'T00:00:00'); // Adiciona T00:00:00 para evitar fuso horário
        } else if (partesBarra) {
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

      return `${dia}/${mesExtenso}/${anoCurto}`; // Formato 08/Junho/25
      // return `${dia}/${mes}/${ano}`; // Formato 08/06/2025
    } catch (error) {
      console.error('Erro ao formatar data para exibição:', error);
      return dataString;
    }
  };


  const fetchLeadsFromSheet = async () => {
    try {
      const response = await fetch(`${BASE_GAS_URL}?v=getLeads`);
      const data = await response.json();

      console.log("Dados de Leads Recebidos do GAS:", data);

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

        console.log("Leads formatados no frontend:", formattedLeads);

        if (!leadSelecionado) {
          setLeads(formattedLeads);
        }
      } else {
        if (!leadSelecionado) {
          setLeads([]);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar leads da planilha:', error);
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

  const fetchLeadsFechadosFromSheet = async () => {
    try {
      const response = await fetch(`${BASE_GAS_URL}?v=pegar_clientes_fechados`)
      const data = await response.json();

      console.log("Dados de Leads Fechados Recebidos do GAS:", data);

      const formattedData = data.map(item => ({
        ...item,
        // VigenciaFinal já vem no formato YYYY-MM-DD do GAS, então não precisamos formatar aqui
        // Mas podemos garantir que esteja no formato certo se o Sheets estiver enviando diferente
        VigenciaFinal: item.VigenciaFinal ? formatarDataParaExibicao(item.VigenciaFinal) : ''
      }));
      setLeadsFechados(formattedData);

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
        const response = await fetch(`${BASE_GAS_URL}?v=pegar_usuario`);
        const data = await response.json();

        if (Array.isArray(data)) {
          const formattedUsuarios = data.map((item) => ({
            // Certifique-se de que 'ID' (maiúsculo) é como a coluna é chamada no Sheets
            // e que é o identificador único usado no GAS para 'alterar_usuario'.
            id: item.ID || '',
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
    // Ao adicionar um novo usuário, o ID deve ser gerenciado pelo Sheets/GAS
    // ou você pode gerar um UUID temporário até que o Sheets retorne um ID.
    // Por simplicidade, estou usando prev.length + 1, mas o ideal é que o GAS retorne o ID.
    setUsuarios((prev) => [...prev, { ...usuario, id: String(prev.length + 1) }]); // Converte para string para consistência
  };

  const adicionarNovoLead = (novoLead) => {
    setLeads((prevLeads) => {
      if (!prevLeads.some(lead => lead.ID === novoLead.ID)) {
        return [novoLead, ...prevLeads];
      }
      return prevLeads;
    });
  };

  const atualizarStatusLeadAntigo = (id, novoStatus, phone) => {
    if (novoStatus == 'Fechado') {
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
        lead.phone === phone ? { ...lead, status: novoStatus, confirmado: true } : lead
      )
    );

    if (novoStatus === 'Fechado') {
      setLeadsFechados((prev) => {
        const jaExiste = prev.some((lead) => lead.phone === phone);

        if (jaExiste) {
          const atualizados = prev.map((lead) =>
            lead.phone === phone ? { ...lead, Status: novoStatus, confirmado: true } : lead
          );
          return atualizados;
        } else {
          const leadParaAdicionar = leads.find((lead) => lead.phone === phone);

          if (leadParaAdicionar) {
            const novoLeadFechado = {
              ID: leadParaAdicionar.id || crypto.randomUUID(),
              name: leadParaAdicionar.name,
              vehicleModel: leadParaAdicionar.vehicleModel,
              vehicleYearModel: leadParaAdicionar.vehicleYearModel,
              city: leadParaAdicionar.city,
              phone: leadParaAdicionar.phone,
              insurer: leadParaAdicionar.insurancetype || leadParaAdicionar.insuranceType || "",
              Data: leadParaAdicionar.createdAt || new Date().toISOString(),
              Responsavel: leadParaAdicionar.responsavel || "",
              Status: "Fechado",
              Seguradora: leadParaAdicionar.Seguradora || "",
              PremioLiquido: leadParaAdicionar.premioLiquido || "",
              Comissao: leadParaAdicionar.comissao || "",
              Parcelamento: leadParaAdicionar.parcelamento || "",
              VigenciaFinal: leadParaAdicionar.VigenciaFinal || "",
              // Removidas propriedades de usuário que não pertencem a leads (como senha, status de usuário, tipo de usuário)
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
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === id
          ? limparCamposLead({ ...lead, insurer: seguradora })
          : lead
      )
    );
  };

  const limparCamposLead = (lead) => ({
    ...lead,
    premioLiquido: "",
    comissao: "",
    parcelamento: "",
    VigenciaFinal: "",
  })

  const confirmarSeguradoraLead = (id, premio, seguradora, comissao, parcelamento, vigenciaFinal) => {
    const lead = leadsFechados.find((lead) => lead.ID == id);

    if (!lead) {
      console.error(`Lead com ID ${id} não encontrado na lista de leads fechados.`);
      return;
    }

    lead.Seguradora = seguradora;
    lead.PremioLiquido = premio;
    lead.Comissao = comissao;
    lead.Parcelamento = parcelamento;
    lead.VigenciaFinal = vigenciaFinal || ''; // Já deve vir como YYYY-MM-DD do input date

    setLeadsFechados((prev) => {
      const atualizados = prev.map((l) =>
        l.ID === id ? {
          ...l,
          insurerConfirmed: true,
          Seguradora: seguradora,
          PremioLiquido: premio,
          Comissao: comissao,
          Parcelamento: parcelamento,
          VigenciaFinal: vigenciaFinal || ''
        } : l
      );
      return atualizados;
    });

    try {
      fetch(`${BASE_GAS_URL}?v=alterar_seguradora`, { // Usando BASE_GAS_URL
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          lead: lead // O objeto 'lead' já contém VigenciaFinal no formato YYYY-MM-DD
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Erro ao enviar lead:', error);
    }
  };

  const atualizarDetalhesLeadFechado = (id, campo, valor) => {
    setLeadsFechados((prev) =>
      prev.map((lead) =>
        lead.ID === id ? { ...lead, [campo]: valor } : lead
      )
    );
  };

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
      return;
    }

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, responsavel: usuario.nome } : lead
      )
    );
  };

  const atualizarStatusUsuario = (id, novoStatus = null, novoTipo = null) => {
    const usuario = usuarios.find((user) => user.id === id);
    if (!usuario) {
      console.warn(`Usuário com ID ${id} não encontrado para atualização.`);
      return;
    }

    // Cria uma cópia do usuário para enviar, garantindo que todos os campos esperados pelo GAS estejam presentes
    const usuarioParaEnviar = {
      id: usuario.id,
      usuario: usuario.usuario,
      nome: usuario.nome,
      email: usuario.email,
      senha: usuario.senha, // Importante enviar a senha atual (mesmo que não alterada)
      status: novoStatus !== null ? novoStatus : usuario.status, // Usa o novo status ou o existente
      tipo: novoTipo !== null ? novoTipo : usuario.tipo, // Usa o novo tipo ou o existente
    };

    try {
      fetch(`${BASE_GAS_URL}?v=alterar_usuario`, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          usuario: usuarioParaEnviar // Envia o objeto de usuário completo e atualizado
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Atualiza o estado local apenas se a chamada fetch foi bem-sucedida (ou não deu erro)
      setUsuarios((prev) =>
        prev.map((user) =>
          user.id === id
            ? {
                ...user,
                ...(novoStatus !== null ? { status: novoStatus } : {}),
                ...(novoTipo !== null ? { tipo: novoTipo } : {}),
              }
            : user
        )
      );
      console.log(`Usuário ID ${id} atualizado para Status: ${usuarioParaEnviar.status}, Tipo: ${usuarioParaEnviar.tipo}`);
    } catch (error) {
      console.error('Erro ao enviar atualização de usuário:', error);
      alert('Erro ao atualizar usuário. Verifique o console para mais detalhes.');
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
                    atualizarStatusUsuario={atualizarStatusUsuario} // Passando a função atualizada
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
