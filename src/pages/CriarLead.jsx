import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CriarLead = ({ adicionarLead }) => {
  // Estados para os campos do formulário
  const [nome, setNome] = useState('');
  const [modeloVeiculo, setModeloVeiculo] = useState('');
  const [anoModelo, setAnoModelo] = useState('');
  const [cidade, setCidade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoSeguro, setTipoSeguro] = useState('');
  const [responsavel, setResponsavel] = useState(''); // Estado para o responsável selecionado
  const [usuariosAtivos, setUsuariosAtivos] = useState([]); // Estado para armazenar os usuários ativos

  const navigate = useNavigate();

  // Função para buscar os usuários ativos do Google Sheets
  useEffect(() => {
    const fetchUsuariosAtivos = async () => {
      try {
        // ATENÇÃO: SUBSTITUA ESTE URL PELA URL DO SEU GOOGLE APPS SCRIPT REAL.
        // É a URL do aplicativo da web (Web App URL) após a implantação do seu script GAS.
        // Exemplo: 'https://script.google.com/macros/s/SEU_ID_DO_SCRIPT/exec?v=listar_usuarios_ativos'
        // Use a mesma URL que você testou para depurar no navegador.
        const YOUR_GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=listar_usuarios_ativos'; 

        const response = await fetch(YOUR_GAS_WEB_APP_URL);
        
        // Verifica se a resposta da rede foi bem-sucedida
        if (!response.ok) {
          // Tenta ler o erro do corpo da resposta, se disponível
          const errorText = await response.text();
          throw new Error(`Erro na rede ou no script: ${response.status} - ${errorText}`);
        }

        const data = await response.json(); // Parsea o JSON retornado pelo Google Apps Script
        
        // O GAS retorna um array de objetos { id: '...', nome: '...' }
        // Se o seu GAS retornar um formato diferente, ajuste aqui.
        setUsuariosAtivos(data || []); 

      } catch (error) {
        console.error('Erro ao buscar usuários ativos:', error);
        // Em caso de erro, você pode definir uma mensagem para o usuário ou uma lista vazia
        setUsuariosAtivos([]); // Garante que a lista fique vazia em caso de falha
        alert('Não foi possível carregar a lista de responsáveis. Verifique a conexão ou o script.');
      }
    };

    fetchUsuariosAtivos();
  }, []); // O array vazio garante que esta função seja executada apenas uma vez ao montar o componente

  const handleCriar = () => {
    // Validação dos campos obrigatórios
    if (!nome || !modeloVeiculo || !anoModelo || !cidade || !telefone || !tipoSeguro || !responsavel) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const novoLead = {
      id: Date.now(), // ID único para o lead (será substituído pelo ID gerado no GAS)
      nome,
      modeloVeiculo,
      anoModelo,
      cidade,
      telefone,
      tipoSeguro,
      responsavel,
      status: 'Fechado', // Status fixo como "Fechado"
      dataCriacao: new Date().toLocaleDateString('pt-BR'), // Data de criação (será substituída pela data do GAS)
    };

    criarLeadFunc(novoLead);

    // Se você tiver uma função para adicionar o lead ao estado global/local
    // adicionarLead(novoLead); // Comentei pois não há `adicionarLead` definido no seu snippet

    // navigate('/leads'); // Redirecionar para a página de leads (opcional, dependendo do fluxo)
  };

  const criarLeadFunc = async (lead) => {
    try {
      // Ajuste o URL para o seu script do Google Apps Script que lida com leads
      // Certifique-se de que este endpoint está configurado para receber os novos campos
      // É a URL do aplicativo da web (Web App URL) após a implantação do seu script GAS.
      const YOUR_GAS_WEB_APP_URL_FOR_LEADS = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=criar_lead'; // URL de exemplo, ajuste para o seu!

      const response = await fetch(YOUR_GAS_WEB_APP_URL_FOR_LEADS, {
        method: 'POST',
        mode: 'no-cors', // Importante para evitar erros de CORS em requisições POST para GAS
        body: JSON.stringify(lead),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Com 'no-cors', o response.ok sempre será true e não poderemos ler o corpo da resposta.
      // A confirmação real da sucesso vem do próprio Google Sheet.
      console.log('Lead enviado. Verifique seu Google Sheet.');
      alert('Lead criado com sucesso!');

      // Redireciona somente após o envio bem-sucedido
      navigate('/leads'); 

    } catch (error) {
      console.error('Erro ao enviar lead:', error);
      alert('Houve um erro ao criar o lead. Tente novamente.');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-blue-700 mb-4">Criar Novo Lead</h2>

      <div>
        <label className="block text-gray-700">Nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Modelo do Veículo</label>
        <input
          type="text"
          value={modeloVeiculo}
          onChange={(e) => setModeloVeiculo(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Ano/Modelo</label>
        <input
          type="text"
          value={anoModelo}
          onChange={(e) => setAnoModelo(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Cidade</label>
        <input
          type="text"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Telefone</label>
        <input
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Tipo de Seguro</label>
        <input
          type="text"
          value={tipoSeguro}
          onChange={(e) => setTipoSeguro(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Responsável</label>
        <select
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Selecione um responsável</option>
          {/* Renderiza os usuários buscados do Sheets */}
          {usuariosAtivos.map((user) => (
            <option key={user.id} value={user.nome}>
              {user.nome}
            </option>
          ))}
        </select>
      </div>

      {/* O campo Status não precisa de input, pois é fixo */}
      <div className="text-gray-700">
        Status: <span className="font-semibold">Fechado</span>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCriar}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Criar Lead
        </button>
      </div>
    </div>
  );
};

export default CriarLead;
