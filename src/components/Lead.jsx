import React, { useState, useEffect } from 'react';

const Lead = ({ lead, onUpdateStatus, disabledConfirm, agendamento, onAgendamentoChange, onConfirmAgendamento }) => {
  const [status, setStatus] = useState(lead.status || '');
  const [isStatusConfirmed, setIsStatusConfirmed] = useState(
    lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status === 'Fechado' || lead.status === 'Perdido' || lead.status === 'Agendado'
  );
  const [showAgendamento, setShowAgendamento] = useState(false);

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
      case 'Agendado':
        return '#cce5ff'; // azul claro para agendamento
      case 'Selecione o status':
      case '':
      default:
        return '#ffffff'; // branco
    }
  })();

  useEffect(() => {
    setIsStatusConfirmed(
      lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status === 'Fechado' || lead.status === 'Perdido' || lead.status === 'Agendado'
    );
    setStatus(lead.status || '');
    // Esconde o agendamento se o status não for "Agendado"
    if (lead.status !== 'Agendado') {
      setShowAgendamento(false);
    }
  }, [lead.status]);

  const handleConfirm = () => {
    if (!status || status === 'Selecione o status') {
      alert('Selecione um status antes de confirmar!');
      return;
    }

    if (status === 'Agendado') {
      // Se for agendamento, apenas mostra o calendário, não confirma ainda
      setShowAgendamento(true);
      return;
    }

    enviarLeadAtualizado(lead.id, status, lead.phone);
    setIsStatusConfirmed(true);

    if (onUpdateStatus) {
      onUpdateStatus(lead.id, status, lead.phone);
    }
  };

  const handleAlterar = () => {
    setIsStatusConfirmed(false);
    setShowAgendamento(false); // Esconde o campo de agendamento ao alterar
  };

  const handleConfirmAgendamento = () => {
    onConfirmAgendamento(); // Chama a função passada via props para salvar no banco
    setIsStatusConfirmed(true);
    setShowAgendamento(false); // Esconde o campo de agendamento
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
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            // Se o status for Agendado, mostra o campo de agendamento
            if (e.target.value === 'Agendado') {
              setShowAgendamento(true);
            } else {
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

      {showAgendamento && (
        <div style={{ marginTop: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Data do Agendamento:</label>
          <input
            type="date"
            value={agendamento}
            onChange={(e) => onAgendamentoChange(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button
            onClick={onConfirmAgendamento}
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
