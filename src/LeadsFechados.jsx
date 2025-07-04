import React, { useState, useEffect } from 'react';

const LeadsFechados = ({ leads, usuarios, onUpdateInsurer, onConfirmInsurer, onUpdateDetalhes, fetchLeadsFechadosFromSheet, isAdmin }) => {
  const fechados = leads.filter(lead => lead.Status === 'Fechado');

  console.log("usuarioLogado", isAdmin)

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
      };
    });
    return inicial;
  });

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
    console.log(dataInput)
  };

  const fechadosOrdenados = [...fechados].sort((a, b) => {
    const dataA = new Date(a.Data);
    const dataB = new Date(b.Data);
    return dataB - dataA; // mais recente primeiro
  });


  const leadsFiltrados = fechadosOrdenados.filter(lead => {
    const nomeMatch = normalizarTexto(lead.name || '').includes(normalizarTexto(filtroNome || ''));
    const dataMatch = filtroData ? lead.Data?.startsWith(filtroData) : true;
    return nomeMatch && dataMatch;
  });

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
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0 }}>Leads Fechados</h1>

          <button title='Clique para atualizar os dados'
            onClick={() => {
              fetchLeadsFechadosFromSheet();
            }}
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
            valores[lead.ID]?.Parcelamento === '';

          return (
            <div key={lead.ID} style={containerStyle}>
              <div style={{ flex: 1 }}>
                <h3>{lead.name}</h3>
                <p><strong>Modelo:</strong> {lead.vehicleModel}</p>
                <p><strong>Ano/Modelo:</strong> {lead.vehicleYearModel}</p>
                <p><strong>Cidade:</strong> {lead.city}</p>
                <p><strong>Telefone:</strong> {lead.phone}</p>
                <p><strong>Tipo de Seguro:</strong> {lead.insurer}</p>

                {responsavel && (
                  <p style={{ marginTop: '10px', color: '#007bff' }}>
                    Transferido para <strong>{responsavel.nome}</strong>
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '250px' }}>
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
                  disabled={lead.Seguradora}
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
                    disabled={lead.Seguradora}
                    maxLength={4}
                    style={inputWithPrefixStyle}
                  />
                </div>

                <select
                  value={valores[lead.ID]?.Parcelamento || ''}
                  onChange={(e) => handleParcelamentoChange(lead.ID, e.target.value)}
                  disabled={lead.Seguradora}
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
                    onClick={() => onConfirmInsurer(lead.ID,
                      parseFloat(valores[lead.ID]?.PremioLiquido.toString().replace('.', ',')),
                      valores[lead.ID]?.insurer,
                      valores[lead.ID]?.Comissao,
                      valores[lead.ID]?.Parcelamento
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
