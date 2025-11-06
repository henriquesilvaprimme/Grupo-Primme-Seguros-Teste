import React, { useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react'; // Importado para o ícone de refresh

const Ranking = ({ usuarios, currentUser: propCurrentUser }) => {
  // Tenta obter currentUser da prop ou do localStorage (fallback)
  const storedUser = (() => {
    try {
      return (
        JSON.parse(localStorage.getItem('currentUser')) ||
        JSON.parse(localStorage.getItem('usuario')) ||
        JSON.parse(localStorage.getItem('user')) ||
        null
      );
    } catch {
      return null;
    }
  })();
  const currentUser = propCurrentUser || storedUser;

  const [isLoading, setIsLoading] = useState(true);
  const [dadosLeads, setLeads] = useState([]);

  // Estado para filtro por mês/ano (formato yyyy-mm)
  const [dataInput, setDataInput] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  });

  const [filtroData, setFiltroData] = useState(dataInput);

  const converterDataParaISO = (dataStr) => {
    if (!dataStr) return '';
    if (dataStr.includes('/')) {
      const partes = dataStr.split('/');
      if (partes.length === 3) {
        return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
      }
    }
    return dataStr.slice(0, 7);
  };

  const getSegNormalized = (seg) => {
    return (seg || '').toString().trim().toLowerCase();
  };

  const demaisSeguradorasLista = [
    'tokio',
    'yelum',
    'suhai',
    'allianz',
    'bradesco',
    'hdi',
    'zurich',
    'alfa',
    'mitsui',
    'mapfre',
    'demais seguradoras',
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const respostaLeads = await fetch(
        'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=pegar_clientes_fechados'
      );
      const dados = await respostaLeads.json();
      setLeads(dados);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-4 text-lg text-gray-700">Carregando RANKING...</p>
      </div>
    );
  }

  if (!Array.isArray(usuarios) || !Array.isArray(dadosLeads)) {
    return <div style={{ padding: 20 }}>Erro: dados não carregados corretamente.</div>;
  }

  // Se não achou currentUser e não é admin, avisa para logar (pode adaptar para comportamento desejado)
  if (!currentUser) {
    return (
      <div style={{ padding: 20 }}>
        Usuário não identificado. Passe a prop <code>currentUser</code> ou armazene o usuário no <code>localStorage</code>.
      </div>
    );
  }

  const isAdmin =
    (currentUser.tipo && currentUser.tipo === 'Admin') ||
    (currentUser.email && currentUser.email === 'admin@admin.com');

  // Se for admin: mostra todos usuários ativos; se não for admin: mostra apenas o usuário logado (se ativo)
  let ativos;
  if (isAdmin) {
    ativos = usuarios.filter((u) => u.status === 'Ativo');
  } else {
    ativos = usuarios.filter((u) => {
      if (u.status !== 'Ativo') return false;
      // Tenta casar por email -> id -> nome
      if (currentUser.email && u.email === currentUser.email) return true;
      if (currentUser.id && u.id === currentUser.id) return true;
      if (currentUser.nome && u.nome === currentUser.nome) return true;
      return false;
    });
  }

  const formatarMoeda = (valor) =>
    valor?.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }) || 'R$ 0,00';

  const formatarComissao = (valor) => {
    if (typeof valor !== 'number' || isNaN(valor)) return '0%';
    let limitado = valor > 99.99 ? 99.99 : valor;
    let str = limitado.toFixed(2).replace(/\.?0+$/, '');
    str = str.replace('.', ',');
    return `${str}%`;
  };

  const formatarParcelamento = (valor) => {
    let num = typeof valor === 'string' ? parseInt(valor.replace('x', ''), 10) : valor;
    if (isNaN(num) || num < 1) return '';
    if (num > 12) num = 12;
    return `${num}x`;
  };

  const usuariosComContagem = ativos.map((usuario) => {
    const leadsUsuario = dadosLeads.filter((l) => {
      const responsavelOk = l.Responsavel === usuario.nome;
      const statusOk = l.Status === 'Fechado';
      const seguradoraOk = l.Seguradora && l.Seguradora.trim() !== '';
      const dataISO = converterDataParaISO(l.Data);
      const dataOk = !filtroData || dataISO.startsWith(filtroData);
      return responsavelOk && statusOk && seguradoraOk && dataOk;
    });

    const porto = leadsUsuario.filter((l) => getSegNormalized(l.Seguradora) === 'porto seguro').length;
    const azul = leadsUsuario.filter((l) => getSegNormalized(l.Seguradora) === 'azul seguros').length;
    const itau = leadsUsuario.filter((l) => getSegNormalized(l.Seguradora) === 'itau seguros').length;

    const demais = leadsUsuario.filter((l) =>
      demaisSeguradorasLista.includes(getSegNormalized(l.Seguradora))
    ).length;

    const vendas = porto + azul + itau + demais;

    const premioLiquido = leadsUsuario.reduce((acc, curr) => acc + (Number(curr.PremioLiquido) || 0), 0);

    const somaPonderadaComissao = leadsUsuario.reduce((acc, lead) => {
      const premio = Number(lead.PremioLiquido) || 0;
      const comissao = Number(lead.Comissao) || 0;
      return acc + premio * (comissao / 100);
    }, 0);

    const comissaoMedia = premioLiquido > 0 ? (somaPonderadaComissao / premioLiquido) * 100 : 0;

    const leadsParcelamento = leadsUsuario.filter((l) => l.Parcelamento);
    let parcelamentoMedio = 0;
    if (leadsParcelamento.length > 0) {
      const somaParcelamento = leadsParcelamento.reduce((acc, curr) => {
        const val =
          typeof curr.Parcelamento === 'string'
            ? parseInt(curr.Parcelamento.replace('x', ''), 10)
            : Number(curr.Parcelamento) || 0;
        return acc + val;
      }, 0);
      parcelamentoMedio = Math.round(somaParcelamento / leadsParcelamento.length);
    }

    return {
      ...usuario,
      vendas,
      porto,
      azul,
      itau,
      demais,
      premioLiquido,
      comissao: comissaoMedia,
      parcelamento: parcelamentoMedio,
    };
  });

  const rankingOrdenado = usuariosComContagem.sort((a, b) => {
    if (b.vendas !== a.vendas) return b.vendas - a.vendas;
    if (b.porto !== a.porto) return b.porto - a.porto;
    if (b.itau !== a.itau) return b.itau - a.itau;
    if (b.azul !== a.azul) return b.azul - a.azul;
    return b.demais - a.demais;
  });

  const getMedalha = (posicao) => {
    const medalhas = ['🥇', '🥈', '🥉'];
    return medalhas[posicao] || `${posicao + 1}º`;
  };

  const aplicarFiltroData = () => {
    setFiltroData(dataInput);
  };

  return (
    <div style={{ padding: 20, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ margin: 0 }}>Ranking de Usuários</h1>

        <button
          title="Clique para atualizar os dados"
          onClick={handleRefresh}
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
          alignItems: 'center',
          gap: '8px',
          minWidth: '230px',
          justifyContent: 'flex-end',
          marginTop: '8px',
          marginBottom: '24px',
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
            marginRight: '8px',
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
            minWidth: '140px',
          }}
          title="Filtrar leads pela data (mês/ano)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') aplicarFiltroData();
          }}
        />
      </div>

      {rankingOrdenado.length === 0 ? (
        <p>Nenhum usuário ativo com leads fechados para o período selecionado.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(600px, 1fr))',
            gap: '24px',
          }}
        >
          {rankingOrdenado.map((usuario, index) => {
            const contadores = [
              { label: 'Vendas', count: usuario.vendas, color: '#000' },
              { label: 'Porto Seguro', count: usuario.porto, color: '#1E90FF' },
              { label: 'Itau Seguros', count: usuario.itau, color: '#FF6600' },
              { label: 'Azul Seguros', count: usuario.azul, color: '#003366' },
              { label: 'Demais Seguradoras', count: usuario.demais, color: '#2E8B57' },
            ];

            return (
              <div
                key={usuario.id || usuario.email || usuario.nome}
                style={{
                  position: 'relative',
                  border: '1px solid #ccc',
                  borderRadius: '12px',
                  padding: '24px',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: '#333',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                  }}
                >
                  {getMedalha(index)}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '24px',
                    gap: '20px',
                  }}
                >
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      backgroundColor: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      color: '#888',
                      flexShrink: 0,
                    }}
                  >
                    {usuario.nome?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div
                    style={{
                      fontSize: '1.4rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {usuario.nome || 'Sem Nome'}
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${contadores.length}, 1fr)`,
                    textAlign: 'center',
                    borderTop: '1px solid #eee',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  {contadores.map((item, idx) => (
                    <div
                      key={item.label}
                      style={{
                        padding: '12px 8px',
                        borderLeft: idx === 0 ? 'none' : '1px solid #eee',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: '600',
                          fontSize: '0.9rem',
                          color: item.color,
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: '1.3rem',
                          marginTop: '6px',
                          fontWeight: 'bold',
                        }}
                      >
                        {item.count}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    textAlign: 'center',
                    borderTop: '1px solid #eee',
                    paddingTop: '12px',
                    color: '#555',
                    fontWeight: '600',
                  }}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <span>Prêmio Líquido: </span>
                    <span style={{ fontWeight: 'bold' }}>
                      {formatarMoeda(usuario.premioLiquido)}
                    </span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span>Comissão: </span>
                    <span style={{ fontWeight: 'bold' }}>
                      {formatarComissao(usuario.comissao)}
                    </span>
                  </div>
                  <div>
                    <span>Parcelamento: </span>
                    <span style={{ fontWeight: 'bold' }}>
                      {formatarParcelamento(usuario.parcelamento)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Ranking;
