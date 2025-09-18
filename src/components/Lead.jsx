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

  // NOVO: Função única para confirmar o status, independente de ser agendamento ou não
  const handleConfirm = () => {
    if (!status || status === 'Selecione o status') {
      alert('Selecione um status antes de confirmar!');
      return;
    }

    let newStatus = status;
    let observationToSend = '';

    // Lógica específica para o agendamento
    if (status === 'Agendar') {
      if (!scheduledDate) {
        alert('Selecione uma data para o agendamento!');
        return;
      }
      const selectedDate = new Date(scheduledDate + 'T00:00:00');
      const formattedDate = selectedDate.toLocaleDateString('pt-BR');
      newStatus = `Agendado - ${formattedDate}`;
      observationToSend = scheduleObservation;
    }

    // Envia a requisição com base no status final
    enviarLeadAtualizado(lead.id, newStatus, lead.phone, observationToSend);
    setStatus(newStatus); // Atualiza o estado local com o novo status
    setIsStatusConfirmed(true);
    setShowScheduleOptions(false);

    if (onUpdateStatus) {
      onUpdateStatus(lead.id, newStatus, lead.phone);
    }
  };


  const handleAlterar = () => {
    // Permite a edição do status novamente e esconde os campos de agendamento
    setIsStatusConfirmed(false);
    setShowScheduleOptions(false);
    // Limpa os campos de agendamento ao clicar em "Alterar"
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
          // NOVO: Adiciona a observação ao corpo da requisição
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
      {/* Exibe o status atual no canto superior direito se o status estiver confirmado */}
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

      <div style={{ marginTop: '15px', display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={status}
            onChange={(e) => {
              const newStatus = e.target.value;
              setStatus(newStatus);
              // Exibe os campos de agendamento apenas quando "Agendar" é selecionado
              setShowScheduleOptions(newStatus === 'Agendar');
            }}
            // O select é desabilitado se o status já foi confirmado
            disabled={isStatusConfirmed}
            style={{
              marginRight: '10px',
              padding: '8px',
              border: '2px solid #ccc',
              borderRadius: '4px',
              minWidth: '160px',
              // Estilo para indicar que está desabilitado
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

          {/* NOVO: Renderiza os campos de agendamento ao lado do select */}
          {showScheduleOptions && (
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
            </>
          )}

          {/* Lógica para exibir Confirmar ou Alterar */}
          {!isStatusConfirmed ? (
            <button
              onClick={handleConfirm}
              // A validação agora é mais complexa: se for 'Agendar', a data é obrigatória
              disabled={disabledConfirm || !status || status === '' || status === 'Selecione o status' || (status === 'Agendar' && !scheduledDate)}
              style={{
                padding: '8px 16px',
                backgroundColor: (disabledConfirm || !status || status === '' || status === 'Selecione o status' || (status === 'Agendar' && !scheduledDate)) ? '#aaa' : '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: (disabledConfirm || !status || status === '' || status === 'Selecione o status' || (status === 'Agendar' && !scheduledDate)) ? 'not-allowed' : 'pointer'
              }}
            >
              {/* O texto do botão muda dinamicamente */}
              {status === 'Agendar' ? 'Confirmar Agendamento' : 'Confirmar'}
            </button>
          ) : (
            <button
              onClick={handleAlterar}
              style={{
                padding: '8px 16px',
                backgroundColor: '#ffc107', // Cor amarela
                color: '#212529', // Texto escuro para contraste
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
    </div>
  );
};

export default Lead;
