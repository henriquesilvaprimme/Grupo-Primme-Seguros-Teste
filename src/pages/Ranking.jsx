import React, { useEffect, useState } from 'react';

const Ranking = ({ usuarios }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dadosLeads, setLeads] = useState([]);

  // Estado para filtro por mês/ano (formato YYYY-MM)
  const [dataInput, setDataInput] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  });

  const [filtroData, setFiltroData] = useState(dataInput);

  // Função para converter data no formato dd/mm/aaaa para YYYY-MM-DD
  const converterDataParaISO = (dataStr) => {
    if (!dataStr) return '';
    if (dataStr.includes('/')) {
      const partes = dataStr.split('/');
      if (partes.length === 3) {
        // dd/mm/aaaa -> YYYY-MM-DD
        return `${partes[2]}-${partes[1]}-${partes[0]}`;
      }
    }
    return dataStr; // Retorna como está se já for YYYY-MM-DD ou outro formato
  };

  const buscarClientesFechados = async () => {
    setIsLoading(true); // Ativa o loader
    try {
      const response = await fetch('https://raw.githubusercontent.com/reinaldoperes/leads/main/leads.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const dados = await response.json();
      setLeads(dados);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setLeads([]);
    } finally {
      setIsLoading(false); // Desativa o loader
    }
  };

  useEffect(() => {
    buscarClientesFechados();
  }, []);

  if (!Array.isArray(usuarios) || !Array.isArray(dadosLeads)) {
    return <div style={{ padding: 20 }}>Erro: dados não carregados corretamente.</div>;
  }

  const ativos = usuarios.filter(
    (u) =>
      u.status === 'Ativo' &&
      u.email !== 'admin@admin.com' &&
      u.tipo !== 'Admin'
  );

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
    // Filtrar leads fechados do usuário com status "Fechado", seguradora preenchida e data dentro do filtro (YYYY-MM)
    const leadsUsuario = dadosLeads.filter((l) => {
      const responsavelOk = l.Responsavel === usuario.nome;
      const statusOk = l.Status === 'Fechado';
      const seguradoraOk = l.Seguradora && l.Seguradora.trim() !== '';
      const dataISO = converterDataParaISO(l.Data);
      const dataOk = !filtroData || dataISO.startsWith(filtroData);
      return responsavelOk && statusOk && seguradoraOk && dataOk;
    });

    const getCount = (seguradora) =>
      leadsUsuario.filter((l) => l.Seguradora === seguradora).length;

    const porto = getCount('Porto Seguro');
    const azul = getCount('Azul Seguros');
    const itau = getCount('Itau Seguros');
    const demais = getCount('Demais Seguradoras');

    const vendas = porto + azul + itau + demais;

    const premioLiquido = leadsUsuario.reduce(
      (acc, curr) => acc + (Number(curr.PremioLiquido) || 0),
      0
    );

    const somaPonderadaComissao = leadsUsuario.reduce((acc, lead) => {
      const premio = Number(lead.PremioLiquido) || 0;
      const comissao = Number(lead.Comissao) || 0;
      return acc + premio * (comissao / 100);
    }, 0);

    const comissaoMedia =
      premioLiquido > 0 ? (somaPonderadaComissao / premioLiquido) * 100 : 0;

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

  const aplicarFiltroData = () => {
    setFiltroData(dataInput);
  };

  return (
    <div style={{ padding: 20, position: 'relative' }}>
      {/* Estilos CSS para o loader */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .loader {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 2s linear infinite;
            position: absolute;
            top: 50%;
            left: 50%;
            margin-top: -20px;
            margin-left: -20px;
            z-index: 1000;
          }
          .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 999;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        `}
      </style>

      {isLoading && (
        <div className="overlay">
          <div className="loader"></div>
        </div>
      )}

      <h1 style={{ marginBottom: 20, textAlign: 'center', color: '#333' }}>
        Ranking de Vendas
      </h1>

      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <label htmlFor="data-filtro" style={{ marginRight: 10, fontWeight: 'bold' }}>
          Filtrar por Mês/Ano:
        </label>
        <input
          type="month"
          id="data-filtro"
          value={dataInput}
          onChange={(e) => setDataInput(e.target.value)}
          style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button
          onClick={aplicarFiltroData}
          style={{
            marginLeft: 10,
            padding: '8px 15px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Aplicar
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
          maxWidth: 1200,
          margin: '0 auto',
        }}
      >
        {rankingOrdenado.map((usuario, index) => (
          <div
            key={usuario.id}
            style={{
              backgroundColor: '#fff',
              borderRadius: 10,
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              padding: 20,
              textAlign: 'center',
              position: 'relative',
              border:
                index === 0
                  ? '3px solid gold'
                  : index === 1
                  ? '3px solid silver'
                  : index === 2
                  ? '3px solid #cd7f32' // Bronze
                  : 'none',
              overflow: 'hidden', // Para conter o brilho
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 10,
                fontSize: '50px', // Ajuste o tamanho do emoji conforme necessário
                lineHeight: '1', // Garante que o emoji fique bem posicionado
              }}
            >
              {index === 0 && '🏆'} {/* Troféu de Ouro para o 1º */}
              {index === 1 && '🥈'} {/* Medalha de Prata para o 2º */}
              {index === 2 && '🥉'} {/* Medalha de Bronze para o 3º */}
              {index > 2 && (
                <div
                  style={{
                    backgroundColor: '#333',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                  }}
                >
                  {index + 1}º
                </div>
              )}
            </div>

            <h2 style={{ color: '#007bff', marginBottom: 10 }}>
              {usuario.nome}
            </h2>
            <p style={{ fontSize: '1.2rem', color: '#555' }}>
              <strong style={{ color: '#333' }}>Vendas Fechadas:</strong>{' '}
              {usuario.vendas}
            </p>
            <p style={{ fontSize: '1.2rem', color: '#555' }}>
              <strong style={{ color: '#333' }}>Prêmio Líquido:</strong>{' '}
              {formatarMoeda(usuario.premioLiquido)}
            </p>
            <p style={{ fontSize: '1.2rem', color: '#555' }}>
              <strong style={{ color: '#333' }}>Comissão Média:</strong>{' '}
              {formatarComissao(usuario.comissao)}
            </p>
            <p style={{ fontSize: '1.2rem', color: '#555' }}>
              <strong style={{ color: '#333' }}>Parcelamento Médio:</strong>{' '}
              {formatarParcelamento(usuario.parcelamento)}
            </p>

            <div style={{ marginTop: 15, borderTop: '1px solid #eee', paddingTop: 15 }}>
              <h3 style={{ color: '#333', marginBottom: 10 }}>Vendas por Seguradora:</h3>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: 5 }}>
                  Porto Seguro: <strong style={{ color: '#007bff' }}>{usuario.porto}</strong>
                </li>
                <li style={{ marginBottom: 5 }}>
                  Azul Seguros: <strong style={{ color: '#007bff' }}>{usuario.azul}</strong>
                </li>
                <li style={{ marginBottom: 5 }}>
                  Itaú Seguros: <strong style={{ color: '#007bff' }}>{usuario.itau}</strong>
                </li>
                <li style={{ marginBottom: 5 }}>
                  Demais Seguradoras: <strong style={{ color: '#007bff' }}>{usuario.demais}</strong>
                </li>
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ranking;
