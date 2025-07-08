import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CriarLead = ({ adicionarLead }) => {
  // Estados para os campos do formulário
  const [nome, setNome] = useState('');
  const [modeloVeiculo, setModeloVeiculo] = useState('');
  const [anoModelo, setAnoModelo] = useState('');
  const [cidade, setCidade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [tipoSeguro, setTipoSeguro] = useState(''); // Estado para o tipo de seguro
  const [responsavel, setResponsavel] = useState(''); // Estado para o responsável selecionado
  const [usuariosAtivos, setUsuariosAtivos] = useState([]); // Estado para armazenar os usuários ativos
  const [mensagemSucesso, setMensagemSucesso] = useState(''); // Novo estado para a mensagem de sucesso

  const navigate = useNavigate();

  // Função para buscar os usuários ativos do Google Sheets
  useEffect(() => {
    const fetchUsuariosAtivos = async () => {
      try {
        // ATENÇÃO: SUBSTITUA ESTE URL PELA URL DO SEU GOOGLE APPS SCRIPT REAL.
        // É a URL do aplicativo da web (Web App URL) após a implantação do seu script GAS.
        // Exemplo: 'https://script.google.com/macros/s/SEU_ID_DO_SCRIPT/exec?v=listar_usuarios_ativos'
        const YOUR_GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=listar_usuarios_ativos'; 

        const response = await fetch(YOUR_GAS_WEB_APP_URL);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro na rede ou no script: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        setUsuariosAtivos(data || []); 

      } catch (error) {
        console.error('Erro ao buscar usuários ativos:', error);
        setUsuariosAtivos([]);
        setMensagemSucesso('Não foi possível carregar a lista de responsáveis. Verifique a conexão ou o script.');
      }
    };

    fetchUsuariosAtivos();
  }, []);

  const handleCriar = () => {
    // Limpa a mensagem de sucesso anterior ao tentar criar um novo lead
    setMensagemSucesso(''); 

    // Validação dos campos obrigatórios
    if (!nome || !modeloVeiculo || !anoModelo || !cidade || !telefone || !tipoSeguro || !responsavel) {
      setMensagemSucesso('Por favor, preencha todos os campos obrigatórios.');
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
  };

  const criarLeadFunc = async (lead) => {
    try {
      const YOUR_GAS_WEB_APP_URL_FOR_LEADS = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=criar_lead'; 

      await fetch(YOUR_GAS_WEB_APP_URL_FOR_LEADS, {
        method: 'POST',
        mode: 'no-cors', 
        body: JSON.stringify(lead),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Lead enviado. Verifique seu Google Sheet.');
      // Define a mensagem de sucesso sem usar alert
      setMensagemSucesso('✅ Lead criado com sucesso!'); 

      // Opcional: Redirecionar após um breve atraso para o usuário ver a mensagem
      setTimeout(() => {
        navigate('/leads'); 
      }, 1500); // Redireciona após 1.5 segundos

    } catch (error) {
      console.error('Erro ao enviar lead:', error);
      // Define a mensagem de erro
      setMensagemSucesso('Houve um erro ao criar o lead. Tente novamente.');
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
        <select
          value={tipoSeguro}
          onChange={(e) => setTipoSeguro(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Em branco</option> {/* Opção "Em branco" */}
          <option value="Novo">Novo</option>
          <option value="Renovacao">Renovação</option>
          <option value="Indicacao">Indicação</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-700">Responsável</label>
        <select
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Selecione um responsável</option>
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

      {/* Botão centralizado */}
      <div className="flex justify-center"> {/* Adicionado para centralizar */}
        <button
          onClick={handleCriar}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
        >
          Criar Lead
        </button>
      </div>

      {/* Mensagem de sucesso/erro */}
      {mensagemSucesso && (
        <p className={`mt-4 text-center ${mensagemSucesso.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
          {mensagemSucesso}
        </p>
      )}
    </div>
  );
};

export default CriarLead;
