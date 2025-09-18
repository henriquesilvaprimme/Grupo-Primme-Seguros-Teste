import React, { useState } from 'react';
// import { Phone } from 'lucide-react';

const Lead = ({ lead, onUpdateStatus, isLocked, onAlterarStatus }) => {
  const [selectedStatus, setSelectedStatus] = useState(lead.status || '');

  // Define a cor do card conforme o status
  const cardColor = (() => {
    switch (lead.status) {
      case 'Fechado':
        return '#d4edda'; // verde claro
      case 'Perdido':
        return '#f8d7da'; // vermelho claro
      case 'Em Contato':
        return '#fff3cd'; // laranja claro
      case 'Sem Contato':
        return '#e2e3e5'; // cinza claro
      default:
        if (lead.status && lead.status.startsWith('Agendado')) {
          return '#cfe2ff'; // azul claro
        }
        return '#ffffff'; // branco
    }
  })();

  const handleConfirm = () => {
    if (!selectedStatus || selectedStatus === 'Selecione o status') {
      alert('Selecione um status antes de confirmar!');
      return;
    }
    
    // A chamada onUpdateStatus agora é responsável por atualizar o estado do lead no componente pai
    // e, consequentemente, a prop 'isLocked'
    onUpdateStatus(lead.id, selectedStatus, lead.phone);
  };

  const enviarLeadAtualizado = async (leadId, status, phone) => {
    try {
      await fetch('https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=alterar_status', {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          lead: leadId,
          status: status,
          phone: phone
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Erro ao enviar lead:', error);
    }
  };

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

      <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
          }}
          disabled={isLocked}
          style={{
            marginRight: '10px',
            padding: '8px',
            border: '2px solid #ccc',
            borderRadius: '4px',
            minWidth: '160px',
            backgroundColor: isLocked ? '#e9ecef' : '#fff',
            cursor: isLocked ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="">Selecione o status</option>
          <option value="Em Contato">Em Contato</option>
          <option value="Agendar">Agendar</option>
          <option value="Fechado">Fechado</option>
          <option value="Perdido">Perdido</option>
          <option value="Sem Contato">Sem Contato</option>
        </select>

        {isLocked ? (
          <button
            onClick={onAlterarStatus}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              color: '#212529',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Alterar
          </button>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={!selectedStatus || selectedStatus === '' || selectedStatus === 'Selecione o status'}
            style={{
              padding: '8px 16px',
              backgroundColor: (!selectedStatus || selectedStatus === '' || selectedStatus === 'Selecione o status') ? '#aaa' : '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: (!selectedStatus || selectedStatus === '' || selectedStatus === 'Selecione o status') ? 'not-allowed' : 'pointer'
            }}
          >
            Confirmar
          </button>
        )}
      </div>
    </div>
  );
};

export default Lead;
