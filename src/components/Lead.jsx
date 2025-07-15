import React, { useState } from 'react';

// URL do Google Apps Script para atualizar o status do lead
const GOOGLE_APPS_SCRIPT_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';

const Lead = ({ lead, onUpdateStatus, disabledConfirm, isEditingStatus, onAlterarStatus }) => {
  const [status, setStatus] = useState(lead.status || '');
  // `blocked` agora é usado para controlar a habilitação do `select` de status
  const [blocked, setBlocked] = useState(!isEditingStatus); // Bloqueia se não estiver em modo de edição inicial

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

  const handleStatusChange = async (newStatus) => {
    // A validação de status vazio não é mais necessária aqui, pois os botões forçam uma escolha
    // Mas mantemos a lógica de bloqueio para "Fechado" e "Perdido"
    if (newStatus === 'Fechado' || newStatus === 'Perdido') {
      setBlocked(true); // Bloqueia o select após a seleção
    } else {
      setBlocked(false); // Desbloqueia para outros status, caso ele já estivesse bloqueado e fosse alterado
    }

    // Atualiza o estado local do status
    setStatus(newStatus);

    // Envia a atualização para o Google Apps Script
    try {
      await fetch(GOOGLE_APPS_SCRIPT_BASE_URL, {
        method: 'POST',
        mode: 'no-cors', // Importante para evitar erros de CORS
        body: JSON.stringify({
          v: 'updateStatus',
          id: lead.id,
          status: newStatus,
          phone: lead.phone
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Chama o callback para informar a atualização ao componente pai (Leads.jsx)
      if (onUpdateStatus) {
        onUpdateStatus(lead.id, newStatus, lead.phone);
      }

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do lead. Por favor, tente novamente.');
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
      <p style={{ margin: '5px 0' }}><strong>Nome:</strong> {lead.name}</p>
      <p style={{ margin: '5px 0' }}><strong>Modelo do veículo:</strong> {lead.vehicleModel}</p>
      <p style={{ margin: '5px 0' }}><strong>Ano/Modelo:</strong> {lead.vehicleYearModel}</p>
      <p style={{ margin: '5px 0' }}><strong>Cidade:</strong> {lead.city}</p>
      <p style={{ margin: '5px 0' }}><strong>Telefone:</strong> {lead.phone}</p>
      <p style={{ margin: '5px 0' }}><strong>Tipo de Seguro:</strong> {lead.insuranceType}</p>
      <p style={{ margin: '5px 0' }}><strong>Status:</strong> <span style={{ fontWeight: 'bold', color: status === 'Em Contato' ? 'orange' : status === 'Fechado' ? 'green' : status === 'Perdido' ? 'red' : 'gray' }}>{status}</span></p>

      {/* Botões de Status */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {isEditingStatus || (status !== 'Fechado' && status !== 'Perdido') ? (
          <>
            <button
              onClick={() => handleStatusChange('Em Contato')}
              style={{
                padding: '8px 15px',
                backgroundColor: '#ffc107', // Amarelo
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: disabledConfirm ? 'not-allowed' : 'pointer',
                opacity: disabledConfirm ? 0.6 : 1,
              }}
              disabled={disabledConfirm}
            >
              Em Contato
            </button>
            <button
              onClick={() => handleStatusChange('Sem Contato')}
              style={{
                padding: '8px 15px',
                backgroundColor: '#dc3545', // Vermelho
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: disabledConfirm ? 'not-allowed' : 'pointer',
                opacity: disabledConfirm ? 0.6 : 1,
              }}
              disabled={disabledConfirm}
            >
              Sem Contato
            </button>
            <button
              onClick={() => handleStatusChange('Fechado')}
              style={{
                padding: '8px 15px',
                backgroundColor: '#28a745', // Verde
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: disabledConfirm ? 'not-allowed' : 'pointer',
                opacity: disabledConfirm ? 0.6 : 1,
              }}
              disabled={disabledConfirm}
            >
              Fechado
            </button>
            <button
              onClick={() => handleStatusChange('Perdido')}
              style={{
                padding: '8px 15px',
                backgroundColor: '#6c757d', // Cinza
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: disabledConfirm ? 'not-allowed' : 'pointer',
                opacity: disabledConfirm ? 0.6 : 1,
              }}
              disabled={disabledConfirm}
            >
              Perdido
            </button>
          </>
        ) : (
          <button
            onClick={() => onAlterarStatus(lead.id)}
            style={{
              padding: '8px 15px',
              backgroundColor: '#ffc107', // Amarelo para Alterar
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Alterar Status
          </button>
        )}
      </div>
    </div>
  );
};

export default Lead;
