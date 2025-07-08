import React, { useState } from 'react';
import Lead from './components/Lead';

const GOOGLE_SHEETS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwgeZteouyVWzrCvgHHQttx-5Bekgs_k-5EguO9Sn2p-XFrivFg9S7_gGKLdoDfCa08/exec';

const Leads = ({ leads, usuarios, onUpdateStatus, transferirLead, usuarioLogado, fetchLeadsFromSheet  }) => {
  const [selecionados, setSelecionados] = useState({}); // { [leadId]: userId }
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Estados para filtro por data (mes e ano) - INICIAM LIMPOS
  const [dataInput, setDataInput] = useState('');
  const [filtroData, setFiltroData] = useState('');

  // Estados para filtro por nome
  const [nomeInput, setNomeInput] = useState('');
  const [filtroNome, setFiltroNome] = useState('');

  // Buscar leads atualizados do Google Sheets
  const buscarLeadsAtualizados = async () => {
    try {
      const response = await fetch(GOOGLE_SHEETS_SCRIPT_URL);
      if (response.ok) {
        const dadosLeads = await response.json();
        setLeadsState(dadosLeads);
      } else {
        console.error('Erro ao buscar leads:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
    }
  };

  const leadsPorPagina = 10;

  // Função para normalizar strings (remover acento, pontuação, espaços, etc)
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
    setPaginaAtual(1);
  };

  const aplicarFiltroNome = () => {
    const filtroLimpo = nomeInput.trim();
    setFiltroNome(filtroLimpo);
    setFiltroData('');
    setDataInput('');
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

  // Filtragem dos leads pendentes + filtro data ou nome
  const gerais = leads.filter((lead) => {
    if (lead.status === 'Fechado' || lead.status === 'Perdido') return false;

    if (filtroData) {
      return isSameMonthAndYear(lead.createdAt, filtroData);
    }

    if (filtroNome) {
      return nomeContemFiltro(lead.name, filtroNome);
    }

    return true;
  });

  const totalPaginas = Math.max(1, Math.ceil(gerais.length / leadsPorPagina));
  const paginaCorrigida = Math.min(paginaAtual, totalPaginas);

  const usuariosAtivos = usuarios.filter((u) => u.status === 'Ativo');
  const isAdmin = usuarioLogado?.tipo == 'Admin';

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
      const response = await fetch('https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?v=alterar_atribuido', {
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
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR');
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Linha de filtros */}
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

            <button title='Clique para atualizar os dados'
              onClick={() => {
                fetchLeadsFromSheet();
                //fetchLeadsFechadosFromSheet();
                //fetchUsuariosFromSheet();
              }}
            >
              🔄
            </button>
        </div>

        {/* Filtro nome - centralizado */}
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

        {/* Filtro data - direita */}
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

      {gerais.length === 0 ? (
        <p>Não há leads pendentes.</p>
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
                }}
              >
                <Lead
                  lead={lead}
                  onUpdateStatus={onUpdateStatus}
                  disabledConfirm={!lead.responsavel}
                />

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
                          padding: '5px 12px',
                          backgroundColor: '#ffc107',
                          color: '#000',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Alterar
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: '10px',
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                  >
                    <select
                      value={selecionados[lead.id] || ''}
                      onChange={(e) => handleSelect(lead.id, e.target.value)}
                      style={{
                        padding: '5px',
                        borderRadius: '4px',
                        border: '1px solid #ccc',
                      }}
                    >
                      <option value="">Selecione usuário ativo</option>
                      {usuariosAtivos.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nome}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleEnviar(lead.id)}
                        style={{
                          padding: '5px 12px',
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
                )}

                {/* Data no canto inferior direito */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '15px',
                    fontSize: '12px',
                    color: '#888',
                    fontStyle: 'italic',
                  }}
                  title={`Criado em: ${formatarData(lead.createdAt)}`}
                >
                  {formatarData(lead.createdAt)}
                </div>
              </div>
            );
          })}

          {/* Paginação */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              marginTop: '20px',
            }}
          >
            <button
              onClick={handlePaginaAnterior}
              disabled={paginaCorrigida <= 1}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                cursor: paginaCorrigida <= 1 ? 'not-allowed' : 'pointer',
                backgroundColor: paginaCorrigida <= 1 ? '#f0f0f0' : '#fff',
              }}
            >
              Anterior
            </button>
            <span style={{ alignSelf: 'center' }}>
              Página {paginaCorrigida} de {totalPaginas}
            </span>
            <button
              onClick={handlePaginaProxima}
              disabled={paginaCorrigida >= totalPaginas}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                cursor: paginaCorrigida >= totalPaginas ? 'not-allowed' : 'pointer',
                backgroundColor: paginaCorrigida >= totalPaginas ? '#f0f0f0' : '#fff',
              }}
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
