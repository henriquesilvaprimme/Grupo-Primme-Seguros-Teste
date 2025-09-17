import React, { useState, useEffect } from 'react';
// import { Phone } from 'lucide-react'; // Ícone de telefone para o botão do WhatsApp

const Lead = ({ lead, onUpdateStatus, disabledConfirm, agendamento, onAgendamentoChange, onConfirmAgendamento }) => {
  const [status, setStatus] = useState(lead.status || '');
  const [isStatusConfirmed, setIsStatusConfirmed] = useState(
    lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status === 'Fechado' || lead.status === 'Perdido' || lead.status === 'Agendado'
  );
  const [showAgendamento, setShowAgendamento] = useState(false);

  // Define a cor do card conforme o status
  const cardColor = (() => {
    switch (status) {
      case 'Fechado':
        return '#d4edda';
      case 'Perdido':
        return '#f8d7da';
      case 'Em Contato':
        return '#fff3cd';
      case 'Sem Contato':
        return '#e2e3e5';
      case 'Agendado':
        return '#cce5ff';
      case 'Selecione o status':
      case '':
      default:
        return '#ffffff';
    }
  })();

  useEffect(() => {
    setIsStatusConfirmed(
      lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status === 'Fechado' || lead.status === 'Perdido' || lead.status === 'Agendado'
    );
    setStatus(lead.status || '');
    if (lead.status === 'Agendado' && lead.agendamento) {
      setShowAgendamento(true);
    }
  }, [lead.status, lead.agendamento]);

  const handleConfirm = () => {
    if (!status || status === 'Selecione o status') {
      alert('Selecione um status antes de confirmar!');
      return;
    }

    if (status === 'Agendado') {
      setShowAgendamento(true);
      return;
    }

    onUpdateStatus(lead.id, status, lead.phone);
    setIsStatusConfirmed(true);
  };

  const handleAlterar = () => {
    setIsStatusConfirmed(false);
    setShowAgendamento(false);
  };

  const handleConfirmAgendamentoClick = () => {
    onConfirmAgendamento(lead.id);
    setIsStatusConfirmed(true); // Bloqueia o status após agendar
    setShowAgendamento(false); // Esconde o campo de data após agendar
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
      
      {/* NOVO: Exibe a data de agendamento em uma nova linha */}
      {lead.status === 'Agendado' && lead.agendamento && (
        <p><strong>Agendamento:</strong> {new Date(lead.agendamento).toLocaleDateString()}</p>
      )}

      <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            if (e.target.value !== 'Agendado') {
              setShowAgendamento(false);
            }
          }}
          disabled={isStatusConfirmed}
          style={{
            marginRight: '10px',
            padding: '8px',
            border: '2px solid #ccc',
            borderRadius: '4px',
            minWidth: '160px',
            backgroundColor: isStatusConfirmed ? '#e9ecef' : '#fff',
            cursor: isStatusConfirmed ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="">Selecione o status</option>
          <option value="Em Contato">Em Contato</option>
          <option value="Fechado">Fechado</option>
          <option value="Perdido">Perdido</option>
          <option value="Sem Contato">Sem Contato</option>
          <option value="Agendado">Agendado</option>
        </select>

        {!isStatusConfirmed ? (
          <button
            onClick={handleConfirm}
            disabled={disabledConfirm || !status || status === '' || status === 'Selecione o status'}
            style={{
              padding: '8px 16px',
              backgroundColor: (disabledConfirm || !status || status === '' || status === 'Selecione o status') ? '#aaa' : '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: (disabledConfirm || !status || status === '' || status === 'Selecione o status') ? 'not-allowed' : 'pointer'
            }}
          >
            Confirmar
          </button>
        ) : (
          <button
            onClick={handleAlterar}
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
        )}
      </div>

      {showAgendamento && status === 'Agendado' && (
        <div style={{ marginTop: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Data do Agendamento:</label>
          <input
            type="date"
            value={agendamento}
            onChange={(e) => onAgendamentoChange(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button
            onClick={handleConfirmAgendamentoClick}
            disabled={!agendamento}
            style={{
              marginLeft: '10px',
              padding: '8px 16px',
              backgroundColor: !agendamento ? '#aaa' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !agendamento ? 'not-allowed' : 'pointer'
            }}
          >
            Confirmar Agendamento
          </button>
        </div>
      )}
    </div>
  );
};

export default Lead;
