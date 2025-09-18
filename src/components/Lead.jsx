import React, { useState, useEffect } from 'react';

const Lead = ({ lead, onUpdateStatus, disabledConfirm }) => {
  const [status, setStatus] = useState(lead.status || '');
  const [observacao, setObservacao] = useState(lead.observacao || '');
  const [isStatusConfirmed, setIsStatusConfirmed] = useState(
    lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status === 'Fechado' || lead.status === 'Perdido' || lead.status.startsWith('Agendar')
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

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
      case status.startsWith('Agendar'):
        return '#cce5ff'; // azul claro
      case status === 'Selecione o status' || status === '':
      default:
        return '#ffffff'; // branco
    }
  })();

  useEffect(() => {
    setIsStatusConfirmed(
      lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status === 'Fechado' || lead.status === 'Perdido' || lead.status.startsWith('Agendar')
    );
    setStatus(lead.status || '');
    setObservacao(lead.observacao || '');
  }, [lead.status, lead.observacao]);

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

  const enviarObservacao = async (leadId, observacaoTexto) => {
    try {
      await fetch('https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec', {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          v: 'salvarObservacao', // Ação para salvar observação
          leadId: leadId,
          observacao: observacaoTexto,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Observação salva com sucesso.');
    } catch (error) {
      console.error('Erro ao salvar observação:', error);
    }
  };

  const handleConfirm = async () => {
    if (!status || status === 'Selecione o status') {
      alert('Selecione um status antes de confirmar!');
      return;
    }

    // Envia a atualização de status para o script
    await enviarLeadAtualizado(lead.id, status, lead.phone);

    // Após a confirmação, bloqueia a caixa de seleção
    setIsStatusConfirmed(true);

    // Chama o callback para informar a atualização
    if (onUpdateStatus) {
      onUpdateStatus(lead.id, status, lead.phone);
    }
  };

  const handleScheduleConfirm = async () => {
    if (!scheduledDate) {
      alert('Selecione uma data para o agendamento!');
      return;
    }

    const selectedDate = new Date(scheduledDate + 'T00:00:00');
    const formattedDate = selectedDate.toLocaleDateString('pt-BR');
    const newStatus = `Agendado - ${formattedDate}`;

    await enviarLeadAtualizado(lead.id, newStatus, lead.phone);
    setStatus(newStatus);
    setIsStatusConfirmed(true);
    setShowCalendar(false);

    if (onUpdateStatus) {
      onUpdateStatus(lead.id, newStatus, lead.phone);
    }
  };

  const handleAlterar = () => {
    setIsStatusConfirmed(false);
    setShowCalendar(false);
  };

  return (
    <div
      style={{
        border: '1px solid #ddd',
        padding: '15px',
        marginBottom: '15px',
        borderRadius: '5px',
        backgroundColor: cardColor,
        position: 'relative'
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

      <p><strong>Nome:</strong> {lead.name}</p>
      <p><strong>Modelo do veículo:</strong> {lead.vehiclemodel}</p>
      <p><strong>Ano/Modelo:</strong> {lead.vehicleyearmodel}</p>
      <p><strong>Cidade:</strong> {lead.city}</p>
      <p><strong>Telefone:</strong> {lead.phone}</p>
      <p><strong>Tipo de Seguro:</strong> {lead.insurancetype}</p>
      <p><strong>Observação:</strong> {lead.observacao}</p>
      <p><strong>Agendamento:</strong> {lead.agendamento}</p>


      <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
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
            <option value="Agendar">Agendar</option>
            <option value="Em Contato">Em Contato</option>
            <option value="Fechado">Fechado</option>
            <option value="Perdido">Perdido</option>
            <option value="Sem Contato">Sem Contato</option>
          </select>
        </div>

        {/* Input de Observação */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Adicione uma observação aqui..."
            style={{
              flex: 1,
              padding: '8px',
              border: '2px solid #ccc',
              borderRadius: '4px',
              minHeight: '80px',
            }}
          />
        </div>

        {/* Botão de Salvar Observação */}
        <button
          onClick={() => {
            enviarObservacao(lead.id, observacao);
            // Opcional: Atualizar a lista de leads após salvar a observação
            if (onUpdateStatus) onUpdateStatus();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Salvar Observação
        </button>
      </div>
    </div>
  );
};

export default Lead;
