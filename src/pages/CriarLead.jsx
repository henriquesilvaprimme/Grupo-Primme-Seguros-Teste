import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CriarLead = ({ adicionarLead }) => {
  // Estados para os campos do formulário de Lead
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [origem, setOrigem] = useState(''); // Ex: "Website", "Referral", "Cold Call"
  const [status, setStatus] = useState('Novo'); // Status inicial padrão
  const [mensagem, setMensagem] = useState(''); // Para mensagens de feedback ao usuário

  const navigate = useNavigate();

  /**
   * Função para lidar com a criação de um novo lead.
   * Valida os campos e, se tudo estiver ok, chama a função para enviar os dados.
   */
  const handleCriar = () => {
    // Validação básica dos campos obrigatórios
    if (!nome || !email || !telefone || !empresa || !origem) {
      setMensagem('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Objeto com os dados do novo lead
    const novoLead = {
      id: Date.now(), // ID único baseado no timestamp
      nome,
      email,
      telefone,
      empresa,
      origem,
      status,
      dataCriacao: new Date().toISOString(), // Adiciona a data de criação
    };

    // Chama a função para enviar os dados para o Google Apps Script
    criarLeadFunc(novoLead);

    // Adiciona o novo lead ao estado do componente pai (se houver)
    adicionarLead(novoLead);
    
    // Navega para a página de leads após a criação
    navigate('/leads'); // Altere para a rota correta da sua lista de leads
  };

  /**
   * Função assíncrona para enviar os dados do lead para o Google Apps Script.
   * @param {object} lead - O objeto lead a ser enviado.
   */
  const criarLeadFunc = async (lead) => {
    try {
      // URL do seu Google Apps Script para criar leads
      // ATENÇÃO: Substitua este URL pelo URL real do seu script GAS para criar leads.
      // Certifique-se de que o endpoint no seu GAS seja 'criar_lead' ou o nome que você definir.
      const response = await fetch('https://script.google.com/macros/s/SEU_ID_DO_SCRIPT_AQUI/exec?v=criar_lead', {
        method: 'POST',
        mode: 'no-cors', // Necessário para evitar problemas de CORS com o Google Apps Script
        body: JSON.stringify(lead),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Em modo 'no-cors', a resposta não pode ser lida diretamente.
      // console.log('Resposta do GAS (no-cors):', response);
      setMensagem('Lead criado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar lead para o Google Apps Script:', error);
      setMensagem('Erro ao criar lead. Tente novamente.');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6 font-inter">
      <h2 className="text-3xl font-bold text-indigo-700 mb-4 text-center">Criar Novo Lead</h2>

      {/* Mensagem de feedback ao usuário */}
      {mensagem && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg relative" role="alert">
          <span className="block sm:inline">{mensagem}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setMensagem('')}>
            <svg className="fill-current h-6 w-6 text-blue-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        </div>
      )}

      {/* Campo Nome */}
      <div>
        <label className="block text-gray-700 font-medium mb-1">Nome Completo</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-150 ease-in-out"
          placeholder="Nome completo do lead"
        />
      </div>

      {/* Campo Email */}
      <div>
        <label className="block text-gray-700 font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-150 ease-in-out"
          placeholder="email@exemplo.com"
        />
      </div>

      {/* Campo Telefone */}
      <div>
        <label className="block text-gray-700 font-medium mb-1">Telefone</label>
        <input
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-150 ease-in-out"
          placeholder="(XX) XXXXX-XXXX"
        />
      </div>

      {/* Campo Empresa */}
      <div>
        <label className="block text-gray-700 font-medium mb-1">Empresa</label>
        <input
          type="text"
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-150 ease-in-out"
          placeholder="Nome da empresa"
        />
      </div>

      {/* Campo Origem */}
      <div>
        <label className="block text-gray-700 font-medium mb-1">Origem do Lead</label>
        <select
          value={origem}
          onChange={(e) => setOrigem(e.target.value)}
          className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-150 ease-in-out"
        >
          <option value="">Selecione a origem</option>
          <option value="Website">Website</option>
          <option value="Referral">Indicação</option>
          <option value="Cold Call">Ligação Fria</option>
          <option value="Social Media">Mídia Social</option>
          <option value="Event">Evento</option>
          <option value="Outro">Outro</option>
        </select>
      </div>

      {/* Campo Status */}
      <div>
        <label className="block text-gray-700 font-medium mb-1">Status do Lead</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-150 ease-in-out"
        >
          <option value="Novo">Novo</option>
          <option value="Em Contato">Em Contato</option>
          <option value="Qualificado">Qualificado</option>
          <option value="Desqualificado">Desqualificado</option>
          <option value="Convertido">Convertido</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCriar}
          className="bg-indigo-600 text-white px-8 py-3 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out transform hover:scale-105"
        >
          Criar Lead
        </button>
      </div>
    </div>
  );
};

export default CriarLead;
