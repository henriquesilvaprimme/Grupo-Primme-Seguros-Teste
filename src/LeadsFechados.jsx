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
    return dataStr.includes('/') ? dataStr.split('/').reverse().join('-') : dataStr;
  };

  // --- Estado para valores (Prêmio, Comissão, Parcelamento, Seguradora) ---
  const [valores, setValores] = useState({});

  // --- Estado para as datas de vigência ---
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

  // Efeito para carregar leads na montagem e para lidar com a atualização após confirmação
  useEffect(() => {
    // Apenas chame o refresh na montagem inicial ou se houver uma mudança crucial
    // que necessite recarregar tudo (como o primeiro carregamento da props 'leads').
    // O ideal é que fetchLeadsFechadosFromSheet seja chamado no App.jsx após a confirmação.
    handleRefresh(); 
  }, []); // Dependência vazia para rodar apenas uma vez na montagem inicial.

  // Efeito para sincronizar os dados da prop 'leads' com os estados internos
  // e aplicar filtros
  useEffect(() => {
    const fechadosAtuais = leads.filter(lead => lead.Status === 'Fechado');

    // --- Atualiza o estado 'valores' ---
    setValores(prevValores => {
      const novosValores = { ...prevValores };
      fechadosAtuais.forEach(lead => {
        // Converte o prêmio líquido da API para centavos para o estado interno
        // E só define se ainda não existe ou se o valor da API é diferente do estado
        const premioFromApi = parseFloat(String(lead.PremioLiquido || '0').replace('.', '').replace(',', '.'));
        const premioInCents = isNaN(premioFromApi) ? null : Math.round(premioFromApi * 100); // Use null para indicar vazio, não 0

        if (!novosValores[lead.ID] || 
            novosValores[lead.ID].PremioLiquido !== premioInCents ||
            novosValores[lead.ID].Comissao !== (lead.Comissao ? String(lead.Comissao).replace('.', ',') : '') ||
            novosValores[lead.ID].Parcelamento !== (lead.Parcelamento || '') ||
            novosValores[lead.ID].insurer !== (lead.Seguradora || '')) {
            
          novosValores[lead.ID] = {
            ...novosValores[lead.ID], // Preserva outros campos se existirem
            PremioLiquido: premioInCents, // Null se vazio, senão em centavos
            Comissao: lead.Comissao ? String(lead.Comissao).replace('.', ',') : '',
            Parcelamento: lead.Parcelamento || '',
            insurer: lead.Seguradora || '',
          };
        }
      });
      return novosValores;
    });

    // --- Atualiza o estado 'vigencia' ---
    setVigencia(prevVigencia => {
      const novasVigencias = { ...prevVigencia };
      fechadosAtuais.forEach(lead => {
        const vigenciaInicioStr = String(lead.VigenciaInicial || '');
        const vigenciaFinalStr = String(lead.VigenciaFinal || '');

        const dataInicioFormatada = vigenciaInicioStr.includes('/') 
          ? vigenciaInicioStr.split('/').reverse().join('-') 
          : vigenciaInicioStr;

        const dataFinalFormatada = vigenciaFinalStr.includes('/') 
          ? vigenciaFinalStr.split('/').reverse().join('-') 
          : vigenciaFinalStr;

        if (!novasVigencias[lead.ID] || 
            novasVigencias[lead.ID].inicio !== dataInicioFormatada || 
            novasVigencias[lead.ID].final !== dataFinalFormatada) {
          novasVigencias[lead.ID] = {
            ...novasVigencias[lead.ID], // Preserva outros campos se existirem
            inicio: dataInicioFormatada,
            final: dataFinalFormatada,
          };
        }
      });
      return novasVigencias;
    });

    // --- Lógica de Filtro e Ordenação (inalterada) ---
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

  }, [leads, filtroNome, filtroData]); // Dependências: re-executa se leads, filtroNome ou filtroData mudarem.

  const formatarMoeda = (valorCentavos) => {
    if (valorCentavos === null || isNaN(valorCentavos)) return ''; // Retorna vazio se null ou NaN
    return (valorCentavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePremioLiquidoChange = (id, valor) => {
    const somenteNumerosEVirgula = valor.replace(/[^\d,]/g, ''); 
    const partes = somenteNumerosEVirgula.split(',');

    let valorNumericoString = partes[0];
    if (partes.length > 1) {
        valorNumericoString += '.' + partes[1].slice(0, 2);
    }

    let valorEmReais = parseFloat(valorNumericoString.replace(',', '.'));
    // Se o campo estiver vazio ou for inválido, define como null, não 0
    const valorParaEstado = isNaN(valorEmReais) || valorEmReais === 0 ? null : Math.round(valorEmReais * 100);

    setValores(prev => ({
      ...prev,
      [`${id}`]: {
        ...prev[`${id}`], // <--- PRESERVA OUTROS VALORES AQUI!
        PremioLiquido: valorParaEstado,
      },
    }));
  };

  const handlePremioLiquidoBlur = (id) => {
    const valorCentavos = valores[`${id}`]?.PremioLiquido; // Pode ser null aqui
    let valorReais = null;

    if (valorCentavos !== null && !isNaN(valorCentavos)) {
        valorReais = valorCentavos / 100;
    }
    
    // Envia null ou o valor em reais
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

    if (parts[0].length > 2) {
        cleanedValue = cleanedValue.slice(0,2) + (parts.length > 1 ? ',' + parts[1] : '');
    }

    setValores(prev => ({
        ...prev,
        [`${id}`]: {
            ...prev[`${id}`], // <--- PRESERVA OUTROS VALORES AQUI!
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
        ...prev[`${id}`], // <--- PRESERVA OUTROS VALORES AQUI!
        Parcelamento: valor,
      },
    }));
    onUpdateDetalhes(id, 'Parcelamento', valor);
  };

  const handleInsurerChange = (id, valor) => {
    setValores(prev => ({
        ...prev,
        [`${id}`]: {
            ...prev[`${id}`], // <--- PRESERVA OUTROS VALORES AQUI!
            insurer: valor,
        },
    }));
    // onUpdateInsurer(lead.ID, valor); // Esta chamada não é mais necessária aqui
};

  const handleVigenciaInicioChange = (id, dataString) => {
    let dataFinal = '';
    if (dataString) {
      const dataInicioObj = new Date(dataString + 'T00:00:00');
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
        ...prev[`${id}`], // <--- PRESERVA OUTROS VALORES AQUI!
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

          // Ajusta a validação para permitir prêmio líquido nulo/vazio para o botão desabilitado
          const isButtonDisabled =
            !valores[`${lead.ID}`]?.insurer ||
            valores[`${lead.ID}`]?.PremioLiquido === null || // Permite que seja null, mas não 0
            !valores[`${lead.ID}`]?.Comissao ||
            parseFloat(valores[`${lead.ID}`]?.Comissao.replace(',', '.')) === 0 ||
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
                  value={valores[`${lead.ID}`]?.insurer || ''}
                  onChange={(e) => handleInsurerChange(lead.ID, e.target.value)} // Usa a nova função
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
                    onBlur={() => handlePremioLiquidoBlur(lead.ID)}
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
                    value={vigencia[`${lead.ID}`]?.inicio || ''}
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
                    value={vigencia[`${lead.ID}`]?.final || ''}
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
                    onClick={async () => { // Adicionado async aqui para await
                        await onConfirmInsurer(
                            lead.ID,
                            valores[`${lead.ID}`]?.PremioLiquido === null ? null : valores[`${lead.ID}`]?.PremioLiquido / 100,
                            valores[`${lead.ID}`]?.insurer,
                            parseFloat(valores[`${lead.ID}`]?.Comissao.replace(',', '.')),
                            valores[`${lead.ID}`]?.Parcelamento,
                            vigencia[`${lead.ID}`]?.inicio,
                            vigencia[`${${lead.ID}`]?.final
                        );
                        // Após a confirmação, re-buscar os leads para atualizar a visualização
                        // Isso garante que os campos reflitam o estado salvo no Sheets
                        await fetchLeadsFechadosFromSheet(); 
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
