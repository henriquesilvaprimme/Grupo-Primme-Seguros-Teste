import React, { useState, useEffect } from 'react';
// import { Phone } from 'lucide-react'; <-- REMOVIDO: Ícone de telefone para o botão do WhatsApp não é mais necessário

const Lead = ({ lead, onUpdateStatus, disabledConfirm }) => {
  const [status, setStatus] = useState(lead.status || '');
  // `isStatusConfirmed` para controlar o bloqueio da seleção e exibição do botão "Alterar"
  const [isStatusConfirmed, setIsStatusConfirmed] = useState(
    lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status === 'Fechado' || lead.status === 'Perdido' || lead.status.startsWith('Agendado')
  );
  // NOVO: 'showScheduleOptions' para controlar a exibição do calendário e observações
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  // NOVO: 'scheduleObservation' para armazenar as observações do agendamento
  const [scheduleObservation, setScheduleObservation] = useState('');

  // Define a cor do card conforme o status
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

  // Sincroniza o estado `isStatusConfirmed` quando o `lead.status` muda (ex: após um refresh de leads)
  useEffect(() => {
    setIsStatusConfirmed(
      lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status === 'Fechado' || lead.status === 'Perdido' || lead.status.startsWith('Agendado')
    );
    setStatus(lead.status || ''); // Garante que o status exibido esteja sempre atualizado com o lead
  }, [lead.status]);

  const handleConfirm = () => {
    if (!status || status === 'Selecione o status') {
      alert('Selecione um status antes de confirmar!');
      return;
    }
    
    // NOVO: Se o status for 'Agendar', exibe os campos de agendamento e sai da função.
    if (status === 'Agendar') {
      setShowScheduleOptions(true);
      return;
    }

    enviarLeadAtualizado(lead.id, status, lead.phone, '');

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

    enviarLeadAtualizado(lead.id, newStatus, lead.phone, scheduleObservation);
    setStatus(newStatus);
    setIsStatusConfirmed(true);
    setShowScheduleOptions(false);

    if (onUpdateStatus) {
      onUpdateStatus(lead.id, newStatus, lead.phone);
    }
  };

  const handleAlterar = () => {
    setIsStatusConfirmed(false);
    setShowScheduleOptions(false);
    setScheduledDate('');
    setScheduleObservation('');
  };

  const enviarLeadAtualizado = async (leadId, status, phone, observation) => {
    try {
      await fetch('https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec?v=alterar_status', {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          lead: leadId,
          status: status,
          phone: phone,
          observation: observation
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

      <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <select
          value={status}
          onChange={(e) => {
            const newStatus = e.target.value;
            setStatus(newStatus);
            // Ao mudar o status, sempre esconde os campos de agendamento para evitar estados inconsistentes.
            if (newStatus !== 'Agendar') {
              setShowScheduleOptions(false);
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

        {/* Lógica para exibir o botão Confirmar/Alterar e os campos de agendamento */}
        {!isStatusConfirmed ? (
          // NOVO: Exibe os campos de agendamento se showScheduleOptions for true
          showScheduleOptions ? (
            <>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                style={{
                  padding: '8px',
                  border: '2px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <textarea
                placeholder="Observações (opcional)"
                value={scheduleObservation}
                onChange={(e) => setScheduleObservation(e.target.value)}
                style={{
                  padding: '8px',
                  border: '2px solid #ccc',
                  borderRadius: '4px',
                  minHeight: '40px',
                  width: '200px'
                }}
              />
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
            </>
          ) : (
            // Se Agendar não foi selecionado e confirmado, exibe o botão de confirmação padrão
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
          )
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
    </div>
  );
};

export default Lead;
