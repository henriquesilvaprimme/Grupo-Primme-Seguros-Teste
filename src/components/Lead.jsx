import React, { useState, useEffect } from 'react';

// Não é necessário importar API_ENDPOINTS aqui, pois a requisição é feita via prop
// import { API_ENDPOINTS } from './config/api'; 

const Lead = ({ lead, onUpdateStatus, disabledConfirm }) => {
  const [status, setStatus] = useState(lead.status || '');
  // A propriedade 'blocked' deve refletir o estado inicial do lead
  const [blocked, setBlocked] = useState(lead.status === 'Fechado' || lead.status === 'Perdido');

  // Use useEffect para atualizar 'blocked' se o status do lead mudar externamente
  useEffect(() => {
    setBlocked(lead.status === 'Fechado' || lead.status === 'Perdido');
    setStatus(lead.status || ''); // Garante que o estado local de status esteja sincronizado
  }, [lead.status]);

  // Define a cor do card conforme o status
  const cardColor = (() => {
    switch (status) {
      case 'Fechado':
        return '#d4edda'; // verde claro
      case 'Perdido':
        return '#f8d7da'; // vermelho claro
      case 'Em Contato':
        return '#fff3cd'; // laranja claro
      case 'Sem Contato':
        return '#e2e3e5'; // cinza claro
      case 'Selecione o status':
      case '':
      default:
        return '#ffffff'; // branco
    }
  })();

  const handleConfirm = async () => { // Adicionado 'async' pois onUpdateStatus pode ser assíncrona
    if (!status || status === 'Selecione o status') {
      alert('Selecione um status antes de confirmar!');
      return;
    }

    // Chama o callback onUpdateStatus passado via props do App.jsx.
    // Esta função é responsável por enviar os dados ao GAS e atualizar o estado global.
    if (onUpdateStatus) {
      await onUpdateStatus(lead.id, status, lead.phone); // Espera a atualização ser concluída
    }

    // A lógica de setBlocked já é tratada pelo useEffect acima,
    // que reage à mudança de lead.status após a atualização global.
  };

  // A função 'enviarLeadAtualizado' local foi removida, pois a lógica de requisição
  // agora é centralizada na prop 'onUpdateStatus' do App.jsx.

  return (
    <div
      style={{
        border: '1px solid #ddd',
        padding: '15px',
        marginBottom: '15px',
        borderRadius: '5px',
        backgroundColor: cardColor
      }}
    >
      <p><strong>Nome:</strong> {lead.name}</p>
      <p><strong>Modelo do veículo:</strong> {lead.vehicleModel}</p>
      <p><strong>Ano/Modelo:</strong> {lead.vehicleYearModel}</p>
      <p><strong>Cidade:</strong> {lead.city}</p>
      <p><strong>Telefone:</strong> {lead.phone}</p>
      <p><strong>Tipo de Seguro:</strong> {lead.insuranceType}</p>

      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
        }}
        disabled={blocked}
        style={{
          marginRight: '10px',
          padding: '8px',
          border: '2px solid #ccc',
          borderRadius: '4px',
          minWidth: '160px'
        }}
      >
        <option value="">Selecione o status</option>
        <option value="Em Contato">Em Contato</option>
        <option value="Fechado">Fechado</option>
        <option value="Perdido">Perdido</option>
        <option value="Sem Contato">Sem Contato</option>
      </select>

      {!blocked ? (
        <button
          onClick={handleConfirm}
          disabled={disabledConfirm || !status}
          style={{
            padding: '8px 16px',
            backgroundColor: disabledConfirm || !status ? '#aaa' : '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: disabledConfirm || !status ? 'not-allowed' : 'pointer'
          }}
        >
          Confirmar
        </button>
      ) : (
        <span style={{ marginLeft: '10px', color: 'green', fontWeight: 'bold' }}>
          Status confirmado
        </span>
      )}
    </div>
  );
};

export default Lead;
