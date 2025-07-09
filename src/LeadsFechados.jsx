import React, { useState, useEffect } from 'react';

// Nova função auxiliar para formatar a data para exibição no input de texto (DD/MM/AAAA)
const formatDateForDisplay = (dateValue) => {
  if (!dateValue) return '';

  // Se já for uma string no formato DD/MM/AAAA, retorna como está
  if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return dateValue;
  }

  let date;
  // Tenta converter de YYYY-MM-DD para objeto Date (formato que o GAS envia)
  if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
    date = new Date(dateValue + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso horário
  } else if (dateValue instanceof Date) {
    date = dateValue;
  } else {
    // Se for outro formato de string, tenta criar um objeto Date
    // Ex: "DD/MM/YYYY" -> new Date(YYYY, MM-1, DD)
    const parts = String(dateValue).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (parts) {
      date = new Date(parts[3], parts[2] - 1, parts[1]);
    } else {
      return String(dateValue); // Retorna a string original se não conseguir formatar
    }
  }

  if (isNaN(date.getTime())) return ''; // Verifica se a data é válida

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Nova função auxiliar para aplicar máscara DD/MM/AAAA ao digitar
const formatDateInput = (value) => {
  let cleanedValue = value.replace(/\D/g, ''); // Remove tudo que não for dígito
  let formattedValue = '';
  if (cleanedValue.length > 0) {
    formattedValue += cleanedValue.substring(0, 2);
  }
  if (cleanedValue.length > 2) {
    formattedValue += '/' + cleanedValue.substring(2, 4);
  }
  if (cleanedValue.length > 4) {
    formattedValue += '/' + cleanedValue.substring(4, 8);
  }
  return formattedValue;
};


