import React, { useState, useEffect } from 'react';

const Lead = ({ lead, onUpdateStatus, disabledConfirm }) => {
  const [status, setStatus] = useState(lead.status || '');
  const [isStatusConfirmed, setIsStatusConfirmed] = useState(
    lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status === 'Fechado' || lead.status === 'Perdido' || lead.status.startsWith('Agendado')
  );

  const cardColor = (() => {
    switch (true) {
      case status.startsWith('Fechado'):
        return '#d4edda'; // verde claro
      case status.startsWith('Perdido'):
        return '#f8d7da'; // vermelho claro
      case status.startsWith('Em Contato'):
        return '#fff3cd'; // laranja claro
      case status.startsWith('Sem Contato'):
        return '#e2e3e5'; // cinza claro
      case status.startsWith('Agendado'):
        return '#cce5ff'; // azul claro
      case status === 'Selecione o status' || status === '':
      default:
        return '#ffffff'; // branco
    }
  })();

  useEffect(() => {
    setIsStatusConfirmed(
      lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status === 'Fechado' || lead.status === 'Perdido' || lead.status.startsWith('Agendado')
    );
    setStatus(lead.status || '');
  }, [lead.status]);

  const handleConfirm = () => {
    if (!status || status === 'Selecione o status') {
      alert('Selecione um status antes de confirmar!');
      return;
    }

    // A lógica foi ajustada aqui para tratar 'Agendar' da mesma forma
    if (status === 'Em Contato' || status === 'Sem Contato' || status === 'Agendar' || status.startsWith('Agendado')) {
      onUpdateStatus(lead.id, status, lead.phone);
      setIsStatusConfirmed(true);
    } else {
      onUpdateStatus(lead.id, status, lead.phone);
      setIsStatusConfirmed(true);
    }
  };

  const handleAlterar = () => {
    setIsStatusConfirmed(false);
  };

  return (
    <div
      style={{
        border: '1px solid #ddd',
        padding: '15px',
        marginBottom: '15px',
        borderRadius: '5px',
        backgroundColor: cardColor,
        position: 'relative',
      }}
    >
      {isStatusConfirmed && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '5px 10px',
            borderRadius: '5px',
            backgroundColor: '#007bff',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          {status}
        </div>
      )}

      <p>
        <strong>Nome:</strong> {lead.name}
      </p>
      <p>
        <strong>Modelo do veículo:</strong> {lead.vehicleModel}
      </p>
      <p>
        <strong>Ano/Modelo:</strong> {lead.vehicleYearModel}
      </p>
      <p>
        <strong>Cidade:</strong> {lead.city}
      </p>
      <p>
        <strong>Telefone:</strong> {lead.phone}
      </p>
      <p>
        <strong>Tipo de Seguro:</strong> {lead.insuranceType}
      </p>

      <div
        style={{
          marginTop: '15px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <select
          value={status}
          onChange={(e) => {
            const newStatus = e.target.value;
            setStatus(newStatus);
          }}
          disabled={isStatusConfirmed}
          style={{
            marginRight: '10px',
            padding: '8px',
            border: '2px solid #ccc',
            borderRadius: '4px',
            minWidth: '160px',
            backgroundColor: isStatusConfirmed ? '#e9ecef' : '#fff',
            cursor: isStatusConfirmed ? 'not-allowed' : 'pointer',
          }}
        >
          <option value="">Selecione o status</option>
          <option value="Agendar">Agendar</option>
          <option value="Em Contato">Em Contato</option>
          <option value="Fechado">Fechado</option>
          <option value="Perdido">Perdido</option>
          <option value="Sem Contato">Sem Contato</option>
        </select>

        {!isStatusConfirmed ? (
          <button
            onClick={handleConfirm}
            disabled={
              disabledConfirm ||
              !status ||
              status === '' ||
              status === 'Selecione o status'
            }
            style={{
              padding: '8px 16px',
              backgroundColor:
                disabledConfirm ||
                !status ||
                status === '' ||
                status === 'Selecione o status'
                  ? '#aaa'
                  : '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor:
                disabledConfirm ||
                !status ||
                status === '' ||
                status === 'Selecione o status'
                  ? 'not-allowed'
                  : 'pointer',
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
              cursor: 'pointer',
            }}
          >
            Alterar
          </button>
        )}
      </div>
    </div>
  );
};

export default Lead;
