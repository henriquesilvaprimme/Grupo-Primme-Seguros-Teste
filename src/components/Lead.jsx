import React, { useState } from 'react';

const Lead = ({ lead, onUpdateStatus, disabledConfirm }) => {
  const [status, setStatus] = useState(lead.status || '');
  const [blocked, setBlocked] = useState(lead.status === 'Fechado' || lead.status === 'Perdido');

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

  const handleConfirm = () => {
    if (!status || status === 'Selecione o status') {
      alert('Selecione um status antes de confirmar!');
      return;
    }

    enviarLeadAtualizado(lead.id, status, lead.phone);

    if (status === 'Fechado' || status === 'Perdido') {
      setBlocked(true);
    }

    if (onUpdateStatus) {
      onUpdateStatus(lead.id, status, lead.phone);  // chama o callback pra informar a atualização
    }

  };

  const enviarLeadAtualizado = async (leadId, status, phone) => {
    //console.log('Enviando para o GAS:', leadId, status, phone);
    try {
      await fetch('https://script.google.com/macros/s/AKfycbzJ_WHn3ssPL8VYbVbVOUa1Zw0xVFLolCnL-rOQ63cHO2st7KHqzZ9CHUwZhiCqVgBu/exec?v=alterar_status', {
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
