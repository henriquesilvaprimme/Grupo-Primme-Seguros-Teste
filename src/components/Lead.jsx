import React, { useState, useEffect } from 'react'; // Adicionado useEffect para consistência

// URL do Google Apps Script para atualizar o status do lead
const GOOGLE_APPS_SCRIPT_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';

const Lead = ({ lead, onUpdateStatus, disabledConfirm, isEditingStatus, onAlterarStatus }) => {
  const [status, setStatus] = useState(lead.status || '');
  // `isSelectDisabled` controla se a caixa de seleção está desabilitada.
  // Ela será desabilitada se o status for "Fechado" ou "Perdido" OU se não estiver em modo de edição de status.
  const [isSelectDisabled, setIsSelectDisabled] = useState(
    lead.status === 'Fechado' || lead.status === 'Perdido' || !isEditingStatus
  );

  // UseEffect para atualizar o estado de disabled do select quando isEditingStatus muda no pai
  useEffect(() => {
    setIsSelectDisabled(lead.status === 'Fechado' || lead.status === 'Perdido' || !isEditingStatus);
  }, [isEditingStatus, lead.status]);


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

  const handleConfirm = async () => {
    if (!status || status === 'Selecione o status') {
      alert('Selecione um status antes de confirmar!');
      return;
    }

    // Bloqueia o select se o status for "Fechado" ou "Perdido" após a confirmação
    if (status === 'Fechado' || status === 'Perdido') {
      setIsSelectDisabled(true);
    } else {
        // Se o status mudar de Fechado/Perdido para outro, o select deve ser reabilitado
        setIsSelectDisabled(false);
    }

    try {
      await fetch(GOOGLE_APPS_SCRIPT_BASE_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          v: 'updateStatus',
          id: lead.id,
          status: status,
          phone: lead.phone
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (onUpdateStatus) {
        onUpdateStatus(lead.id, status, lead.phone); // Chama o callback pra informar a atualização
      }

    } catch (error) {
      console.error('Erro ao enviar lead:', error);
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

      {/* Caixa de seleção de status */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            // Ao mudar a seleção, habilita o botão de Confirmar (se não estiver totalmente disabled)
            if (e.target.value !== 'Fechado' && e.target.value !== 'Perdido') {
                setIsSelectDisabled(false); // Permite reabilitar se sair de um status final
            }
          }}
          disabled={isSelectDisabled} // Controlado pelo estado local e props
          style={{
            marginRight: '10px',
            padding: '8px',
            border: '2px solid #ccc',
            borderRadius: '4px',
            minWidth: '160px',
            backgroundColor: isSelectDisabled ? '#f0f0f0' : '#fff', // Cor de fundo para desabilitado
            cursor: isSelectDisabled ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="">Selecione o status</option>
          <option value="Em Contato">Em Contato</option>
          <option value="Fechado">Fechado</option>
          <option value="Perdido">Perdido</option>
          <option value="Sem Contato">Sem Contato</option>
        </select>

        {/* Botão Confirmar ou Alterar Status */}
        {isEditingStatus ? ( // Se estiver no modo de edição (controlado pelo pai)
            <button
                onClick={handleConfirm}
                disabled={disabledConfirm || !status || isSelectDisabled} // Adicionado isSelectDisabled aqui para evitar cliques em status "final"
                style={{
                    padding: '8px 16px',
                    backgroundColor: (disabledConfirm || !status || isSelectDisabled) ? '#aaa' : '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (disabledConfirm || !status || isSelectDisabled) ? 'not-allowed' : 'pointer'
                }}
            >
                Confirmar
            </button>
        ) : ( // Se não estiver no modo de edição
            <button
                onClick={() => onAlterarStatus(lead.id)} // Chama a função do pai para habilitar a edição
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
