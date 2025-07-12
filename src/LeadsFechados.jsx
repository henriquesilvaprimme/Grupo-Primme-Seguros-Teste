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
    // A data pode vir do Sheets como DD/MM/YYYY ou do GAS já formatada como YYYY-MM-DD ou ISO.
    // Esta função deve ser robusta para ambos.
    try {
        const dateObj = new Date(dataStr);
        if (isNaN(dateObj.getTime())) {
            // Tenta parsear como DD/MM/YYYY se o formato ISO falhar
            const parts = dataStr.split('/');
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`; // Converte DD/MM/YYYY para YYYY-MM-DD
            }
            return ''; // Retorna vazio se não conseguir parsear
        }
        // Se for um objeto Date válido, formata para YYYY-MM-DD
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error("Erro ao formatar data para comparação:", dataStr, e);
        return '';
    }
  };

  const [valores, setValores] = useState({});
  const [vigencia, setVigencia] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [nomeInput, setNomeInput] = useState('');
  const [dataInput, setDataInput] = useState(getMesAnoAtual());
  const [filtroNome, setFiltroNome] = useState('');
  const [filtroData, setFiltroData] = useState(getMesAnoAtual());

  // Novo estado para controlar o valor do Prêmio Líquido enquanto o usuário digita
  const [premioLiquidoInputDisplay, setPremioLiquidoInputDisplay] = useState({});


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

    setValores(prevValores => {
      const novosValores = { ...prevValores };
      fechadosAtuais.forEach(lead => {
        const rawPremioFromApi = String(lead.PremioLiquido || ''); // Não force '0' se estiver vazio/nulo
        const premioFromApi = parseFloat(rawPremioFromApi.replace('.', '').replace(',', '.')); // Lidar com formato BR ou US
        const premioInCents = isNaN(premioFromApi) || rawPremioFromApi === '' ? null : Math.round(premioFromApi * 100);

        const apiComissao = lead.Comissao ? String(lead.Comissao).replace('.', ',') : '';
        const apiParcelamento = lead.Parcelamento || '';
        const apiInsurer = lead.Seguradora || '';

        // ATENÇÃO: Lógica para evitar reset de Seguradora e outros campos
        // Só atualiza o estado local se o valor da API for diferente do estado atual
        // OU se o estado local para aquele campo ainda não foi definido (primeira carga)
        // Isso garante que a seleção do usuário não seja sobrescrita por uma re-renderização
        // se o valor já estiver definido localmente (a menos que seja o valor inicial da API)
        if (!novosValores[lead.ID] ||
            (novosValores[lead.ID].PremioLiquido === undefined && premioInCents !== null) ||
            (novosValores[lead.ID].PremioLiquido !== premioInCents && prevValores[lead.ID]?.PremioLiquido === undefined) ||
            (novosValores[lead.ID].Comissao === undefined && apiComissao !== '') ||
            (novosValores[lead.ID].Comissao !== apiComissao && prevValores[lead.ID]?.Comissao === undefined) ||
            (novosValores[lead.ID].Parcelamento === undefined && apiParcelamento !== '') ||
            (novosValores[lead.ID].Parcelamento !== apiParcelamento && prevValores[lead.ID]?.Parcelamento === undefined) ||
            (novosValores[lead.ID].insurer === undefined && apiInsurer !== '') ||
            (novosValores[lead.ID].insurer !== apiInsurer && prevValores[lead.ID]?.insurer === undefined)
        ) {
            novosValores[lead.ID] = {
                ...novosValores[lead.ID], // Mantém quaisquer outros campos que já existam
                PremioLiquido: premioInCents,
                Comissao: apiComissao,
                Parcelamento: apiParcelamento,
                insurer: apiInsurer,
            };
        }
      });
      return novosValores;
    });

    // Inicializa premioLiquidoInputDisplay para que o input comece em branco
    setPremioLiquidoInputDisplay(prevDisplay => {
        const newDisplay = { ...prevDisplay };
        fechadosAtuais.forEach(lead => {
            const currentPremio = String(lead.PremioLiquido || '');
            // Se o valor vindo da API não for vazio, formata para exibir.
            // Caso contrário, deixa em branco.
            if (currentPremio !== '') {
                // Converte para float antes de formatar para string de exibição
                const premioFloat = parseFloat(currentPremio.replace(',', '.'));
                newDisplay[lead.ID] = isNaN(premioFloat) ? '' : premioFloat.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            } else if (prevDisplay[lead.ID] === undefined) { // Só limpa se ainda não foi setado
                newDisplay[lead.ID] = '';
            }
        });
        return newDisplay;
    });


    setVigencia(prevVigencia => {
      const novasVigencias = { ...prevVigencia };
      fechadosAtuais.forEach(lead => {
        const vigenciaInicioStrApi = String(lead.VigenciaInicial || '');
        const vigenciaFinalStrApi = String(lead.VigenciaFinal || '');

        // ATENÇÃO: Lógica para evitar reset das Vigências
        // Só atualiza o estado local se o valor da API for diferente do estado atual
        // OU se o estado local para aquele campo ainda não foi definido (primeira carga)
        if (!novasVigencias[lead.ID] || (novasVigencias[lead.ID].inicio === undefined && vigenciaInicioStrApi !== '') || (novasVigencias[lead.ID].inicio !== vigenciaInicioStrApi && prevVigencia[lead.ID]?.inicio === undefined)) {
          novasVigencias[lead.ID] = {
            ...novasVigencias[lead.ID],
            inicio: vigenciaInicioStrApi,
          };
        }
        if (!novasVigencias[lead.ID] || (novasVigencias[lead.ID].final === undefined && vigenciaFinalStrApi !== '') || (novasVigencias[lead.ID].final !== vigenciaFinalStrApi && prevVigencia[lead.ID]?.final === undefined)) {
          novasVigencias[lead.ID] = {
            ...novasVigencias[lead.ID],
            final: vigenciaFinalStrApi,
          };
        }
      });
      return novasVigencias;
    });


    // Lógica de ordenação para leads fechados (mantida por data de criação, mais recente primeiro)
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
    if (valorCentavos === null || isNaN(valorCentavos)) return ''; // Retorna string vazia para nulos/NaN
    return (valorCentavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePremioLiquidoChange = (id, valor) => {
    // Remove tudo que não for número, vírgula ou ponto
    let cleanedValue = valor.replace(/[^\d,\.]/g, '');

    // Permite apenas uma vírgula
    const commaParts = cleanedValue.split(',');
    if (commaParts.length > 2) {
      cleanedValue = commaParts[0] + ',' + commaParts.slice(1).join('');
    }
    
    // Limita a duas casas decimais após a vírgula
    if (commaParts.length > 1 && commaParts[1].length > 2) {
      cleanedValue = commaParts[0] + ',' + commaParts[1].slice(0, 2);
    }
    
    // Atualiza o estado de display para que o usuário veja o que está digitando
    setPremioLiquidoInputDisplay(prev => ({
        ...prev,
        [`${id}`]: cleanedValue,
    }));

    // Para o parsing interno e envio ao GAS, tratamos a vírgula como separador decimal.
    const valorParaParse = cleanedValue.replace(/\./g, '').replace(',', '.');
    const valorEmReais = parseFloat(valorParaParse);
    // Se o valor for vazio ou inválido, define como null para o estado interno e envio
    const valorParaEstado = isNaN(valorEmReais) || cleanedValue === '' ? null : Math.round(valorEmReais * 100);

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

    // Atualiza o display do input para o formato de moeda ao sair do foco
    setPremioLiquidoInputDisplay(prev => ({
        ...prev,
        [`${id}`]: valorCentavos !== null && !isNaN(valorCentavos) ? formatarMoeda(valorCentavos) : '',
    }));

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
    // Apenas atualiza o estado local para que o <select> reflita a mudança IMEDIATAMENTE.
    // A chamada ao GAS (onUpdateInsurer) só ocorre no botão "Confirmar Seguradora".
    setValores(prev => ({
        ...prev,
        [`${id}`]: {
            ...prev[`${id}`],
            insurer: valor,
        },
    }));
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
                <p><strong>Tipo de Seguro:</strong> {lead.insuranceType}</p>

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
                    value={premioLiquidoInputDisplay[`${lead.ID}`] || ''} // Exibe o valor do estado de display
                    onChange={(e) => handlePremioLiquidoChange(lead.ID, e.target.value)}
                    onBlur={() => handlePremioLiquidoBlur(lead.ID)} // Envia para o GAS no blur e formata exibição
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
                            valores[`${lead.ID}`]?.insurer, // Seguradora
                            parseFloat(String(valores[`${lead.ID}`]?.Comissao || '0').replace(',', '.')), // Comissão
                            valores[`${lead.ID}`]?.Parcelamento, // Parcelamento
                            vigencia[`${lead.ID}`]?.final,   // Enviando VIGENCIA_FINAL para o parâmetro VIGENCIA_FINAL no GAS
                            vigencia[`${lead.ID}`]?.inicio   // Enviando VIGENCIA_INICIAL para o parâmetro VIGENCIA_INICIAL no GAS
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
