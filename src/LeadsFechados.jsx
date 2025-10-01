import React, { useState, useEffect, useRef } from 'react';
import { RefreshCcw } from 'lucide-react';

const LeadsFechados = ({ leads, usuarios, onUpdateInsurer, onConfirmInsurer, onUpdateDetalhes, fetchLeadsFechadosFromSheet, isAdmin, scrollContainerRef }) => {
    // --- ESTADOS INICIAIS ---
    const [fechadosFiltradosInterno, setFechadosFiltradosInterno] = useState([]);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const leadsPorPagina = 10;

    const [valores, setValores] = useState({});
    const [vigencia, setVigencia] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [nomeInput, setNomeInput] = useState('');
    
    const getMesAnoAtual = () => {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        return `${ano}-${mes}`;
    };
    
    const [dataInput, setDataInput] = useState(getMesAnoAtual());
    const [filtroNome, setFiltroNome] = useState('');
    const [filtroData, setFiltroData] = useState(getMesAnoAtual());
    const [premioLiquidoInputDisplay, setPremioLiquidoInputDisplay] = useState({});
    
    // --- FUNÇÕES DE LÓGICA (CORRIGIDAS) ---

    /**
     * CORREÇÃO DE FUSO HORÁRIO: Converte DD/MM/AAAA para AAAA-MM-DD usando apenas strings.
     * @param {string} dataStr - Data de entrada (espera DD/MM/AAAA)
     * @returns {string} Data formatada (AAAA-MM-DD)
     */
    const getDataParaComparacao = (dataStr) => {
        if (!dataStr) return '';
        dataStr = String(dataStr).trim();

        const parts = dataStr.split('/');
        
        // Trata o formato DD/MM/AAAA e converte para AAAA-MM-DD (padrão ISO)
        if (parts.length === 3) {
            const [dia, mes, ano] = parts;
            // Verifica se são números e garante a padronização
            if (!isNaN(parseInt(dia)) && !isNaN(parseInt(mes)) && !isNaN(parseInt(ano))) {
                return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            }
        }
        
        // Se já estiver em AAAA-MM-DD, retorna como está (para o caso de ser uma data de vigência)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
            return dataStr;
        }

        return ''; // Retorna vazio se não conseguir formatar
    };

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

    // --- FUNÇÕES DE FILTRO E ATUALIZAÇÃO ---

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
        setFiltroData(dataInput); // dataInput está no formato AAAA-MM
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

    // --- EFEITO DE CARREGAMENTO INICIAL ---
    useEffect(() => {
        handleRefresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- EFEITO DE FILTRAGEM E SINCRONIZAÇÃO DE ESTADOS ---
    useEffect(() => {
        const fechadosAtuais = leads.filter(lead => lead.Status === 'Fechado');

        // Sincronização de estados (Valores, Vigência, Display) - Mantida
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
        
        // ORDENAÇÃO: Adiciona 'T00:00:00' na string para forçar interpretação correta do fuso horário durante a ordenação
        const fechadosOrdenados = [...fechadosAtuais].sort((a, b) => {
            // Usa a função corrigida para obter AAAA-MM-DD e anexa 'T00:00:00' para ordenação segura
            const dataA = new Date(getDataParaComparacao(a.Data) + 'T00:00:00');
            const dataB = new Date(getDataParaComparacao(b.Data) + 'T00:00:00');
            return dataB.getTime() - dataA.getTime();
        });

        // Aplicação da lógica de filtragem (CORRIGIDA)
        let leadsFiltrados;
        if (filtroNome) {
            leadsFiltrados = fechadosOrdenados.filter(lead =>
                nomeContemFiltro(lead.name, filtroNome)
            );
        } else if (filtroData) {
            leadsFiltrados = fechadosOrdenados.filter(lead => {
                // 1. Converte a data do lead para AAAA-MM-DD usando a função IMUNE A NEW DATE()
                const dataLeadFormatada = getDataParaComparacao(lead.Data);
                
                // 2. Extrai AAAA-MM para comparação (ex: '2025-10-01' -> '2025-10')
                const dataLeadMesAno = dataLeadFormatada ? dataLeadFormatada.substring(0, 7) : '';
                
                // 3. Compara o AAAA-MM do lead com o AAAA-MM do filtro ('2025-10' === '2025-10')
                return dataLeadMesAno === filtroData;
            });
        } else {
            leadsFiltrados = fechadosOrdenados;
        }

        setFechadosFiltradosInterno(leadsFiltrados);
    }, [leads, filtroNome, filtroData]);

    // --- HANDLERS E FUNÇÕES AUXILIARES (MANTIDAS) ---

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
            // Usa 'T00:00:00' para evitar problemas com fuso horário ao criar o objeto Date APENAS para cálculo.
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

    // --- PAGINAÇÃO E ESTILOS (MANTIDOS) ---

    const totalPaginas = Math.max(1, Math.ceil(fechadosFiltradosInterno.length / leadsPorPagina));
    const paginaCorrigida = Math.min(paginaAtual, totalPaginas); 
    const inicio = (paginaCorrigida - 1) * leadsPorPagina;
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
    
    // --- CLASSES TAILWIND ---
    
    // Classes para inputs com prefixo (R$ ou %)
    const inputWithPrefixClasses = "pl-9 pr-2 w-full border border-gray-300 rounded-md h-9 box-border text-right focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed";
    
    // Classes para inputs sem prefixo (Select, Date)
    const inputNoPrefixClasses = "px-2 py-1 w-full border border-gray-300 rounded-md h-9 box-border text-left focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed";
    
    // Wrapper para input com prefixo
    const inputWrapperClasses = "relative w-full mb-2";

    // Estilo do Prefixo (R$ ou %)
    const prefixClasses = "absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold pointer-events-none select-none text-sm";


    // --- RENDERIZAÇÃO ---

    return (
        <div id="leads-container" className="p-5 relative min-h-[calc(100vh-100px)]">
            {/* Overlay de Loading */}
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-80 flex justify-center items-center z-50">
                    <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-indigo-500"></div>
                    <p className="ml-4 text-lg text-gray-700">Carregando LEADS FECHADOS...</p>
                </div>
            )}

            {/* Cabeçalho e Botão de Atualização */}
            <div className="flex items-center gap-3 mb-4">
                <h1 className="text-2xl font-semibold m-0">Leads Fechados</h1>
                <button 
                    title='Clique para atualizar os dados'
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="p-1.5 rounded-full border border-gray-300 bg-white shadow hover:bg-gray-50 disabled:cursor-not-allowed transition duration-150"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <RefreshCcw size={20} className="text-blue-600" />
                    )}
                </button>
            </div>

            {/* Controles de Filtro */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                
                {/* Filtro por Nome */}
                <div className="flex items-center gap-2 flex-1 justify-start min-w-[280px]">
                    <button
                        onClick={aplicarFiltroNome}
                        className="bg-blue-600 text-white border-none rounded-md px-4 py-2 cursor-pointer whitespace-nowrap h-9 text-sm hover:bg-blue-700 transition duration-200"
                    >
                        Filtrar Nome
                    </button>
                    <input
                        type="text"
                        placeholder="Filtrar por nome"
                        value={nomeInput}
                        onChange={(e) => setNomeInput(e.target.value)}
                        className="p-2 rounded-md border border-gray-300 w-56 max-w-full h-9 text-sm focus:ring-blue-500 focus:border-blue-500"
                        title="Filtrar leads pelo nome (contém)"
                    />
                </div>

                {/* Filtro por Data */}
                <div className="flex items-center gap-2 min-w-[230px] justify-end">
                    <button
                        onClick={aplicarFiltroData}
                        className="bg-blue-600 text-white border-none rounded-md px-4 py-2 cursor-pointer whitespace-nowrap h-9 text-sm hover:bg-blue-700 transition duration-200"
                    >
                        Filtrar Data
                    </button>
                    <input
                        type="month"
                        value={dataInput}
                        onChange={(e) => setDataInput(e.target.value)}
                        className="p-2 rounded-md border border-gray-300 cursor-pointer h-9 text-sm focus:ring-blue-500 focus:border-blue-500"
                        title="Filtrar leads pelo mês e ano de criação"
                    />
                </div>
            </div>

            {/* Lista de Leads */}
            {fechadosFiltradosInterno.length === 0 && !isLoading ? (
                <p className="text-center p-5 bg-white rounded-lg shadow-md">
                    Não há leads fechados que correspondam ao filtro aplicado.
                </p>
            ) : (
                <>
                    {leadsPagina.map((lead) => {
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
                            <div 
                                key={lead.ID} 
                                className={`flex flex-wrap gap-5 items-start justify-between p-4 mb-4 rounded-lg shadow-lg transition duration-300 
                                    ${isSeguradoraPreenchida 
                                        ? 'bg-green-50 border-2 border-green-500' 
                                        : 'bg-white border border-gray-200 hover:shadow-xl'
                                    }`}
                            >
                                {/* Seção de Detalhes do Lead */}
                                <div className="flex-1 min-w-[250px] pr-4 border-r border-gray-200">
                                    <h3 className="m-0 mb-1 text-lg font-bold text-gray-800">{lead.name}</h3>
                                    <p className="m-0 text-sm text-gray-600"><strong>Data do Fechamento:</strong> {lead.Data}</p>
                                    <div className="mt-2 space-y-1 text-sm text-gray-700">
                                        <p className="m-0"><strong>Modelo:</strong> {lead.vehicleModel}</p>
                                        <p className="m-0"><strong>Ano/Modelo:</strong> {lead.vehicleYearModel}</p>
                                        <p className="m-0"><strong>Cidade:</strong> {lead.city}</p>
                                        <p className="m-0"><strong>Telefone:</strong> {lead.phone}</p>
                                        <p className="m-0"><strong>Tipo de Seguro:</strong> {lead.insuranceType}</p>
                                    </div>

                                    {responsavel && (
                                        <p className="mt-3 text-sm text-blue-600 font-bold">
                                            Transferido para <strong>{responsavel.nome}</strong>
                                        </p>
                                    )}
                                </div>

                                {/* Seção de Inputs de Fechamento */}
                                <div className="flex flex-col items-start min-w-[280px] w-full max-w-sm">
                                    
                                    {/* Seguradora */}
                                    <select
                                        value={valores[`${lead.ID}`]?.insurer || ''}
                                        onChange={(e) => handleInsurerChange(lead.ID, e.target.value)}
                                        disabled={isSeguradoraPreenchida || isLoading}
                                        className={inputNoPrefixClasses}
                                    >
                                        <option value="">Selecione a seguradora</option>
                                        <option value="Porto Seguro">Porto Seguro</option>
                                        <option value="Azul Seguros">Azul Seguros</option>
                                        <option value="Itau Seguros">Itau Seguros</option>
                                        <option value="Demais Seguradoras">Demais Seguradoras</option>
                                    </select>

                                    {/* Prêmio Líquido */}
                                    <div className={inputWrapperClasses}>
                                        <span className={prefixClasses}>R$</span>
                                        <input
                                            type="text"
                                            placeholder="Prêmio Líquido"
                                            value={premioLiquidoInputDisplay[`${lead.ID}`] || ''}
                                            onChange={(e) => handlePremioLiquidoChange(lead.ID, e.target.value)}
                                            onBlur={() => handlePremioLiquidoBlur(lead.ID)}
                                            disabled={isSeguradoraPreenchida || isLoading}
                                            className={inputWithPrefixClasses}
                                        />
                                    </div>

                                    {/* Comissão */}
                                    <div className={inputWrapperClasses}>
                                        <span className={prefixClasses}>%</span>
                                        <input
                                            type="text"
                                            placeholder="Comissão (%)"
                                            value={valores[`${lead.ID}`]?.Comissao || ''}
                                            onChange={(e) => handleComissaoChange(lead.ID, e.target.value)}
                                            disabled={isSeguradoraPreenchida || isLoading}
                                            className={inputWithPrefixClasses}
                                        />
                                    </div>

                                    {/* Parcelamento */}
                                    <select
                                        value={valores[`${lead.ID}`]?.Parcelamento || ''}
                                        onChange={(e) => handleParcelamentoChange(lead.ID, e.target.value)}
                                        disabled={isSeguradoraPreenchida || isLoading}
                                        className={inputNoPrefixClasses}
                                    >
                                        <option value="">Parcelamento</option>
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={`${i + 1}x`}>{i + 1}x</option>
                                        ))}
                                    </select>
                                    
                                    {/* Vigência Início */}
                                    <div className={inputWrapperClasses}>
                                        <label htmlFor={`vigencia-inicio-${lead.ID}`} className="text-xs text-gray-600 block mb-1 font-medium">Vigência Início:</label>
                                        <input
                                            id={`vigencia-inicio-${lead.ID}`}
                                            type="date"
                                            value={vigencia[`${lead.ID}`]?.inicio || ''}
                                            onChange={(e) => handleVigenciaInicioChange(lead.ID, e.target.value)}
                                            disabled={isSeguradoraPreenchida || isLoading}
                                            className={`${inputNoPrefixClasses} mb-2`}
                                        />
                                    </div>

                                    {/* Vigência Final */}
                                    <div className={inputWrapperClasses}>
                                        <label htmlFor={`vigencia-final-${lead.ID}`} className="text-xs text-gray-600 block mb-1 font-medium">Vigência Final:</label>
                                        <input
                                            id={`vigencia-final-${lead.ID}`}
                                            type="date"
                                            value={vigencia[`${lead.ID}`]?.final || ''}
                                            readOnly
                                            disabled={true}
                                            className={`${inputNoPrefixClasses} bg-gray-100 cursor-not-allowed mb-2`}
                                        />
                                    </div>

                                    {/* Botão de Ação */}
                                    {!isSeguradoraPreenchida ? (
                                        <button
                                            onClick={async () => {
                                                await onConfirmInsurer(
                                                    lead.ID,
                                                    valores[`${lead.ID}`]?.PremioLiquido === null ? null : valores[`${lead.ID}`]?.PremioLiquido / 100,
                                                    valores[`${lead.ID}`]?.insurer,
                                                    parseFloat(String(valores[`${lead.ID}`]?.Comissao || '0').replace(',', '.')),
                                                    valores[`${lead.ID}`]?.Parcelamento,
                                                    vigencia[`${lead.ID}`]?.final,
                                                    vigencia[`${lead.ID}`]?.inicio
                                                );
                                                // Note: Atualiza os dados após a confirmação para refletir o status
                                                await fetchLeadsFechadosFromSheet(); 
                                            }}
                                            disabled={isButtonDisabled || isLoading}
                                            className={`py-2 px-4 rounded-md text-white font-semibold w-full transition duration-200 mt-2
                                                ${(isButtonDisabled || isLoading) 
                                                    ? 'bg-gray-400 cursor-not-allowed' 
                                                    : 'bg-green-600 hover:bg-green-700 cursor-pointer'
                                                }`}
                                        >
                                            Confirmar Seguradora
                                        </button>
                                    ) : (
                                        <span className="mt-2 text-sm text-green-700 font-bold p-2 bg-green-200 rounded-md block text-center w-full">
                                            Status Confirmado
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Paginação */}
                    {fechadosFiltradosInterno.length > leadsPorPagina && (
                        <div
                            className="flex justify-center items-center gap-4 mt-5 p-3 bg-white rounded-lg shadow-md"
                        >
                            <button
                                onClick={handlePaginaAnterior}
                                disabled={paginaCorrigida <= 1 || isLoading}
                                className={`px-4 py-2 rounded-md border text-sm transition duration-200
                                    ${(paginaCorrigida <= 1 || isLoading) 
                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300' 
                                        : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50 cursor-pointer'
                                    }`}
                            >
                                Anterior
                            </button>
                            <span className="font-bold text-gray-700">
                                Página {paginaCorrigida} de {totalPaginas}
                            </span>
                            <button
                                onClick={handlePaginaProxima}
                                disabled={paginaCorrigida >= totalPaginas || isLoading}
                                className={`px-4 py-2 rounded-md border text-sm transition duration-200
                                    ${(paginaCorrigida >= totalPaginas || isLoading) 
                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-300' 
                                        : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50 cursor-pointer'
                                    }`}
                            >
                                Próxima
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default LeadsFechados;
