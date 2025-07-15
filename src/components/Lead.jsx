import React, { useState, useEffect } from 'react';

// URL do Google Apps Script para atualizar o status do lead
const GOOGLE_APPS_SCRIPT_BASE_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';

const Lead = ({ lead, onUpdateStatus, disabledConfirm, isEditingStatus, onAlterarStatus }) => {
  // Estado local para o status do lead.
  // Começa como uma string vazia para que a opção "Selecione o status" seja a padrão.
  const [status, setStatus] = useState('');

  // Estado que controla se a caixa de seleção está desabilitada.
  // Ela será desabilitada por padrão, e habilitada apenas quando 'Alterar Status' for clicado,
  // ou se o status do lead já for "Em Contato" ou "Sem Contato" e já estiver em modo de edição.
  const [isSelectDisabled, setIsSelectDisabled] = useState(true);

  // UseEffect para inicializar o status local e o estado de disabled do select
  // quando as props do lead ou o isEditingStatus do pai mudam.
  useEffect(() => {
    // Se o lead já tiver um status, use-o. Caso contrário, mantenha vazio.
    setStatus(lead.status || '');

    // O select começa desabilitado por padrão. Ele será habilitado se:
    // 1. A prop isEditingStatus do pai for verdadeira (indicando que a edição está liberada).
    // 2. O status atual do lead NÃO for 'Fechado' nem 'Perdido' (esses são estados finais).
    setIsSelectDisabled(!(isEditingStatus && (lead.status === 'Em Contato' || lead.status === 'Sem Contato' || !lead.status)));

    // Se o lead.status for 'Fechado' ou 'Perdido' (status finais),
    // a caixa de seleção DEVE ficar desabilitada e o botão "Alterar Status" não deve aparecer.
    if (lead.status === 'Fechado' || lead.status === 'Perdido') {
        setIsSelectDisabled(true);
    }
  }, [lead.status, isEditingStatus]);


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

    // Após confirmar, desabilita a caixa de seleção.
    // O re-habilitação será feita via o botão "Alterar Status" ou recarregando a página
    // e o `useEffect` definindo o `isSelectDisabled` baseado em `isEditingStatus`.
    setIsSelectDisabled(true);

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
        onUpdateStatus(lead.id, status, lead.phone); // Chama o callback para informar a atualização ao componente pai
      }

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do lead. Por favor, tente novamente.');
    }
  };

  // Determina se o botão "Alterar Status" deve ser exibido
  const shouldShowAlterarStatusButton = (status === 'Em Contato' || status === 'Sem Contato') && !isEditingStatus;

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
      <p style={{ margin: '5px 0' }}><strong>Status:</strong> <span style={{ fontWeight: 'bold', color: status === 'Em Contato' ? 'orange' : status === 'Fechado' ? 'green' : status === 'Perdido' ? 'red' : 'gray' }}>{status || 'Não Definido'}</span></p> {/* Exibe "Não Definido" se status estiver vazio */}

      {/* Caixa de seleção de status */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            // Ao mudar a seleção, se o status não for "Fechado" ou "Perdido",
            // habilita o botão de Confirmar.
            // A própria alteração do select já significa que a edição está "em andamento".
            setIsSelectDisabled(false);
          }}
          disabled={isSelectDisabled}
          style={{
            marginRight: '10px',
            padding: '8px',
            border: '2px solid #ccc',
            borderRadius: '4px',
            minWidth: '160px',
            backgroundColor: isSelectDisabled ? '#f0f0f0' : '#fff',
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
        {shouldShowAlterarStatusButton ? (
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
        ) : (
            <button
                onClick={handleConfirm}
                disabled={disabledConfirm || !status || isSelectDisabled} // Desabilita se não tiver status selecionado ou se estiver disabled
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
        )}
      </div>
    </div>
  );
};

export default Lead;
