import React, { useEffect, useState } from 'react';

// Componente para renderizar o troféu realista
const TrofeuRealistico = ({ posicao }) => {
  let trophyClass = '';
  let texto = '';

  switch (posicao) {
    case 0: // Ouro
      trophyClass = 'gold-trophy';
      texto = '1º';
      break;
    case 1: // Prata
      trophyClass = 'silver-trophy';
      texto = '2º';
      break;
    case 2: // Bronze
      trophyClass = 'bronze-trophy';
      texto = '3º';
      break;
    default:
      // Para posições além do top 3, retorna o formato original ou um estilo neutro
      return (
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
          {posicao + 1}º
        </div>
      );
  }

  // Define um atraso na animação para que os troféus não se movam perfeitamente sincronizados
  const animationDelay = `${posicao * 0.15}s`;

  return (
    <div className={`trophy-wrapper ${trophyClass}`} style={{ '--animation-delay': animationDelay }}>
      <div className="trophy-base"></div>
      <div className="trophy-stem"></div>
      <div className="trophy-cup">
        <span className="trophy-text">{texto}</span>
        {/* Efeitos de brilho tipo estrela */}
        <div className="star-shine star-shine-1"></div>
        <div className="star-shine star-shine-2"></div>
        <div className="star-shine star-shine-3"></div>
      </div>
    </div>
  );
};


const Ranking = ({ usuarios }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dadosLeads, setLeads] = useState([]);

  // Estado para filtro por mês/ano (formato YYYY-mm)
  const [dataInput, setDataInput] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  });

  const [filtroData, setFiltroData] = useState(dataInput);

  // Função para converter data no formato dd/mm/aaaa para YYYY-mm-dd
  const converterDataParaISO = (dataStr) => {
    if (!dataStr) return '';
    if (dataStr.includes('/')) {
      const partes = dataStr.split('/');
      if (partes.length === 3) {
        // dd/mm/aaaa -> YYYY-mm-dd
        return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
      }
    }
    // Se já estiver em formato ISO ou outro, tentar retornar só o prefixo YYYY-mm
    return dataStr.slice(0, 7);
  };

  const buscarClientesFechados = async () => {
    setIsLoading(true); // Ativa o loader
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
      setIsLoading(false); // Desativa o loader
    }
  };

  useEffect(() => {
    buscarClientesFechados();
  }, []);

  if (!Array.isArray(usuarios) || !Array.isArray(dadosLeads)) {
    // Mantém a mensagem de erro para dados mal carregados
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
    // Filtrar leads fechados do usuário com status "Fechado", seguradora preenchida e data dentro do filtro (yyyy-mm)
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
      {/* Estilos CSS para as animações e troféus */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Animação de flutuação para o troféu */
          @keyframes float-trophy {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0px); }
          }

          /* Animação de rotação sutil para o troféu */
          @keyframes rotateTrophy {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(5deg); }
            100% { transform: rotateY(0deg); }
          }

          /* Animação de brilho tipo estrela */
          @keyframes starTwinkle {
            0%, 100% { opacity: 0; transform: scale(0.5); }
            50% { opacity: 1; transform: scale(1); }
          }

          .trophy-wrapper {
            width: 45px; /* Largura total do troféu */
            height: 60px; /* Altura total do troféu */
            position: relative;
            animation: float-trophy 3s ease-in-out infinite var(--animation-delay);
            perspective: 1000px; /* Para a rotação 3D */
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-end; /* Alinha a base para baixo */
          }

          .trophy-base {
            width: 40px;
            height: 8px;
            border-radius: 0 0 5px 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            position: relative;
            z-index: 1;
          }

          .trophy-stem {
            width: 10px;
            height: 15px;
            border-radius: 2px 2px 0 0;
            box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.2);
            position: relative;
            z-index: 2;
          }

          .trophy-cup {
            width: 45px;
            height: 30px;
            border-radius: 50% 50% 0 0 / 100% 100% 0 0; /* Forma de taça */
            box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.4), inset 0 -5px 10px rgba(255, 255, 255, 0.3);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            z-index: 3;
            animation: rotateTrophy 4s ease-in-out infinite var(--animation-delay);
          }

          /* Cores para Ouro */
          .gold-trophy .trophy-base,
          .gold-trophy .trophy-stem,
          .gold-trophy .trophy-cup {
            background: linear-gradient(135deg, #FFD700 0%, #FFECB3 40%, #B8860B 100%);
            border: 1px solid #DAA520;
          }
          .gold-trophy .trophy-text { color: #8B4513; } /* Marrom para ouro */

          /* Cores para Prata */
          .silver-trophy .trophy-base,
          .silver-trophy .trophy-stem,
          .silver-trophy .trophy-cup {
            background: linear-gradient(135deg, #C0C0C0 0%, #E0E0E0 40%, #A9A9A9 100%);
            border: 1px solid #808080;
          }
          .silver-trophy .trophy-text { color: #2F4F4F; } /* Cinza escuro para prata */

          /* Cores para Bronze */
          .bronze-trophy .trophy-base,
          .bronze-trophy .trophy-stem,
          .bronze-trophy .trophy-cup {
            background: linear-gradient(135deg, #CD7F32 0%, #D2B48C 40%, #A0522D 100%);
            border: 1px solid #8B4513;
          }
          .bronze-trophy .trophy-text { color: #FFFFFF; } /* Branco para bronze */

          .trophy-text {
            position: relative;
            z-index: 1; /* Garante que o texto fique acima do brilho */
            font-size: 0.9rem; /* Ajustado para caber na taça */
            font-weight: bold;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
          }

          /* Estilos e posições para os brilhos tipo estrela */
          .star-shine {
            position: absolute;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            opacity: 0;
            animation: starTwinkle 2s ease-in-out infinite alternate;
          }

          .star-shine-1 {
            width: 6px;
            height: 6px;
            top: 20%;
            left: 15%;
            animation-delay: 0.2s;
          }

          .star-shine-2 {
            width: 5px;
            height: 5px;
            top: 50%;
            left: 70%;
            animation-delay: 0.7s;
          }

          .star-shine-3 {
            width: 4px;
            height: 4px;
            top: 70%;
            left: 30%;
            animation-delay: 1.2s;
          }
        `}
      </style>

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
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h1 style={{ margin: 0 }}>Ranking de Usuários</h1>

        <button
          title="Clique para atualizar os dados"
          onClick={() => {
            buscarClientesFechados();
          }}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '6px 14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Atualizar
        </button>
      </div>

      {/* Filtro data: canto direito */}
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

      {isLoading ? null : rankingOrdenado.length === 0 ? (
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
                key={usuario.id}
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
                    zIndex: 10,
                  }}
                >
                  {/* Usa o novo componente de Troféu Realístico */}
                  <TrofeuRealistico posicao={index} />
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
