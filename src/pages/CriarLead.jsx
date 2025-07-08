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
        // ATENÇÃO: Você precisa criar um endpoint no seu Google Apps Script
        // que retorne a lista de usuários ativos da sua aba 'Usuarios'.
        // Exemplo de URL: 'https://script.google.com/macros/s/SEU_ID_DO_SCRIPT/exec?v=listar_usuarios_ativos'
        // Por enquanto, usaremos dados mockados para que o código funcione.
        const response = await fetch('https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=listar_usuarios_ativos'); // URL de exemplo, ajuste para o seu!
        
        // Se o seu script retornar JSON, você faria:
        // const data = await response.json();
        // setUsuariosAtivos(data.usuarios || []); // Assumindo que o JSON tem uma chave 'usuarios'

        // Dados mockados para demonstração:
        const mockUsuarios = [
          { id: 'user1', nome: 'João Silva' },
          { id: 'user2', nome: 'Maria Souza' },
          { id: 'user3', nome: 'Carlos Mendes' },
        ];
        setUsuariosAtivos(mockUsuarios);

      } catch (error) {
        console.error('Erro ao buscar usuários ativos:', error);
        // Em caso de erro, você pode definir uma mensagem para o usuário ou uma lista vazia
        setUsuariosAtivos([]); 
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
      id: Date.now(), // ID único para o lead
      nome,
      modeloVeiculo,
      anoModelo,
      cidade,
      telefone,
      tipoSeguro,
      responsavel,
      status: 'Fechado', // Status fixo como "Fechado"
      dataCriacao: new Date().toLocaleDateString('pt-BR'), // Data de criação
    };

    criarLeadFunc(novoLead);

    // Se você tiver uma função para adicionar o lead ao estado global/local
    // adicionarLead(novoLead); 
    
    navigate('/leads'); // Redirecionar para a página de leads
  };

  const criarLeadFunc = async (lead) => {
    try {
      // Ajuste o URL para o seu script do Google Apps Script que lida com leads
      // Certifique-se de que este endpoint está configurado para receber os novos campos
      const response = await fetch('https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=criar_lead', {
        method: 'POST',
        mode: 'no-cors', 
        body: JSON.stringify(lead),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Lead enviado. Verifique seu Google Sheet.');
      alert('Lead criado com sucesso!');
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
