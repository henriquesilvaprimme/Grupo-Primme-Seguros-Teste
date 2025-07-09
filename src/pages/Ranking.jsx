import React, { useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react'; // Importado para o ícone de refresh

const Ranking = ({ usuarios }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [dadosLeads, setLeads] = useState([]);

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

  const handleRefresh = async () => {
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
    handleRefresh();
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

  const getMedalha = (posicao) => {
    const medalhas = ['🥇', '🥈', '🥉'];
    return medalhas[posicao] || `${posicao + 1}º`;
  };

  const aplicarFiltroData = () => {
    // Quando o filtro é aplicado, também queremos mostrar o loader enquanto os dados são reprocessados
    // Já que o handleRefresh busca os dados brutos novamente, ele já cuida do loader.
    // Mas se o filtro só recalcula, você precisaria de um `setIsLoading(true)` aqui e um `setIsLoading(false)` após o cálculo.
    // Por simplicidade, vamos manter a lógica atual de recarregar tudo com o handleRefresh.
    // Se a lógica do filtro for apenas de reprocessamento local, o loader não se aplicaria
    // mas se for buscar novos dados filtrados do backend, seria necessário.
    // Para esta versão, se clicar em "Filtrar" e for uma operação local rápida, o loader pode não aparecer.
    // Se o filtro envolver nova requisição, chame handleRefresh() aqui.
    // Por enquanto, apenas atualize o filtro localmente.
    setFiltroData(dataInput);
  };

  // Se você quer o loader de página completa ANTES do `return` principal, mova-o para cá
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-4 text-lg text-gray-700">Carregando dados do ranking...</p>
      </div>
    );
  }

  // Se houver erro E não estiver carregando, exibe a mensagem de erro
  if (error) {
    return <div className="p-6 text-center text-red-600 font-medium text-lg">{error}</div>;
  }

  return (
    <div className="p-6"> {/* Removido o style inline e aplicado com Tailwind */}
      <div className="flex items-center gap-3 mb-6"> {/* Removido o style inline e aplicado com Tailwind */}
        <h1 className="text-3xl font-bold text-indigo-700">Ranking de Usuários</h1> {/* Removido o style inline e aplicado com Tailwind */}

        <button
          title="Clique para atualizar os dados"
          onClick={handleRefresh}
          className="p-2 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all duration-200 ease-in-out flex items-center justify-center shadow-sm"
          disabled={isLoading} // Desabilita o botão enquanto estiver carregando
        >
          {isLoading ? ( // Mostra o spinner se estiver carregando (já que o loader principal já cuida de tudo)
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
        className="flex items-center gap-2 justify-end mt-2 mb-6" // Adicionado mb-6 para espaçamento inferior
      >
        <button
          onClick={aplicarFiltroData}
          className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg transition-all duration-200 ease-in-out whitespace-nowrap"
        >
          Filtrar
        </button>
        <input
          type="month"
          value={dataInput}
          onChange={(e) => setDataInput(e.target.value)}
          className="p-2 rounded-lg border border-gray-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36" // Adicionado classes Tailwind para melhor visual
          title="Filtrar leads pela data (mês/ano)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') aplicarFiltroData();
          }}
        />
      </div>

      {!Array.isArray(usuarios) || !Array.isArray(dadosLeads) || rankingOrdenado.length === 0 ? (
        <p className="text-center text-gray-600 text-lg py-4">
          Nenhum usuário ativo com leads fechados para o período selecionado ou dados não carregados.
        </p>
      ) : (
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(600px, 1fr))' }} // Mantido gridTemplateColumns inline para flexibilidade
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
                className="relative border border-gray-300 rounded-lg p-6 bg-white shadow-md"
              >
                <div
                  className="absolute top-3 right-3 bg-gray-800 text-white rounded-lg px-2.5 py-1 text-lg font-bold"
                >
                  {getMedalha(index)}
                </div>

                <div className="flex items-center mb-6 gap-5">
                  <div
                    className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl text-gray-700 flex-shrink-0"
                  >
                    {usuario.nome?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {usuario.nome || 'Sem Nome'}
                  </div>
                </div>

                <div
                  className="grid text-center border-t border-b border-gray-200"
                  style={{ gridTemplateColumns: `repeat(${contadores.length}, 1fr)` }} // Mantido gridTemplateColumns inline
                >
                  {contadores.map((item, idx) => (
                    <div
                      key={item.label}
                      className="py-3 px-2 whitespace-nowrap"
                      style={{ borderLeft: idx === 0 ? 'none' : '1px solid #eee' }} // Mantido borderLeft inline
                    >
                      <div
                        className="font-semibold text-sm"
                        style={{ color: item.color }} // Mantido color inline
                      >
                        {item.label}
                      </div>
                      <div
                        className="text-2xl mt-1.5 font-bold"
                      >
                        {item.count}
                      </div>
                    </div>
                  ))}
                </div>

                <div
                  className="text-center border-t border-gray-200 pt-3 text-gray-600 font-semibold mt-4" // Removido marginTop do style e adicionado mt-4 do Tailwind
                >
                  <div className="mb-2">
                    <span>Prêmio Líquido: </span>
                    <span className="font-bold">
                      {formatarMoeda(usuario.premioLiquido)}
                    </span>
                  </div>
                  <div className="mb-2">
                    <span>Comissão: </span>
                    <span className="font-bold">
                      {formatarComissao(usuario.comissao)}
                    </span>
                  </div>
                  <div>
                    <span>Parcelamento: </span>
                    <span className="font-bold">
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
