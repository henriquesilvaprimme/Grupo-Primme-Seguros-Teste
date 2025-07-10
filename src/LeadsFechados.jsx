import React, { useState, useEffect } from 'react';
import { RefreshCcw } from 'lucide-react';

const LeadsFechados = ({ leads, usuarios, onUpdateInsurer, onConfirmInsurer, onUpdateDetalhes, fetchLeadsFechadosFromSheet, isAdmin }) => {
  const [fechadosFiltradosInterno, setFechadosFiltradosInterno] = useState([]);

  const getMesAnoAtual = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  };

  const getDataParaComparacao = (dataStr) => {
    if (!dataStr) return '';
    // A data pode vir do Sheets como DD/MM/YYYY ou do GAS já formatada como YYYY-MM-DD.
    // Esta função deve ser robusta para ambos.
    if (dataStr.includes('/')) {
      const parts = dataStr.split('/');
      return `${parts[2]}-${parts[1]}-${parts[0]}`; // Converte DD/MM/YYYY para YYYY-MM-DD
    }
    return dataStr; // Já está em YYYY-MM-DD
  };

  const [valores, setValores] = useState({});
  const [vigencia, setVigencia] = useState({});
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

    // Atualiza estado de valores (incluindo seguradora, prêmio, comissão, parcelamento)
    setValores(prevValores => {
      const novosValores = { ...prevValores };
      fechadosAtuais.forEach(lead => {
        const rawPremioFromApi = String(lead.PremioLiquido || '0').replace('.', '').replace(',', '.'); // Remove separadores de milhar e troca vírgula por ponto
        const premioFromApi = parseFloat(rawPremioFromApi);
        const premioInCents = isNaN(premioFromApi) ? null : Math.round(premioFromApi * 100);

        // Somente atualiza se houver mudança para evitar renderizações desnecessárias
        if (!novosValores[lead.ID] ||
            novosValores[lead.ID].PremioLiquido !== premioInCents ||
            novosValores[lead.ID].Comissao !== (lead.Comissao ? String(lead.Comissao).replace('.', ',') : '') ||
            novosValores[lead.ID].Parcelamento !== (lead.Parcelamento || '') ||
            novosValores[lead.ID].insurer !== (lead.Seguradora || '')) {

          novosValores[lead.ID] = {
            ...novosValores[lead.ID],
            PremioLiquido: premioInCents,
            Comissao: lead.Comissao ? String(lead.Comissao).replace('.', ',') : '',
            Parcelamento: lead.Parcelamento || '',
            insurer: lead.Seguradora || '', // Garante que a seguradora do Sheets inicialize o estado
          };
        }
      });
      return novosValores;
    });

    // Atualiza estado de vigências
    setVigencia(prevVigencia => {
      const novasVigencias = { ...prevVigencia };
      fechadosAtuais.forEach(lead => {
        // As datas devem vir do GAS no formato YYYY-MM-DD para o input type="date"
        const vigenciaInicioStr = String(lead.VigenciaInicial || '');
        const vigenciaFinalStr = String(lead.VigenciaFinal || '');

        if (!novasVigencias[lead.ID] ||
            novasVigencias[lead.ID].inicio !== vigenciaInicioStr ||
            novasVigencias[lead.ID].final !== vigenciaFinalStr) {
          novasVigencias[lead.ID] = {
            ...novasVigencias[lead.ID],
            inicio: vigenciaInicioStr,
            final: vigenciaFinalStr,
          };
        }
      });
      return novasVigencias;
    });

    const fechadosOrdenados = [...fechadosAtuais].sort((a, b) => {
      const dataA = new Date(getDataParaComparacao(a.Data));
      const dataB = new Date(getDataParaComparacao(b.Data));
      return dataB.getTime() - dataA.getTime();
    });

    const leadsFiltrados = fechadosOrdenados.filter(lead => {
      const nomeMatch = normalizarTexto(lead.name || '').includes(normalizarTexto(filtroNome || ''));
      const dataLeadMesAno = lead.Data ? getDataParaComparacao(lead.Data).substring(0, 7) : '';
      const dataMatch = filtroData ? dataLeadMesAno === filtroData : true;
      return nomeMatch && dataMatch;
    });

    setFechadosFiltradosInterno(leadsFiltrados);

  }, [leads, filtroNome, filtroData]); // Dependências do useEffect

  const formatarMoeda = (valorCentavos) => {
    if (valorCentavos === null || isNaN(valorCentavos)) return '';
    return (valorCentavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePremioLiquidoChange = (id, valor) => {
    let cleanedValue = valor.replace(/[^\d.,]/g, '');

    const parts = cleanedValue.split(',');
    if (parts.length > 2) {
      cleanedValue = parts[0] + ',' + parts.slice(1).join('');
    }
    if (parts.length > 1 && parts[1].length > 2) {
      cleanedValue = parts[0] + ',' + parts[1].slice(0, 2);
    }

    const valorParaParse = cleanedValue.replace(/\./g, '').replace(',', '.');
    const valorEmReais = parseFloat(valorParaParse);
    const valorParaEstado = isNaN(valorEmReais) || valorEmReais === 0 ? null : Math.round(valorEmReais * 100);

    setValores(prev => ({
      ...prev,
      [`${id}`]: {
        ...prev[`${id}`],
        PremioLiquido: valorParaEstado,
      },
    }));
  };

  const handlePremioLiquidoBlur = (id) => {
    const valorCentavos = valores[`${id}`]?.PremioLiquido;
    let valorReais = null;

    if (valorCentavos !== null && !isNaN(valorCentavos)) {
        valorReais = valorCentavos / 100;
    }
    onUpdateDetalhes(id, 'PremioLiquido', valorReais);
  };

  const handleComissaoChange = (id, valor) => {
    let cleanedValue = valor.replace(/[^\d,]/g, '');
    const parts = cleanedValue.split(',');
    if (parts.length > 2) {
        cleanedValue = parts[0] + ',' + parts.slice(1).join('');
    }
    if (parts.length > 1 && parts[1].length > 2) {
        cleanedValue = parts[0] + ',' + parts[1].slice(0,2);
    }
    
    setValores(prev => ({
        ...prev,
        [`${id}`]: {
            ...prev[`${id}`],
            Comissao: cleanedValue,
        },
    }));

    const valorFloat = parseFloat(cleanedValue.replace(',', '.'));
    onUpdateDetalhes(id, 'Comissao', isNaN(valorFloat) ? '' : valorFloat);
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

  const handleInsurerChange = (id, valor) => {
    // Apenas atualiza o estado local, a chamada ao GAS será no "Confirmar Seguradora"
    setValores(prev => ({
        ...prev,
        [`${id}`]: {
            ...prev[`${id}`],
            insurer: valor,
        },
    }));
    // Não chama onUpdateInsurer aqui para evitar o reset.
};

  const handleVigenciaInicioChange = (id, dataString) => {
    let dataFinal = '';
    if (dataString) {
      const dataInicioObj = new Date(dataString + 'T00:00:00'); // Garante que a data é tratada no fuso horário local
      if (!isNaN(dataInicioObj.getTime())) {
        const anoInicio = dataInicioObj.getFullYear();
        const mesInicio = String(dataInicioObj.getMonth() + 1).padStart(2, '0');
        const diaInicio = String(dataInicioObj.getDate()).padStart(2, '0');

        const anoFinal = anoInicio + 1;
        dataFinal = `${anoFinal}-${mesInicio}-${diaInicio}`;
      }
    }

    setVigencia(prev => ({
      ...prev,
      [`${id}`]: {
        ...prev[`${id}`],
        inicio: dataString,
        final: dataFinal,
      },
    }));
    // Não chama onUpdateDetalhes aqui para evitar o reset/chamadas desnecessárias.
    // A atualização para o GAS será no "Confirmar Seguradora".
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

  const inputNoPrefixStyle = {
    paddingLeft: '8px',
    paddingRight: '8px',
    width: '100%',
    border: '1px solid #ccc',
    borderRadius: '4px',
    height: '36px',
    boxSizing: 'border-box',
    textAlign: 'left',
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

          const isSeguradoraPreenchida = !!lead.Seguradora;

          // Verifica se todos os campos necessários estão preenchidos antes de habilitar o botão
          const isButtonDisabled =
            !valores[`${lead.ID}`]?.insurer ||
            valores[`${lead.ID}`]?.PremioLiquido === null || // Já é null se for 0 ou inválido
            valores[`${lead.ID}`]?.PremioLiquido === undefined ||
            !valores[`${lead.ID}`]?.Comissao ||
            parseFloat(String(valores[`${lead.ID}`]?.Comissao || '0').replace(',', '.')) === 0 ||
            !valores[`${lead.ID}`]?.Parcelamento ||
            valores[`${lead.ID}`]?.Parcelamento === '' ||
            !vigencia[`${lead.ID}`]?.inicio ||
            !vigencia[`${lead.ID}`]?.final;

          return (
            <div key={lead.ID} style={containerStyle}>
              <div style={{ flex: 1 }}>
                <h3>{lead.name}</h3>
                <p><strong>Modelo:</strong> {lead.vehicleModel}</p>
                <p><strong>Ano/Modelo:</strong> {lead.vehicleYearModel}</p>
                <p><strong>Cidade:</strong> {lead.city}</p>
                <p><strong>Telefone:</strong> {lead.phone}</p>
                <p><strong>Tipo de Seguro:</strong> {lead.insurancetype}</p>

                {responsavel && (
                  <p style={{ marginTop: '10px', color: '#007bff' }}>
                    Transferido para <strong>{responsavel.nome}</strong>
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '250px' }}>
                <select
                  value={valores[`${lead.ID}`]?.insurer || ''} // Vinculado ao estado local
                  onChange={(e) => handleInsurerChange(lead.ID, e.target.value)}
                  disabled={isSeguradoraPreenchida}
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
                    onBlur={() => handlePremioLiquidoBlur(lead.ID)} // Envia para o GAS no blur
                    disabled={isSeguradoraPreenchida}
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
                    disabled={isSeguradoraPreenchida}
                    style={inputWithPrefixStyle}
                  />
                </div>

                <select
                  value={valores[`${lead.ID}`]?.Parcelamento || ''}
                  onChange={(e) => handleParcelamentoChange(lead.ID, e.target.value)}
                  disabled={isSeguradoraPreenchida}
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

                <div style={inputWrapperStyle}>
                  <label htmlFor={`vigencia-inicio-${lead.ID}`} style={{ fontSize: '0.85em', color: '#555', display: 'block', marginBottom: '4px' }}>Vigência Início:</label>
                  <input
                    id={`vigencia-inicio-${lead.ID}`}
                    type="date"
                    value={vigencia[`${lead.ID}`]?.inicio || ''} // Vinculado ao estado `vigencia`
                    onChange={(e) => handleVigenciaInicioChange(lead.ID, e.target.value)}
                    disabled={isSeguradoraPreenchida}
                    style={{
                      ...inputNoPrefixStyle,
                      marginBottom: '8px',
                    }}
                  />
                </div>

                <div style={inputWrapperStyle}>
                  <label htmlFor={`vigencia-final-${lead.ID}`} style={{ fontSize: '0.85em', color: '#555', display: 'block', marginBottom: '4px' }}>Vigência Final:</label>
                  <input
                    id={`vigencia-final-${lead.ID}`}
                    type="date"
                    value={vigencia[`${lead.ID}`]?.final || ''} // Vinculado ao estado `vigencia`
                    readOnly
                    disabled={true}
                    style={{
                      ...inputNoPrefixStyle,
                      backgroundColor: '#f0f0f0',
                      cursor: 'not-allowed',
                      marginBottom: '8px',
                    }}
                  />
                </div>

                {!isSeguradoraPreenchida ? (
                  <button
                    onClick={async () => {
                        // Ao confirmar, passa todos os valores do estado local para o GAS
                        await onConfirmInsurer(
                            lead.ID,
                            valores[`${lead.ID}`]?.PremioLiquido === null ? null : valores[`${lead.ID}`]?.PremioLiquido / 100, // Envia em reais
                            valores[`${lead.ID}`]?.insurer,
                            parseFloat(String(valores[`${lead.ID}`]?.Comissao || '0').replace(',', '.')),
                            valores[`${lead.ID}`]?.Parcelamento,
                            vigencia[`${lead.ID}`]?.inicio, // Envia YYYY-MM-DD
                            vigencia[`${lead.ID}`]?.final // Envia YYYY-MM-DD
                        );
                        await fetchLeadsFechadosFromSheet(); // Recarrega os dados para refletir as mudanças do Sheets
                    }}
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
