import React, { useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';

// Ranking recebe currentUser { nome, tipo, email, usuario, id } (pelo menos nome e tipo)
const Ranking = ({ currentUser }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [dadosLeads, setLeads] = useState([]);

  // Estado para filtro por mês/ano (formato yyyy-mm)
  const [dataInput, setDataInput] = useState(() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    return `${ano}-${mes}`;
  });
  const [filtroData, setFiltroData] = useState(dataInput);

  // Variáveis para determinar o contexto do usuário logado
  const isAdmin = currentUser?.tipo === 'Admin';
  const currentUserName = currentUser?.nome;

  // Converte dd/mm/yyyy (ou dd/mm) para yyyy-mm-dd (ou retorna prefixo)
  const converterDataParaISO = (dataStr) => {
    if (!dataStr) return '';
    if (typeof dataStr !== 'string') return '';
    if (dataStr.includes('/')) {
      const partes = dataStr.split('/');
      if (partes.length === 3) {
        return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
      }
    }
    return dataStr.slice(0, 10);
  };

  // Faz fetch de usuários (filtrados pelo servidor quando possível) e dos leads
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      // Monta query para getUsuariosAtivos: se não admin, envia userNome para que o GAS retorne apenas o próprio registro
      const baseUrl = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';
      const paramsUsuarios = new URLSearchParams();
      paramsUsuarios.append('v', 'getUsuariosAtivos');

      if (isAdmin) {
        paramsUsuarios.append('isAdmin', 'true');
      } else if (currentUserName) {
        paramsUsuarios.append('userNome', currentUserName);
      } else if (currentUser?.email) {
        paramsUsuarios.append('userEmail', currentUser.email);
      } else if (currentUser?.usuario) {
        paramsUsuarios.append('userUsuario', currentUser.usuario);
      }

      // Busca usuários
      const respostaUsuarios = await fetch(`${baseUrl}?${paramsUsuarios.toString()}`);
      const usuariosJson = await respostaUsuarios.json();
      setUsuarios(Array.isArray(usuariosJson) ? usuariosJson : []);

      // Busca leads (pegar_clientes_fechados retorna todos os leads; filtragem por usuário será feita localmente)
      const respostaLeads = await fetch(`${baseUrl}?v=pegar_clientes_fechados`);
      const leadsJson = await respostaLeads.json();
      setLeads(Array.isArray(leadsJson) ? leadsJson : []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      setUsuarios([]);
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Monta dados no mount
  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

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

  // Se não for admin, garantimos que a lista de usuários contenha apenas o próprio usuário (por segurança)
  const usuariosFiltradosParaRanking = isAdmin
    ? usuarios.filter(u => u.nome && (u.status === 'Ativo' || u.tipo === 'Admin' || true)) // Admin vê todos (mantive flexível)
    : usuarios.filter(u => {
        // Preferir checar pelo nome (coluna C) — se currentUserName estiver disponível usamos ela
        if (currentUserName) return String(u.nome).trim() === String(currentUserName).trim();
        // fallback por usuario/login/email/id
        if (currentUser?.usuario) return String(u.usuario).trim() === String(currentUser.usuario).trim();
        if (currentUser?.email) return String(u.email).trim().toLowerCase() === String(currentUser.email).trim().toLowerCase();
        return false;
      });

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

  const usuariosComContagem = usuariosFiltradosParaRanking.map((usuario) => {
    // Filtrar leads do usuário com status "Fechado", seguradora e dentro do filtro (yyyy-mm)
    const leadsUsuario = dadosLeads.filter((l) => {
      const responsavelOk = String(l.Responsavel || l.responsavel || l['Responsavel']).trim() === String(usuario.nome).trim();
      const statusOk = String(l.Status || l.status || l['Status']).trim() === 'Fechado';
      const seguradoraOk = (l.Seguradora || l.seguradora || l['Seguradora']);
      const seguradoraFilled = seguradoraOk && String(seguradoraOk).trim() !== '';
      const dataISO = converterDataParaISO(l.Data || l.data || l['Data']);
      const dataOk = !filtroData || (dataISO && dataISO.startsWith(filtroData));
      return responsavelOk && statusOk && seguradoraFilled && dataOk;
    });

    const SEGURADORAS_DEMAIS = [
      'Tokio', 'Yelum', 'Allianz', 'Suhai', 'Bradesco', 'Hdi',
      'Alfa', 'Zurich', 'Mitsui', 'Mapfre'
    ];

    const porto = leadsUsuario.filter(l => String(l.Seguradora || l.seguradora || '').trim() === 'Porto Seguro').length;
    const azul = leadsUsuario.filter(l => String(l.Seguradora || l.seguradora || '').trim() === 'Azul Seguros').length;
    const itau = leadsUsuario.filter(l => String(l.Seguradora || l.seguradora || '').trim() === 'Itau Seguros').length;
    const demais = leadsUsuario.filter(l => SEGURADORAS_DEMAIS.includes(String(l.Seguradora || l.seguradora || '').trim())).length;

    const vendas = porto + azul + itau + demais;

    const premioLiquido = leadsUsuario.reduce(
      (acc, curr) => acc + (Number(curr.PremioLiquido || curr.premioLiquido || 0) || 0),
      0
    );

    const somaPonderadaComissao = leadsUsuario.reduce((acc, lead) => {
      const premio = Number(lead.PremioLiquido || lead.premioLiquido || 0) || 0;
      const comissao = Number(lead.Comissao || lead.comissao || 0) || 0;
      return acc + premio * (comissao / 100);
    }, 0);

    const comissaoMedia = premioLiquido > 0 ? (somaPonderadaComissao / premioLiquido) * 100 : 0;

    const leadsParcelamento = leadsUsuario.filter((l) => l.Parcelamento || l.parcelamento);
    let parcelamentoMedio = 0;
    if (leadsParcelamento.length > 0) {
      const somaParcelamento = leadsParcelamento.reduce((acc, curr) => {
        const val =
          typeof curr.Parcelamento === 'string'
            ? parseInt(curr.Parcelamento.replace('x', ''), 10)
            : Number(curr.Parcelamento || curr.parcelamento) || 0;
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

  // Ordenação do ranking completo (mesmo critério)
  const rankingOrdenado = usuariosComContagem.sort((a, b) => {
    if (b.vendas !== a.vendas) return b.vendas - a.vendas;
    if (b.porto !== a.porto) return b.porto - a.porto;
    if (b.itau !== a.itau) return b.itau - a.itau;
    if (b.azul !== a.azul) return b.azul - a.azul;
    return b.demais - a.demais;
  });

  // Se o usuário não for admin, exibimos apenas seu registro (se existir)
  const rankingParaExibir = isAdmin
    ? rankingOrdenado
    : rankingOrdenado.filter(u => String(u.nome).trim() === String(currentUserName).trim());

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
        <h1 style={{ margin: 0 }}>Ranking de Usuários {isAdmin ? '(Visão Admin)' : ''}</h1>

        <button
          title="Clique para atualizar os dados"
          onClick={handleRefresh}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6',
          }}
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '230px', justifyContent: 'flex-end', marginTop: '8px', marginBottom: '24px' }}>
        <button onClick={aplicarFiltroData} style={{ backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', whiteSpace: 'nowrap', marginRight: '8px' }}>
          Filtrar
        </button>
        <input type="month" value={dataInput} onChange={(e) => setDataInput(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer', minWidth: '140px' }} title="Filtrar leads pela data (mês/ano)" onKeyDown={(e) => { if (e.key === 'Enter') aplicarFiltroData(); }} />
      </div>

      {rankingParaExibir.length === 0 ? (
        <p>Nenhum usuário ativo com leads fechados para o período selecionado.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(600px, 1fr))', gap: '24px' }}>
          {rankingParaExibir.map((usuario, index) => {
            const contadores = [
              { label: 'Vendas', count: usuario.vendas, color: '#000' },
              { label: 'Porto Seguro', count: usuario.porto, color: '#1E90FF' },
              { label: 'Itau Seguros', count: usuario.itau, color: '#FF6600' },
              { label: 'Azul Seguros', count: usuario.azul, color: '#003366' },
              { label: 'Demais Seguradoras', count: usuario.demais, color: '#2E8B57' },
            ];

            const displayRankIndex = index; // já está filtrado por permissão

            return (
              <div key={usuario.id || usuario.usuario || usuario.nome} style={{ position: 'relative', border: '1px solid #ccc', borderRadius: '12px', padding: '24px', backgroundColor: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#333', color: '#fff', borderRadius: '8px', padding: '4px 10px', fontSize: '1.1rem', fontWeight: 'bold' }}>
                  {getMedalha(displayRankIndex)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '20px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#888', flexShrink: 0 }}>
                    {usuario.nome?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{usuario.nome || 'Sem Nome'}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${contadores.length}, 1fr)`, textAlign: 'center', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
                  {contadores.map((item, idx) => (
                    <div key={item.label} style={{ padding: '12px 8px', borderLeft: idx === 0 ? 'none' : '1px solid #eee', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', color: item.color }}>{item.label}</div>
                      <div style={{ fontSize: '1.3rem', marginTop: '6px', fontWeight: 'bold' }}>{item.count}</div>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '12px', color: '#555', fontWeight: '600' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span>Prêmio Líquido: </span>
                    <span style={{ fontWeight: 'bold' }}>{formatarMoeda(usuario.premioLiquido)}</span>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span>Comissão: </span>
                    <span style={{ fontWeight: 'bold' }}>{formatarComissao(usuario.comissao)}</span>
                  </div>
                  <div>
                    <span>Parcelamento: </span>
                    <span style={{ fontWeight: 'bold' }}>{formatarParcelamento(usuario.parcelamento)}</span>
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
