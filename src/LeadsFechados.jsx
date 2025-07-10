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
      // Aqui, ao inicializar, se PremioLiquido já vem como string "1.000,00" ou similar,
      // precisamos converter para centavos corretamente para o estado interno.
      // Se ele já vem como número do GAS, ele será multiplicado por 100.
      const premio = parseFloat(String(lead.PremioLiquido || '0').replace('.', '').replace(',', '.')); // Garante que é um número
      inicial[lead.ID] = {
        PremioLiquido: !isNaN(premio) ? Math.round(premio * 100) : 0, // Armazena em centavos
        Comissao: lead.Comissao ? String(lead.Comissao).replace('.', ',') : '', // Exibe com vírgula para o usuário
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
      // O backend (joinUsersClosed) deve garantir que lead.VigenciaInicial (Coluna O) e lead.VigenciaFinal (Coluna P)
      // já cheguem no formato "YYYY-MM-DD" para o input type="date".
      // Se eles vêm como DD/MM/YYYY, precisamos converter aqui.
      const vigenciaInicioStr = String(lead.VigenciaInicial || '');
      const vigenciaFinalStr = String(lead.VigenciaFinal || '');

      const dataInicioFormatada = vigenciaInicioStr.includes('/') 
        ? vigenciaInicioStr.split('/').reverse().join('-') // Converte DD/MM/YYYY para YYYY-MM-DD
        : vigenciaInicioStr; // Já está em YYYY-MM-DD ou vazio

      const dataFinalFormatada = vigenciaFinalStr.includes('/') 
        ? vigênciaFinalStr.split('/').reverse().join('-') // Converte DD/MM/YYYY para YYYY-MM-DD
        : vigenciaFinalStr; // Já está em YYYY-MM-DD ou vazio

      inicialVigencia[lead.ID] = {
        inicio: dataInicioFormatada,
        final: dataFinalFormatada,
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

  // Carrega os leads na montagem do componente e sempre que os leads mudam
  useEffect(() => {
    handleRefresh();
  }, []); // Chama apenas na montagem inicial

  useEffect(() => {
    const fechadosAtuais = leads.filter(lead => lead.Status === 'Fechado');

    const fechadosOrdenados = [...fechadosAtuais].sort((a, b) => {
      const getDataParaComparacao = (dataStr) => {
        if (!dataStr) return '';
        // Converte DD/MM/YYYY para YYYY-MM-DD para comparação de datas
        return dataStr.includes('/') ? dataStr.split('/').reverse().join('-') : dataStr;
      };

      const dataA = new Date(getDataParaComparacao(a.Data));
      const dataB = new Date(getDataParaComparacao(b.Data));
      return dataB.getTime() - dataA.getTime();
    });

    const leadsFiltrados = fechadosOrdenados.filter(lead => {
      const nomeMatch = normalizarTexto(lead.name || '').includes(normalizarTexto(filtroNome || ''));
      // Ajuste se o campo 'Data' na sua API for DD/MM/YYYY
      const dataLeadMesAno = lead.Data ? getDataParaComparacao(lead.Data).substring(0, 7) : ''; 
      const dataMatch = filtroData ? dataLeadMesAno === filtroData : true;
      return nomeMatch && dataMatch;
    });

    setFechadosFiltradosInterno(leadsFiltrados);

    // Atualiza o estado de valores para novos leads carregados
    setValores(prevValores => {
      const novosValores = { ...prevValores };
      fechadosAtuais.forEach(lead => {
        if (!novosValores[lead.ID]) {
          const premio = parseFloat(String(lead.PremioLiquido || '0').replace('.', '').replace(',', '.'));
          novosValores[lead.ID] = {
            PremioLiquido: !isNaN(premio) ? Math.round(premio * 100) : 0,
            Comissao: lead.Comissao ? String(lead.Comissao).replace('.', ',') : '',
            Parcelamento: lead.Parcelamento || '',
            insurer: lead.Seguradora || '',
          };
        } else {
            // Se o lead já existe, atualiza PremioLiquido caso tenha sido alterado no backend
            const premioAtualizado = parseFloat(String(lead.PremioLiquido || '0').replace('.', '').replace(',', '.'));
            if (novosValores[lead.ID].PremioLiquido !== Math.round(premioAtualizado * 100)) {
                novosValores[lead.ID].PremioLiquido = Math.round(premioAtualizado * 100);
            }
            // Garante que o Comissao e Parcelamento também são atualizados se mudarem externamente
            if (novosValores[lead.ID].Comissao !== (lead.Comissao ? String(lead.Comissao).replace('.', ',') : '')) {
                novosValores[lead.ID].Comissao = lead.Comissao ? String(lead.Comissao).replace('.', ',') : '';
            }
            if (novosValores[lead.ID].Parcelamento !== (lead.Parcelamento || '')) {
                novosValores[lead.ID].Parcelamento = lead.Parcelamento || '';
            }
            if (novosValores[lead.ID].insurer !== (lead.Seguradora || '')) {
                novosValores[lead.ID].insurer = lead.Seguradora || '';
            }
        }
      });
      return novosValores;
    });

    // Atualiza o estado de vigência para novos leads carregados ou quando leads mudam
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

        // Atualiza apenas se os valores no estado são diferentes dos valores do lead
        if (!novasVigencias[lead.ID] || 
            novasVigencias[lead.ID].inicio !== dataInicioFormatada || 
            novasVigencias[lead.ID].final !== dataFinalFormatada) {
          novasVigencias[lead.ID] = {
            inicio: dataInicioFormatada,
            final: dataFinalFormatada,
          };
        }
      });
      return novasVigencias;
    });

  }, [leads, filtroNome, filtroData]); // Dependências do useEffect

  const formatarMoeda = (valorCentavos) => {
    if (isNaN(valorCentavos) || valorCentavos === null) return '';
    // Converte centavos para reais e formata
    return (valorCentavos / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePremioLiquidoChange = (id, valor) => {
    // Remove tudo que não for número, mas permite vírgula para formatação do usuário
    const somenteNumerosEVirgula = valor.replace(/[^\d,]/g, ''); 
    const partes = somenteNumerosEVirgula.split(',');

    let valorNumericoString = partes[0]; // Parte inteira
    if (partes.length > 1) {
        valorNumericoString += '.' + partes[1].slice(0, 2); // Pega até 2 casas decimais
    }

    let valorEmReais = parseFloat(valorNumericoString.replace(',', '.')); // Converte para float usando ponto
    if (isNaN(valorEmReais)) valorEmReais = 0;

    // Salva no estado em centavos
    setValores(prev => ({
      ...prev,
      [`${id}`]: {
        ...prev[`${id}`],
        PremioLiquido: Math.round(valorEmReais * 100),
      },
    }));
  };

  const handlePremioLiquidoBlur = (id) => {
    const valorCentavos = valores[`${id}`]?.PremioLiquido || 0;
    const valorReais = valorCentavos / 100; // Converte para reais para enviar ao backend

    if (!isNaN(valorReais)) {
      // Envia o valor em reais para o backend
      onUpdateDetalhes(id, 'PremioLiquido', valorReais);
    } else {
      onUpdateDetalhes(id, 'PremioLiquido', '');
    }
  };

  const handleComissaoChange = (id, valor) => {
    // Permite números e vírgula, e limita a 2 casas decimais após a vírgula
    const regex = /^(\d{0,2})(,?\d{0,2})?$/; // Ex: 12,34
    
    // Remove letras e múltiplos separadores, permite apenas uma vírgula
    let cleanedValue = valor.replace(/[^\d,]/g, '');
    const parts = cleanedValue.split(',');
    if (parts.length > 2) { // remove vírgulas extras
        cleanedValue = parts[0] + ',' + parts.slice(1).join('');
    }
    
    // Limita a duas casas decimais
    if (parts.length > 1 && parts[1].length > 2) {
        cleanedValue = parts[0] + ',' + parts[1].slice(0,2);
    }

    // Limita o número inteiro a 2 dígitos antes da vírgula para não permitir % acima de 99
    if (parts[0].length > 2) {
        cleanedValue = cleanedValue.slice(0,2) + (parts.length > 1 ? ',' + parts[1] : '');
    }

    setValores(prev => ({
        ...prev,
        [`${id}`]: {
            ...prev[`${id}`],
            Comissao: cleanedValue, // Mantém como string para exibição
        },
    }));

    // Converte para float com ponto para enviar ao backend
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

  // Lógica para calcular Vigência Final
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

  const inputNoPrefixStyle = { // Estilo para inputs sem prefixo (como as datas)
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

          // Validação dos campos antes de habilitar o botão
          const isButtonDisabled =
            !valores[`${lead.ID}`]?.insurer ||
            !valores[`${lead.ID}`]?.PremioLiquido ||
            valores[`${lead.ID}`]?.PremioLiquido === 0 || // Garante que não é zero centavos
            !valores[`${lead.ID}`]?.Comissao ||
            parseFloat(valores[`${lead.ID}`]?.Comissao.replace(',', '.')) === 0 || // Garante que a comissão não é zero (após conversão)
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
                    // maxLength={4} // Removido, pois a validação já trata o tamanho
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

                {/* --- Campos de Vigência --- */}
                <div style={inputWrapperStyle}>
                  <label htmlFor={`vigencia-inicio-${lead.ID}`} style={{ fontSize: '0.85em', color: '#555', display: 'block', marginBottom: '4px' }}>Vigência Início:</label>
                  <input
                    id={`vigencia-inicio-${lead.ID}`}
                    type="date"
                    value={vigencia[`${lead.ID}`]?.inicio || ''}
                    onChange={(e) => handleVigenciaInicioChange(lead.ID, e.target.value)}
                    disabled={isSeguradoraPreenchida} // Desabilita se já tem seguradora
                    style={{
                      ...inputNoPrefixStyle, // Usa o estilo sem prefixo
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
                      ...inputNoPrefixStyle, // Usa o estilo sem prefixo
                      backgroundColor: '#f0f0f0', // Cor de fundo para campo readonly
                      cursor: 'not-allowed', // Cursor de "não permitido"
                      marginBottom: '8px',
                    }}
                  />
                </div>
                {/* --- Fim dos campos de Vigência --- */}

                {!isSeguradoraPreenchida ? (
                  <button
                    onClick={() => onConfirmInsurer(
                      lead.ID,
                      // ENVIAR PRÊMIO LÍQUIDO EM REAIS (dividido por 100)
                      valores[`${lead.ID}`]?.PremioLiquido / 100, 
                      valores[`${lead.ID}`]?.insurer,
                      // ENVIAR COMISSÃO COMO FLOAT (substituindo vírgula por ponto)
                      parseFloat(valores[`${lead.ID}`]?.Comissao.replace(',', '.')),
                      valores[`${lead.ID}`]?.Parcelamento,
                      vigencia[`${lead.ID}`]?.inicio, // Vigência Inicial (formato YYYY-MM-DD)
                      vigencia[`${lead.ID}`]?.final // Vigência Final (formato YYYY-MM-DD)
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
