import React, { useState, useEffect, useRef } from 'react';
import { RefreshCcw } from 'lucide-react';

const LeadsFechados = ({ leads, usuarios, onUpdateInsurer, onConfirmInsurer, onUpdateDetalhes, fetchLeadsFechadosFromSheet, isAdmin, scrollContainerRef }) => {
  const [fechadosFiltradosInterno, setFechadosFiltradosInterno] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const leadsPorPagina = 10;

  const getMesAnoAtual = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  };

  const getDataParaComparacao = (dataStr) => {
    if (!dataStr) return '';
    try {
      const dateObj = new Date(dataStr);
      if (isNaN(dateObj.getTime())) {
        const parts = dataStr.split('/');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return '';
      }
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
  const [premioLiquidoInputDisplay, setPremioLiquidoInputDisplay] = useState({});

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

  const nomeContemFiltro = (leadNome, filtroNome) => {
    if (!filtroNome) return true;
    if (!leadNome) return false;

    const nomeNormalizado = normalizarTexto(leadNome);
    const filtroNormalizado = normalizarTexto(filtroNome);

    return nomeNormalizado.includes(filtroNormalizado);
  };

  const aplicarFiltroNome = () => {
    const filtroLimpo = nomeInput.trim();
    setFiltroNome(filtroLimpo);
    setFiltroData('');
    setDataInput('');
    setPaginaAtual(1);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const aplicarFiltroData = () => {
    setFiltroData(dataInput);
    setFiltroNome('');
    setNomeInput('');
    setPaginaAtual(1);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
        const rawPremioFromApi = String(lead.PremioLiquido || '');
        const premioFromApi = parseFloat(rawPremioFromApi.replace('.', '').replace(',', '.'));
        const premioInCents = isNaN(premioFromApi) || rawPremioFromApi === '' ? null : Math.round(premioFromApi * 100);

        const apiComissao = lead.Comissao ? String(lead.Comissao).replace('.', ',') : '';
        const apiParcelamento = lead.Parcelamento || '';
        const apiInsurer = lead.Seguradora || '';

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
            ...novosValores[lead.ID],
            PremioLiquido: premioInCents,
            Comissao: apiComissao,
            Parcelamento: apiParcelamento,
            insurer: apiInsurer,
          };
        }
      });
      return novosValores;
    });

    setPremioLiquidoInputDisplay(prevDisplay => {
      const newDisplay = { ...prevDisplay };
      fechadosAtuais.forEach(lead => {
        const currentPremio = String(lead.PremioLiquido || '');
        if (currentPremio !== '') {
          const premioFloat = parseFloat(currentPremio.replace(',', '.'));
          newDisplay[lead.ID] = isNaN(premioFloat) ? '' : premioFloat.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else if (prevDisplay[lead.ID] === undefined) {
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

    const fechadosOrdenados = [...fechadosAtuais].sort((a, b) => {
      const dataA = new Date(getDataParaComparacao(a.Data));
      const dataB = new Date(getDataParaComparacao(b.Data));
      return dataB.getTime() - dataA.getTime();
    });

    let leadsFiltrados;
    if (filtroNome) {
      leadsFiltrados = fechadosOrdenados.filter(lead =>
        nomeContemFiltro(lead.name, filtroNome)
      );
    } else if (filtroData) {
      leadsFiltrados = fechadosOrdenados.filter(lead => {
        const dataLeadMesAno = lead.Data ? getDataParaComparacao(lead.Data).substring(0, 7) : '';
        return dataLeadMesAno === filtroData;
      });
    } else {
      leadsFiltrados = fechadosOrdenados;
    }

    setFechadosFiltradosInterno(leadsFiltrados);
  }, [leads, filtroNome, filtroData]);

  const formatarMoeda = (valorCentavos) => {
    if (valorCentavos === null || isNaN(valorCentavos)) return '';
    return (valorCentavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePremioLiquidoChange = (id, valor) => {
    let cleanedValue = valor.replace(/[^\d,\.]/g, '');
    const commaParts = cleanedValue.split(',');
    if (commaParts.length > 2) {
      cleanedValue = commaParts[0] + ',' + commaParts.slice(1).join('');
    }
      
    if (commaParts.length > 1 && commaParts[1].length > 2) {
      cleanedValue = commaParts[0] + ',' + commaParts[1].slice(0, 2);
    }
      
    setPremioLiquidoInputDisplay(prev => ({
      ...prev,
      [`${id}`]: cleanedValue,
    }));

    const valorParaParse = cleanedValue.replace(/\./g, '').replace(',', '.');
    const valorEmReais = parseFloat(valorParaParse);
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
      cleanedValue = parts[0] + ',' + parts[1].slice(0, 2);
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
        ...prev[`${id}`],
        inicio: dataString,
        final: dataFinal,
      },
    }));
  };

  const totalPaginas = Math.max(1, Math.ceil(fechadosFiltradosInterno.length / leadsPorPagina));
  const inicio = (paginaAtual - 1) * leadsPorPagina;
  const fim = inicio + leadsPorPagina;
  const leadsPagina = fechadosFiltradosInterno.slice(inicio, fim);

  const handlePaginaAnterior = () => {
    setPaginaAtual(prev => Math.max(prev - 1, 1));
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePaginaProxima = () => {
    setPaginaAtual(prev => Math.min(prev + 1, totalPaginas));
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    <div id="leads-container" style={{ padding: '20px', position: 'relative', minHeight: 'calc(100vh - 100px)' }}>
      {isLoading && (
        <div className="absolute inset-0 bg-white flex justify-center items-center z-50" style={{ opacity: 0.9 }}>
          <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="ml-4 text-lg text-gray-700">Carregando LEADS...</p>
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
        <>
          {leadsPagina.map((lead) => {
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

            const isButtonDisabled =
              !valores[`${lead.ID}`]?.insurer ||
              valores[`${lead.ID}`]?.PremioLiquido === null ||
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
                  {responsavel && <p><strong>Responsável:</strong> {responsavel.nome}</p>}
                </div>
                <div style={{ minWidth: '350px' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <label>
                      <strong style={{ display: 'block', marginBottom: '5px' }}>Seguradora:</strong>
                      <select
                        value={valores[`${lead.ID}`]?.insurer || ''}
                        onChange={(e) => handleInsurerChange(lead.ID, e.target.value)}
                        style={inputNoPrefixStyle}
                      >
                        <option value="">Selecione a seguradora</option>
                        <option value="HDI">HDI</option>
                        <option value="SUHAI">SUHAI</option>
                        <option value="ALLIANZ">ALLIANZ</option>
                        <option value="LIBERTY">LIBERTY</option>
                        <option value="PORTO">PORTO</option>
                        <option value="TOYOTA">TOYOTA</option>
                        <option value="TOKIO MARINE">TOKIO MARINE</option>
                        <option value="AZUL">AZUL</option>
                        <option value="SOMPO">SOMPO</option>
                        <option value="SULAMÉRICA">SULAMÉRICA</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </label>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label>
                      <strong style={{ display: 'block', marginBottom: '5px' }}>Prêmio Líquido:</strong>
                      <div style={inputWrapperStyle}>
                        <span style={prefixStyle}>R$</span>
                        <input
                          type="text"
                          value={premioLiquidoInputDisplay[`${lead.ID}`] || ''}
                          onChange={(e) => handlePremioLiquidoChange(lead.ID, e.target.value)}
                          onBlur={() => handlePremioLiquidoBlur(lead.ID)}
                          style={inputWithPrefixStyle}
                          placeholder="0,00"
                        />
                      </div>
                    </label>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label>
                      <strong style={{ display: 'block', marginBottom: '5px' }}>Comissão:</strong>
                      <div style={inputWrapperStyle}>
                        <input
                          type="text"
                          value={valores[`${lead.ID}`]?.Comissao || ''}
                          onChange={(e) => handleComissaoChange(lead.ID, e.target.value)}
                          onBlur={() => onUpdateDetalhes(lead.ID, 'Comissao', valores[`${lead.ID}`]?.Comissao)}
                          style={inputNoPrefixStyle}
                          placeholder="Ex: 25,50"
                        />
                      </div>
                    </label>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label>
                      <strong style={{ display: 'block', marginBottom: '5px' }}>Parcelamento:</strong>
                      <input
                        type="text"
                        value={valores[`${lead.ID}`]?.Parcelamento || ''}
                        onChange={(e) => handleParcelamentoChange(lead.ID, e.target.value)}
                        onBlur={() => onUpdateDetalhes(lead.ID, 'Parcelamento', valores[`${lead.ID}`]?.Parcelamento)}
                        style={inputNoPrefixStyle}
                        placeholder="Ex: 1x, 2x..."
                      />
                    </label>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label>
                      <strong style={{ display: 'block', marginBottom: '5px' }}>Vigência Inicial:</strong>
                      <input
                        type="date"
                        value={vigencia[`${lead.ID}`]?.inicio || ''}
                        onChange={(e) => handleVigenciaInicioChange(lead.ID, e.target.value)}
                        onBlur={() => onUpdateDetalhes(lead.ID, 'VigenciaInicial', vigencia[`${lead.ID}`]?.inicio)}
                        style={inputNoPrefixStyle}
                      />
                    </label>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label>
                      <strong style={{ display: 'block', marginBottom: '5px' }}>Vigência Final:</strong>
                      <input
                        type="date"
                        value={vigencia[`${lead.ID}`]?.final || ''}
                        onChange={(e) => setVigencia(prev => ({
                          ...prev,
                          [`${lead.ID}`]: { ...prev[`${lead.ID}`], final: e.target.value }
                        }))}
                        onBlur={() => onUpdateDetalhes(lead.ID, 'VigenciaFinal', vigencia[`${lead.ID}`]?.final)}
                        style={inputNoPrefixStyle}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    {isSeguradoraPreenchida ? (
                      <button
                        onClick={() => onConfirmInsurer(lead.ID, valores[`${lead.ID}`].insurer)}
                        disabled={isButtonDisabled}
                        style={{
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '10px',
                          cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                          flex: 1,
                        }}
                      >
                        Confirmar
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateInsurer(lead.ID, valores[`${lead.ID}`].insurer)}
                        disabled={isButtonDisabled}
                        style={{
                          backgroundColor: isButtonDisabled ? '#ccc' : '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          padding: '10px',
                          cursor: isButtonDisabled ? 'not-allowed' : 'pointer',
                          flex: 1,
                        }}
                      >
                        Preencher Seguradora
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button
              onClick={handlePaginaAnterior}
              disabled={paginaAtual === 1}
              style={{
                padding: '8px 16px',
                margin: '0 5px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                cursor: 'pointer',
                backgroundColor: paginaAtual === 1 ? '#f0f0f0' : '#fff',
              }}
            >
              Anterior
            </button>
            <span style={{ padding: '8px 16px', margin: '0 5px' }}>Página {paginaAtual} de {totalPaginas}</span>
            <button
              onClick={handlePaginaProxima}
              disabled={paginaAtual === totalPaginas}
              style={{
                padding: '8px 16px',
                margin: '0 5px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                cursor: 'pointer',
                backgroundColor: paginaAtual === totalPaginas ? '#f0f0f0' : '#fff',
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

export default LeadsFechados;
