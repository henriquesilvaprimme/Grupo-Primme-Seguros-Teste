import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CriarLead = ({ adicionarLead }) => {
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [contato, setContato] = useState(''); // Nome do contato no lead
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [interesse, setInteresse] = useState(''); // Produto/serviço de interesse
  const [origem, setOrigem] = useState(''); // Como o lead chegou (ex: site, indicação, etc.)

  const navigate = useNavigate();

  const handleCriar = () => {
    // Validar se os campos obrigatórios estão preenchidos
    if (!nomeEmpresa || !contato || !email || !telefone) {
      alert('Preencha todos os campos obrigatórios: Nome da Empresa, Contato, Email e Telefone.');
      return;
    }

    const novoLead = {
      id: Date.now(), // ID único para o lead
      nomeEmpresa,
      contato,
      email,
      telefone,
      interesse,
      origem,
      status: 'Novo', // Status inicial do lead (ex: Novo, Qualificado, Em Contato, etc.)
      dataCriacao: new Date().toLocaleDateString('pt-BR'), // Data de criação
    };

    criarLeadFunc(novoLead);

    adicionarLead(novoLead);
    
    // Redirecionar para a página de leads após a criação
    navigate('/leads');
  };

  const criarLeadFunc = async (lead) => {
    try {
      // Ajuste o URL para o seu script do Google Apps Script que lida com leads
      const response = await fetch('https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=criar_lead', {
        method: 'POST',
        mode: 'no-cors', // Mantenha no-cors se o script não tiver CORS configurado
        body: JSON.stringify(lead),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      // Em 'no-cors' você não conseguirá ler a resposta (response.json()),
      // mas a requisição será enviada.
      console.log('Lead enviado. Verifique seu Google Sheet.');
    } catch (error) {
      console.error('Erro ao enviar lead:', error);
      alert('Houve um erro ao criar o lead. Tente novamente.');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-6">
      <h2 className="text-3xl font-bold text-green-700 mb-4">Criar Novo Lead</h2>

      <div>
        <label className="block text-gray-700">Nome da Empresa</label>
        <input
          type="text"
          value={nomeEmpresa}
          onChange={(e) => setNomeEmpresa(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Contato (Nome do Lead)</label>
        <input
          type="text"
          value={contato}
          onChange={(e) => setContato(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Telefone</label>
        <input
          type="tel" // Use 'tel' para campo de telefone
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Interesse (Produto/Serviço)</label>
        <input
          type="text"
          value={interesse}
          onChange={(e) => setInteresse(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div>
        <label className="block text-gray-700">Origem do Lead</label>
        <input
          type="text"
          value={origem}
          onChange={(e) => setOrigem(e.target.value)}
          className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleCriar}
          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition"
        >
          Criar Lead
        </button>
      </div>
    </div>
  );
};

export default CriarLead;
