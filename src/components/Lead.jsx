import React, { useState, useEffect } from 'react';
// import { Phone } from 'lucide-react'; <-- REMOVIDO: Ícone de telefone para o botão do WhatsApp não é mais necessário

const Lead = ({ lead, onUpdateStatus, disabledConfirm, agendamento, onAgendamentoChange, onConfirmAgendamento }) => {
  const [status, setStatus] = useState(lead.status || '');
  // `isStatusConfirmed` para controlar o bloqueio da seleção e exibição do botão "Alterar"
  const [isStatusConfirmed, setIsStatusConfirmed] = useState(
    lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status === 'Fechado' || lead.status === 'Perdido' || lead.status === 'Agendado'
  );
  // NOVO ESTADO: Controla a exibição do calendário de agendamento
  const [showAgendamento, setShowAgendamento] = useState(false);

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
      case 'Agendado':
        return '#cce5ff'; // azul claro para agendamento
      case 'Selecione o status':
      case '':
      default:
        return '#ffffff'; // branco
    }
  })();

  // Sincroniza o estado `isStatusConfirmed` quando o `lead.status` muda (ex: após um refresh de leads)
  useEffect(() => {
    setIsStatusConfirmed(
      lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status === 'Fechado' || lead.status === 'Perdido' || lead.status === 'Agendado'
    );
    setStatus(lead.status || ''); // Garante que o status exibido esteja sempre atualizado com o lead
    // Se o lead já está agendado, mostra a data de agendamento se existir
    if (lead.status === 'Agendado' && lead.agendamento) {
      setShowAgendamento(true);
    }
  }, [lead.status, lead.agendamento]);

  const handleConfirm = () => {
    if (!status || status === 'Selecione o status') {
      alert('Selecione um status antes de confirmar!');
      return;
    }

    if (status === 'Agendado') {
      // Se for Agendado, apenas mostra o calendário e sai da função.
      setShowAgendamento(true);
      return;
    }

    // Se não for Agendado, mantém o fluxo normal
    onUpdateStatus(lead.id, status, lead.phone);
    setIsStatusConfirmed(true);
  };

  const handleAlterar = () => {
    // Permite a edição do status novamente
    setIsStatusConfirmed(false);
    // Esconde o campo de agendamento ao alterar
    setShowAgendamento(false);
  };

  const handleConfirmAgendamentoClick = () => {
    onConfirmAgendamento(lead.id); // Chama a função do componente pai para salvar no Google Sheets
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
      {/* Exibe a data de agendamento se o lead estiver agendado */}
      {lead.status === 'Agendado' && lead.agendamento && (
        <p><strong>Agendamento:</strong> {new Date(lead.agendamento).toLocaleDateString()}</p>
      )}

      <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            // Ao mudar a seleção, esconde o calendário, exceto se já estiver confirmado
            if (e.target.value !== 'Agendado') {
              setShowAgendamento(false);
            }
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
          <option value="Em Contato">Em Contato</option>
          <option value="Fechado">Fechado</option>
          <option value="Perdido">Perdido</option>
          <option value="Sem Contato">Sem Contato</option>
          <option value="Agendado">Agendado</option>
        </select>

        {/* Lógica condicional para exibir Confirmar ou Alterar */}
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

      {showAgendamento && status === 'Agendado' && (
        <div style={{ marginTop: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Data do Agendamento:</label>
          <input
            type="date"
            value={agendamento}
            onChange={(e) => onAgendamentoChange(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button
            onClick={handleConfirmAgendamentoClick}
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

      {/* REMOVIDO: Botão do WhatsApp */}
      {/*
      <div style={{ marginTop: '10px' }}>
        <a
          href={`https://wa.me/${lead.phone}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: '#25D366',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '5px',
            textDecoration: 'none',
            fontSize: '0.9em',
          }}
        >
          <Phone size={16} /> Enviar WhatsApp
        </a>
      </div>
      */}
    </div>
  );
};

export default Lead;
