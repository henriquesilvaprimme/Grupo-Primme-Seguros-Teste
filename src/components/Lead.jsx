import React, { useState, useEffect } from 'react';

const Lead = ({ lead, onUpdateStatus, disabledConfirm }) => {
  const [status, setStatus] = useState(lead.status || '');
  const [isStatusConfirmed, setIsStatusConfirmed] = useState(
    lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status === 'Fechado' || lead.status === 'Perdido' || lead.status.startsWith('Agendado')
  );
  const [showCalendar, setShowCalendar] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  
  // 🆕 NOVO ESTADO PARA A OBSERVAÇÃO DO AGENDAMENTO
  const [observacaoAgendamento, setObservacaoAgendamento] = useState('');

  const cardColor = (() => {
    switch (true) {
      case status.startsWith('Fechado'):
        return '#d4edda';
      case status.startsWith('Perdido'):
        return '#f8d7da';
      case status.startsWith('Em Contato'):
        return '#fff3cd';
      case status.startsWith('Sem Contato'):
        return '#e2e3e5';
      case status.startsWith('Agendado'):
        return '#cce5ff';
      case status === 'Selecione o status' || status === '':
      default:
        return '#ffffff';
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
    enviarLeadAtualizado(lead.id, status, lead.phone);
    setIsStatusConfirmed(true);
    if (onUpdateStatus) {
      onUpdateStatus(lead.id, status, lead.phone);
    }
  };

  const handleScheduleConfirm = () => {
    if (!scheduledDate) {
      alert('Selecione uma data para o agendamento!');
      return;
    }
    const selectedDate = new Date(scheduledDate + 'T00:00:00');
    const formattedDate = selectedDate.toLocaleDateString('pt-BR');
    const newStatus = `Agendado - ${formattedDate}`;

    // 🆕 Inclui a observação na chamada da função
    enviarLeadAtualizado(lead.id, newStatus, lead.phone, observacaoAgendamento);
    setStatus(newStatus);
    setIsStatusConfirmed(true);
    setShowCalendar(false);

    if (onUpdateStatus) {
      // 🆕 Passa a observação para o componente pai
      onUpdateStatus(lead.id, newStatus, lead.phone, observacaoAgendamento);
    }
  };

  const handleAlterar = () => {
    setIsStatusConfirmed(false);
    setShowCalendar(false);
  };

  // 🆕 ATUALIZADO: Função para enviar lead agora pode receber a observação
  const enviarLeadAtualizado = async (leadId, status, phone, observacao = '') => {
    try {
      await fetch('https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=alterar_status', {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          lead: leadId,
          status: status,
          phone: phone,
          // 🆕 Incluído o campo de observação
          observacao: observacao
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
      <p><strong>Modelo do veículo:</strong> {lead.vehicleModel}</p>
      <p><strong>Ano/Modelo:</strong> {lead.vehicleYearModel}</p>
      <p><strong>Cidade:</strong> {lead.city}</p>
      <p><strong>Telefone:</strong> {lead.phone}</p>
      <p><strong>Tipo de Seguro:</strong> {lead.insuranceType}</p>

      <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <select
          value={status}
          onChange={(e) => {
            const newStatus = e.target.value;
            setStatus(newStatus);
            if (newStatus === 'Agendar') {
              setShowCalendar(true);
            } else {
              setShowCalendar(false);
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
          <option value="Agendar">Agendar</option>
          <option value="Em Contato">Em Contato</option>
          <option value="Fechado">Fechado</option>
          <option value="Perdido">Perdido</option>
          <option value="Sem Contato">Sem Contato</option>
        </select>

        {!isStatusConfirmed ? (
          <>
            {!showCalendar && (
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
            )}
          </>
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

      {/* 🆕 Novos campos para o status "Agendar" */}
      {showCalendar && (
        <div style={{ marginTop: '15px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="agendamento-data" style={{ display: 'block', fontWeight: 'bold' }}>Data do Agendamento:</label>
            <input
              type="date"
              id="agendamento-data"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              style={{ padding: '8px', border: '2px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label htmlFor="agendamento-obs" style={{ display: 'block', fontWeight: 'bold' }}>Observações:</label>
            <textarea
              id="agendamento-obs"
              value={observacaoAgendamento}
              onChange={(e) => setObservacaoAgendamento(e.target.value)}
              placeholder="Adicione observações sobre o agendamento..."
              rows="3"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            ></textarea>
          </div>
          
          {/* Botão de confirmação para Agendamento, agora abaixo do campo de observação */}
          <button
            onClick={handleScheduleConfirm}
            disabled={!scheduledDate}
            style={{
              padding: '8px 16px',
              backgroundColor: !scheduledDate ? '#aaa' : '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: !scheduledDate ? 'not-allowed' : 'pointer'
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