const LeadsFechados = ({ leads, usuarios, onUpdateInsurer, onConfirmInsurer, onUpdateDetalhes, fetchLeadsFechadosFromSheet, isAdmin, formatarDataParaExibicao }) => {
  // Loga os leads recebidos para depuração
  console.log("LeadsFechados.jsx: Leads recebidos como prop:", leads);

  const fechados = leads.filter(lead => lead.Status === 'Fechado');

  console.log("LeadsFechados.jsx: Leads filtrados (Status 'Fechado'):", fechados);
  console.log("usuarioLogado (isAdmin):", isAdmin);

  // Obtém o mês e ano atual no formato 'YYYY-MM'
  const getMesAnoAtual = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  };

  const [valores, setValores] = useState(() => {
    const inicial = {};
    fechados.forEach(lead => {
      inicial[lead.ID] = {
        PremioLiquido: lead.PremioLiquido !== undefined ? Math.round(parseFloat(lead.PremioLiquido) * 100) : 0,
        Comissao: lead.Comissao ? String(lead.Comissao) : '',
        Parcelamento: lead.Parcelamento || '',
        insurer: lead.Seguradora || '',
        // Adiciona a VigenciaFinal ao estado inicial, formatando para DD/MM/AAAA para o input de texto
        VigenciaFinal: lead.VigenciaFinal ? formatDateForDisplay(lead.VigenciaFinal) : '',
      };
    });
    return inicial;
  });

  // Novo estado para o loader
  const [isLoading, setIsLoading] = useState(false);

  // EFEITO PARA ATUALIZAR VALORES QUANDO 'leads' MUDA
  useEffect(() => {
    setValores(prevValores => {
      const novosValores = { ...prevValores };

      leads
        .filter(lead => lead.Status === 'Fechado')
        .forEach(lead => {
          if (!novosValores[lead.ID]) {
            novosValores[lead.ID] = {
              PremioLiquido: lead.PremioLiquido !== undefined ? Math.round(parseFloat(lead.PremioLiquido) * 100) : 0,
              Comissao: lead.Comissao ? String(lead.Comissao) : '',
              Parcelamento: lead.Parcelamento || '',
              insurer: lead.Seguradora || '',
              // Inicializa VigenciaFinal para novos leads fechados, formatando para DD/MM/AAAA
              VigenciaFinal: lead.VigenciaFinal ? formatDateForDisplay(lead.VigenciaFinal) : '',
            };
          } else {
            // Atualiza valores existentes se o lead já estiver no estado 'valores'
            novosValores[lead.ID] = {
              ...novosValores[lead.ID],
              PremioLiquido: lead.PremioLiquido !== undefined ? Math.round(parseFloat(lead.PremioLiquido) * 100) : novosValores[lead.ID].PremioLiquido,
              Comissao: lead.Comissao ? String(lead.Comissao) : novosValores[lead.ID].Comissao,
              Parcelamento: lead.Parcelamento || novosValores[lead.ID].Parcelamento,
              insurer: lead.Seguradora || novosValores[lead.ID].insurer,
              VigenciaFinal: lead.VigenciaFinal ? formatDateForDisplay(lead.VigenciaFinal) : novosValores[lead.ID].VigenciaFinal,
            };
          }
        });

      return novosValores;
    });
  }, [leads]);

  const [nomeInput, setNomeInput] = useState('');
  const [dataInput, setDataInput] = useState(getMesAnoAtual());
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroData, setFiltroData] = useState(getMesAnoAtual());

  const normalizarTexto = (texto) =>
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .toLowerCase();

  const aplicarFiltroNome = () => {
    setFiltroNome(nomeInput.trim());
  };

  const aplicarFiltroData = () => {
    setFiltroData(dataInput);
    console.log("LeadsFechados.jsx: Filtro de data aplicado:", dataInput);
  };

  // Função para lidar com o refresh e ativar/desativar o loader
  const handleRefresh = async () => {
    setIsLoading(true); // Ativa o loader
    try {
      await fetchLeadsFechadosFromSheet(); // Chama a função para buscar dados
    } catch (error) {
      console.error('LeadsFechados.jsx: Erro ao atualizar leads fechados:', error);
    } finally {
      setIsLoading(false); // Desativa o loader
    }
  };

  // NOVO useEffect para o refresh automático ao carregar a página
  useEffect(() => {
    handleRefresh();
  }, []); // O array vazio garante que roda apenas uma vez ao montar o componente


  const leadsFiltrados = fechados.filter(lead => {
    const nomeMatch = normalizarTexto(lead.Name || '').includes(normalizarTexto(filtroNome || ''));
    
    // Ajusta a lógica de filtro de data para usar 'Data Criação'
    const dataCriacaoLead = lead['Data Criação'] || '';
    const dataMatch = filtroData ? dataCriacaoLead.startsWith(filtroData) : true;
    
    console.log(`Lead: ${lead.Name}, Data Criação: ${dataCriacaoLead}, Filtro Data: ${filtroData}, Data Match: ${dataMatch}`);
    return nomeMatch && dataMatch;
  }).sort((a, b) => {
    // Ordena por 'Data Criação' (mais recente primeiro)
    const dateA = new Date(a['Data Criação']);
    const dateB = new Date(b['Data Criação']);
    return dateB - dateA;
  });

  console.log("LeadsFechados.jsx: Leads filtrados e ordenados:", leadsFiltrados);


  const formatarMoeda = (valorCentavos) => {
    if (isNaN(valorCentavos) || valorCentavos === null) return '';
    return (valorCentavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePremioLiquidoChange = (id, valor) => {
    const somenteNumeros = valor.replace(/\D/g, '');

    if (somenteNumeros === '') {
      setValores(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          PremioLiquido: 0,
        },
      }));
      return;
    }

    let valorCentavos = parseInt(somenteNumeros, 10);
    if (isNaN(valorCentavos)) valorCentavos = 0;

    setValores(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        PremioLiquido: valorCentavos,
      },
    }));
  };

  const handlePremioLiquidoBlur = (id) => {
    const valorCentavos = valores[id]?.PremioLiquido || 0;
    const valorReais = valorCentavos / 100;

    if (!isNaN(valorReais)) {
      onUpdateDetalhes(id, 'PremioLiquido', valorReais);
    } else {
      onUpdateDetalhes(id, 'PremioLiquido', '');
    }
  };

  const handleComissaoChange = (id, valor) => {
    const regex = /^(\d{0,2})(,?\d{0,1})?$/;

    if (valor === '' || regex.test(valor)) {
      const valorLimitado = valor.slice(0, 4);

      setValores(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          Comissao: valorLimitado,
        },
      }));

      const valorFloat = parseFloat(valorLimitado.replace(',', '.'));
      onUpdateDetalhes(id, 'Comissao', isNaN(valorFloat) ? '' : valorFloat);
    }
  };

  const handleParcelamentoChange = (id, valor) => {
    setValores(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        Parcelamento: valor,
      },
    }));
    onUpdateDetalhes(id, 'Parcelamento', valor);
  };

  // Nova função para lidar com a mudança na Vigência Final
  const handleVigenciaFinalChange = (id, valor) => {
    const formattedValue = formatDateInput(valor); // Aplica a máscara DD/MM/AAAA
    setValores(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        VigenciaFinal: formattedValue, // Salva como DD/MM/AAAA no estado
      },
    }));
    // Passa a data no formato DD/MM/AAAA para o onUpdateDetalhes
    onUpdateDetalhes(id, 'VigenciaFinal', formattedValue);
  };

  const inputWrapperStyle = {
    position: 'relative',
    width: '100%',
    marginBottom: '8px',
  };

  const prefixStyle = {
    position: 'absolute',
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#555',
    fontWeight: 'bold',
    pointerEvents: 'none',
    userSelect: 'none',
  };

  const inputWithPrefixStyle = {
    paddingLeft: '30px',
    paddingRight: '8px',
    width: '100%',
    border: '1px solid #ccc',
    borderRadius: '4px',
    height: '36px',
    boxSizing: 'border-box',
    textAlign: 'right',
  };

  return (
    <div style={{ padding: '20px', position: 'relative' }}>
      {/* Loader de carregamento */}
      {isLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              border: '8px solid #f3f3f3',
              borderTop: '8px solid #3498db',
              borderRadius: '50%',
              width: '50px',
              height: '50px',
              animation: 'spin 1s linear infinite',
            }}
          ></div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ margin: 0 }}>Leads Fechados</h1>

        <button title='Clique para atualizar os dados'
          onClick={handleRefresh} // Chamando a nova função handleRefresh
        >
          🔄
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        {/* Filtro nome: centralizado */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: '1',
            justifyContent: 'center',
            minWidth: '280px',
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
              height: '36px',
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
              height: '36px',
              fontSize: '14px',
            }}
            title="Filtrar leads pelo nome (contém)"
          />
        </div>

        {/* Filtro data: canto direito */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: '230px',
            justifyContent: 'flex-end',
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
              whiteSpace: 'nowrap',
              height: '36px',
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
              height: '36px',
              fontSize: '14px',
            }}
            title="Filtrar leads pelo mês e ano de criação"
          />
        </div>
      </div>

      {leadsFiltrados.length === 0 ? (
        <p>Não há leads fechados que correspondam ao filtro aplicado.</p>
      ) : (
        leadsFiltrados.map((lead) => {
          const containerStyle = {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '15px',
            marginBottom: '15px',
            borderRadius: '5px',
            backgroundColor: lead.Seguradora ? '#e6f4ea' : '#fff',
            border: lead.Seguradora ? '2px solid #4CAF50' : '1px solid #ddd',
          };

          const responsavel = usuarios.find((u) => u.nome === lead.Responsavel && isAdmin);

          const isButtonDisabled =
            !valores[lead.ID]?.insurer ||
            !valores[lead.ID]?.PremioLiquido ||
            valores[lead.ID]?.PremioLiquido === 0 ||
            !valores[lead.ID]?.Comissao ||
            valores[lead.ID]?.Comissao === '' ||
            !valores[lead.ID]?.Parcelamento ||
            valores[lead.ID]?.Parcelamento === '' ||
            !valores[lead.ID]?.VigenciaFinal || // Adiciona a validação para VigenciaFinal
            valores[lead.ID]?.VigenciaFinal === '';

          return (
            <div key={lead.ID} style={containerStyle}>
              <div style={{ flex: 1 }}>
                <h3>{lead.Name}</h3> {/* Usando lead.Name conforme o GAS */}
                <p><strong>Modelo:</strong> {lead['Modelo Veiculo']}</p> {/* Usando lead['Modelo Veiculo'] */}
                <p><strong>Ano/Modelo:</strong> {lead['Ano Modelo']}</p> {/* Usando lead['Ano Modelo'] */}
                <p><strong>Cidade:</strong> {lead.Cidade}</p>
                <p><strong>Telefone:</strong> {lead.Telefone}</p>
                <p><strong>Tipo de Seguro:</strong> {lead['Tipo Seguro']}</p> {/* Usando lead['Tipo Seguro'] */}
                <p><strong>Data Criação:</strong> {formatarDataParaExibicao(lead['Data Criação'])}</p> {/* Formatando data de criação */}
                <p><strong>Editado em:</strong> {formatarDataParaExibicao(lead.Editado)}</p> {/* Formatando data de edição */}


                {responsavel && (
                  <p style={{ marginTop: '10px', color: '#007bff' }}>
                    Transferido para <strong>{responsavel.nome}</strong>
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '250px' }}>
                {/* Campo de input para Vigência Final (agora tipo texto com máscara) */}
                <label htmlFor={`vigencia-final-${lead.ID}`} style={{ marginBottom: '5px', alignSelf: 'flex-start', fontSize: '14px', fontWeight: 'bold' }}>
                  Vigência Final:
                </label>
                <input
                  id={`vigencia-final-${lead.ID}`}
                  type="text" // ALTERADO PARA TIPO TEXTO
                  value={valores[lead.ID]?.VigenciaFinal || ''}
                  onChange={(e) => handleVigenciaFinalChange(lead.ID, e.target.value)}
                  disabled={!!lead.Seguradora}
                  placeholder="DD/MM/AAAA" // Sugestão para o usuário
                  maxLength="10" // Limita a 10 caracteres (DD/MM/AAAA)
                  style={{
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    width: '100%',
                    marginBottom: '8px',
                    boxSizing: 'border-box',
                  }}
                  title="Digite a data de vigência final do seguro (DD/MM/AAAA)"
                />

                <select
                  value={valores[lead.ID]?.insurer || ''}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setValores(prev => ({
                      ...prev,
                      [lead.ID]: {
                        ...prev[lead.ID],
                        insurer: valor
                      }
                    }));
                    onUpdateInsurer(lead.ID, valor);
                  }}
                  disabled={!!lead.Seguradora}
                  style={{
                    padding: '8px',
                    border: '2px solid #ccc',
                    borderRadius: '4px',
                    width: '100%',
                    marginBottom: '8px',
                  }}
                >
                  <option value="">Selecione a seguradora</option>
                  <option value="Porto Seguro">Porto Seguro</option>
                  <option value="Azul Seguros">Azul Seguros</option>
                  <option value="Itau Seguros">Itau Seguros</option>
                  <option value="Demais Seguradoras">Demais Seguradoras</option>
                </select>

                <div style={inputWrapperStyle}>
                  <span style={prefixStyle}>R$</span>
                  <input
                    type="text"
                    placeholder="Prêmio Líquido"
                    value={formatarMoeda(valores[lead.ID]?.PremioLiquido)}
                    onChange={(e) => handlePremioLiquidoChange(lead.ID, e.target.value)}
                    onBlur={() => handlePremioLiquidoBlur(lead.ID)}
                    disabled={!!lead.Seguradora}
                    style={inputWithPrefixStyle}
                  />
                </div>

                <div style={inputWrapperStyle}>
                  <span style={prefixStyle}>%</span>
                  <input
                    type="text"
                    placeholder="Comissão (%)"
                    value={valores[lead.ID]?.Comissao || ''}
                    onChange={(e) => handleComissaoChange(lead.ID, e.target.value)}
                    disabled={!!lead.Seguradora}
                    maxLength={4}
                    style={inputWithPrefixStyle}
                  />
                </div>

                <select
                  value={valores[lead.ID]?.Parcelamento || ''}
                  onChange={(e) => handleParcelamentoChange(lead.ID, e.target.value)}
                  disabled={!!lead.Seguradora}
                  style={{
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    width: '100%',
                    marginBottom: '8px',
                  }}
                >
                  <option value="">Parcelamento</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={`${i + 1}x`}>{i + 1}x</option>
                  ))}
                </select>

                {!lead.Seguradora ? (
                  <button
                    onClick={() => onConfirmInsurer(
                      lead.ID,
                      parseFloat(valores[lead.ID]?.PremioLiquido.toString().replace('.', ',')),
                      valores[lead.ID]?.insurer,
                      valores[lead.ID]?.Comissao,
                      valores[lead.ID]?.Parcelamento,
                      valores[lead.ID]?.VigenciaFinal // Passa a VigenciaFinal para a função de confirmação
                    )}
                    disabled={isButtonDisabled}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: isButtonDisabled ? '#999' : '#007bff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: isButtonDisabled ? 'default' : 'pointer',
                      width: '100%',
                    }}
                  >
                    Confirmar Seguradora
                  </button>
                ) : (
                  <span style={{ marginTop: '8px', color: 'green', fontWeight: 'bold' }}>
                    Status confirmado
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default LeadsFechados;
