import React, { useState, useEffect } from 'react';
import { RefreshCcw } from 'lucide-react'; // Importado para o ícone de refresh

const LeadsFechados = ({ leads, usuarios, onUpdateInsurer, onConfirmInsurer, onUpdateDetalhes, fetchLeadsFechadosFromSheet, isAdmin }) => {
  const [fechadosFiltradosInterno, setFechadosFiltradosInterno] = useState([]);

  const getMesAnoAtual = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  };

  const [valores, setValores] = useState(() => {
    const inicial = {};
    leads.filter(lead => lead.Status === 'Fechado').forEach(lead => {
      inicial[lead.ID] = {
        PremioLiquido: lead.PremioLiquido !== undefined ? Math.round(parseFloat(lead.PremioLiquido) * 100) : 0,
        Comissao: lead.Comissao ? String(lead.Comissao) : '',
        Parcelamento: lead.Parcelamento || '',
        insurer: lead.Seguradora || '',
      };
    });
    return inicial;
  });

  // Estado para as datas de vigência
  const [vigencia, setVigencia] = useState(() => {
    const inicialVigencia = {};
    leads.filter(lead => lead.Status === 'Fechado').forEach(lead => {
      // O backend (joinUsersClosed) já inverteu a leitura para que
      // lead.VigenciaInicial contenha a data da Coluna P
      // e lead.VigenciaFinal contenha a data da Coluna O.
      // Aqui no frontend, os nomes já refletem o que o usuário vai ver/interagir.
      const dataInicio = lead.VigenciaInicial ? new Date(lead.VigenciaInicial).toISOString().split('T')[0] : '';
      const dataFinal = lead.VigenciaFinal ? new Date(lead.VigenciaFinal).toISOString().split('T')[0] : '';

      inicialVigencia[lead.ID] = {
        inicio: dataInicio,
        final: dataFinal,
      };
    });
    return inicialVigencia;
  });

  const [isLoading, setIsLoading] = useState(false);
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
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetchLeadsFechadosFromSheet();
    } catch (error) {
      console.error('Erro ao atualizar leads fechados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  useEffect(() => {
    const fechadosAtuais = leads.filter(lead => lead.Status === 'Fechado');

    const fechadosOrdenados = [...fechadosAtuais].sort((a, b) => {
      const getDataParaComparacao = (dataStr) => {
        if (!dataStr) return '';
        // Garante que o formato é YYYY-MM-DD para comparação
        return dataStr.includes('/') ? dataStr.split('/').reverse().join('-') : dataStr;
      };

      const dataA = new Date(getDataParaComparacao(a.Data));
      const dataB = new Date(getDataParaComparacao(b.Data));
      return dataB.getTime() - dataA.getTime();
    });

    const leadsFiltrados = fechadosOrdenados.filter(lead => {
      const nomeMatch = normalizarTexto(lead.name || '').includes(normalizarTexto(filtroNome || ''));
      // Ajuste aqui se o campo 'Data' na sua API não for YYYY-MM-DD
      // Se for DD/MM/YYYY, você precisará ajustar a substring
      const dataLeadMesAno = lead.Data ? lead.Data.substring(0, 7) : ''; // Assumindo YYYY-MM-DD
      const dataMatch = filtroData ? dataLeadMesAno === filtroData : true;
      return nomeMatch && dataMatch;
    });

    setFechadosFiltradosInterno(leadsFiltrados);

    setValores(prevValores => {
      const novosValores = { ...prevValores };
      fechadosAtuais.forEach(lead => {
        if (!novosValores[lead.ID]) {
          novosValores[lead.ID] = {
            PremioLiquido: lead.PremioLiquido !== undefined ? Math.round(parseFloat(lead.PremioLiquido) * 100) : 0,
            Comissao: lead.Comissao ? String(lead.Comissao) : '',
            Parcelamento: lead.Parcelamento || '',
            insurer: lead.Seguradora || '',
          };
        }
      });
      return novosValores;
    });

    // --- Início da melhoria para inicializar/atualizar o estado de vigência ---
    setVigencia(prevVigencia => {
      const novasVigencias = { ...prevVigencia };
      fechadosAtuais.forEach(lead => {
        // Se o lead ainda não tem entradas de vigência ou se os dados foram atualizados
        if (!novasVigencias[lead.ID] ||
            novasVigencias[lead.ID].inicio !== (lead.VigenciaInicial ? new Date(lead.VigenciaInicial).toISOString().split('T')[0] : '') ||
            novasVigencias[lead.ID].final !== (lead.VigenciaFinal ? new Date(lead.VigenciaFinal).toISOString().split('T')[0] : ''))
        {
          const dataInicio = lead.VigenciaInicial ? new Date(lead.VigenciaInicial).toISOString().split('T')[0] : '';
          const dataFinal = lead.VigenciaFinal ? new Date(lead.VigenciaFinal).toISOString().split('T')[0] : '';
          novasVigencias[lead.ID] = {
            inicio: dataInicio,
            final: dataFinal,
          };
        }
      });
      return novasVigencias;
    });
    // --- Fim da melhoria para inicializar/atualizar o estado de vigência ---

  }, [leads, filtroNome, filtroData]);

  const formatarMoeda = (valorCentavos) => {
    if (isNaN(valorCentavos) || valorCentavos === null) return '';
    return (valorCentavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePremioLiquidoChange = (id, valor) => {
    const somenteNumeros = valor.replace(/\D/g, '');

    if (somenteNumeros === '') {
      setValores(prev => ({
        ...prev,
        [`${id}`]: {
          ...prev[`${id}`],
          PremioLiquido: 0,
        },
      }));
      return;
    }

    let valorCentavos = parseInt(somenteNumeros, 10);
    if (isNaN(valorCentavos)) valorCentavos = 0;

    setValores(prev => ({
      ...prev,
      [`${id}`]: {
        ...prev[`${id}`],
        PremioLiquido: valorCentavos,
      },
    }));
  };

  const handlePremioLiquidoBlur = (id) => {
    const valorCentavos = valores[`${id}`]?.PremioLiquido || 0;
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
        [`${id}`]: {
          ...prev[`${id}`],
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
      [`${id}`]: {
        ...prev[`${id}`],
        Parcelamento: valor,
      },
    }));
    onUpdateDetalhes(id, 'Parcelamento', valor);
  };

  // --- CORREÇÃO AQUI: Lógica para calcular Vigência Final ---
  const handleVigenciaInicioChange = (id, dataString) => {
    let dataFinal = '';
    if (dataString) {
      const dataInicioObj = new Date(dataString + 'T00:00:00'); // Adiciona T00:00:00 para evitar problemas de fuso horário
      if (!isNaN(dataInicioObj.getTime())) { // Verifica se a data é válida
        const anoInicio = dataInicioObj.getFullYear();
        const mesInicio = String(dataInicioObj.getMonth() + 1).padStart(2, '0');
        const diaInicio = String(dataInicioObj.getDate()).padStart(2, '0');

        // Calcula o ano final (1 ano à frente), mantendo dia e mês
        const anoFinal = anoInicio + 1;
        dataFinal = `${anoFinal}-${mesInicio}-${diaInicio}`;
      }
    }

    setVigencia(prev => ({
      ...prev,
      [`${id}`]: {
        inicio: dataString,
        final: dataFinal,
      },
    }));
    // Não chama onUpdateDetalhes aqui, pois a atualização será feita no onConfirmInsurer
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
      {isLoading && (
        <div className="absolute inset-0 bg-white flex justify-center items-center z-10">
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="ml-4 text-lg text-gray-700">Carregando LEADS FECHADOS...</p>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ margin: 0 }}>Leads Fechados</h1>

        <button title='Clique para atualizar os dados'
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <RefreshCcw size={20} />
          )}
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

      {fechadosFiltradosInterno.length === 0 ? (
        <p>Não há leads fechados que correspondam ao filtro aplicado.</p>
      ) : (
        fechadosFiltradosInterno.map((lead) => {
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

          // Verifica se Seguradora já está preenchida para desabilitar campos
          const isSeguradoraPreenchida = !!lead.Seguradora;

          const isButtonDisabled =
            !valores[`${lead.ID}`]?.insurer ||
            !valores[`${lead.ID}`]?.PremioLiquido ||
            valores[`${lead.ID}`]?.PremioLiquido === 0 ||
            !valores[`${lead.ID}`]?.Comissao ||
            valores[`${lead.ID}`]?.Comissao === '' ||
            !valores[`${lead.ID}`]?.Parcelamento ||
            valores[`${lead.ID}`]?.Parcelamento === '' ||
            !vigencia[`${lead.ID}`]?.inicio || // Vigência Início obrigatória
            !vigencia[`${lead.ID}`]?.final; // Vigência Final obrigatória (calculada)


          return (
            <div key={lead.ID} style={containerStyle}>
              <div style={{ flex: 1 }}>
                <h3>{lead.name}</h3>
                <p><strong>Modelo:</strong> {lead.vehicleModel}</p>
                <p><strong>Ano/Modelo:</strong> {lead.vehicleYearModel}</p>
                <p><strong>Cidade:</strong> {lead.city}</p>
                <p><strong>Telefone:</strong> {lead.phone}</p>
                <p><strong>Tipo de Seguro:</strong> {lead.insurancetype}</p> {/* CORRIGIDO AQUI: era 'insurer', deve ser 'insurancetype' ou qual coluna contem o tipo de seguro original */}

                {responsavel && (
                  <p style={{ marginTop: '10px', color: '#007bff' }}>
                    Transferido para <strong>{responsavel.nome}</strong>
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '250px' }}>
                <select
                  value={valores[`${lead.ID}`]?.insurer || ''}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setValores(prev => ({
                      ...prev,
                      [`${lead.ID}`]: {
                        ...prev[`${lead.ID}`],
                        insurer: valor
                      }
                    }));
                    onUpdateInsurer(lead.ID, valor);
                  }}
                  disabled={isSeguradoraPreenchida} // Desabilita se já tem seguradora
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
                    value={formatarMoeda(valores[`${lead.ID}`]?.PremioLiquido)}
                    onChange={(e) => handlePremioLiquidoChange(lead.ID, e.target.value)}
                    onBlur={() => handlePremioLiquidoBlur(lead.ID)}
                    disabled={isSeguradoraPreenchida} // Desabilita se já tem seguradora
                    style={inputWithPrefixStyle}
                  />
                </div>

                <div style={inputWrapperStyle}>
                  <span style={prefixStyle}>%</span>
                  <input
                    type="text"
                    placeholder="Comissão (%)"
                    value={valores[`${lead.ID}`]?.Comissao || ''}
                    onChange={(e) => handleComissaoChange(lead.ID, e.target.value)}
                    disabled={isSeguradoraPreenchida} // Desabilita se já tem seguradora
                    maxLength={4}
                    style={inputWithPrefixStyle}
                  />
                </div>

                <select
                  value={valores[`${lead.ID}`]?.Parcelamento || ''}
                  onChange={(e) => handleParcelamentoChange(lead.ID, e.target.value)}
                  disabled={isSeguradoraPreenchida} // Desabilita se já tem seguradora
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

                {/* --- Novos campos de Vigência --- */}
                <div style={inputWrapperStyle}>
                  <label htmlFor={`vigencia-inicio-${lead.ID}`} style={{ fontSize: '0.85em', color: '#555', display: 'block', marginBottom: '4px' }}>Vigência Início:</label>
                  <input
                    id={`vigencia-inicio-${lead.ID}`}
                    type="date"
                    value={vigencia[`${lead.ID}`]?.inicio || ''}
                    onChange={(e) => handleVigenciaInicioChange(lead.ID, e.target.value)}
                    disabled={isSeguradoraPreenchida} // Desabilita se já tem seguradora
                    style={{
                      ...inputWithPrefixStyle, // Reutiliza estilo, mas sem prefixo R$
                      paddingLeft: '8px', // Ajusta padding
                      textAlign: 'left', // Ajusta alinhamento
                      width: '100%',
                      marginBottom: '8px',
                    }}
                  />
                </div>

                <div style={inputWrapperStyle}>
                  <label htmlFor={`vigencia-final-${lead.ID}`} style={{ fontSize: '0.85em', color: '#555', display: 'block', marginBottom: '4px' }}>Vigência Final:</label>
                  <input
                    id={`vigencia-final-${lead.ID}`}
                    type="date"
                    value={vigencia[`${lead.ID}`]?.final || ''}
                    readOnly // Campo preenchido automaticamente, apenas leitura
                    disabled={true} // Desabilita sempre, pois é auto-preenchido
                    style={{
                      ...inputWithPrefixStyle, // Reutiliza estilo
                      paddingLeft: '8px', // Ajusta padding
                      textAlign: 'left', // Ajusta alinhamento
                      backgroundColor: '#f0f0f0', // Cor de fundo para campo readonly
                      cursor: 'not-allowed', // Cursor de "não permitido"
                      width: '100%',
                      marginBottom: '8px',
                    }}
                  />
                </div>
                {/* --- Fim dos novos campos de Vigência --- */}


                {!isSeguradoraPreenchida ? (
                  <button
                    onClick={() => onConfirmInsurer(
                      lead.ID,
                      parseFloat(valores[`${lead.ID}`]?.PremioLiquido.toString().replace('.', ',')),
                      valores[`${lead.ID}`]?.insurer,
                      valores[`${lead.ID}`]?.Comissao,
                      valores[`${lead.ID}`]?.Parcelamento,
                      vigencia[`${lead.ID}`]?.inicio, // Passa Vigencia Inicial (da Coluna P)
                      vigencia[`${lead.ID}`]?.final // Passa Vigencia Final (da Coluna O)
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
