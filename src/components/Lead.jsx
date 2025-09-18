import React, { useState, useEffect } from 'react';
// import { Phone } from 'lucide-react'; <-- REMOVIDO: Ícone de telefone para o botão do WhatsApp não é mais necessário

const Lead = ({ lead, onUpdateStatus, disabledConfirm }) => {
  const [status, setStatus] = useState(lead.status || '');
  const [isStatusConfirmed, setIsStatusConfirmed] = useState(
    lead.status === 'Em Contato' || lead.status === 'Sem Contato' || lead.status === 'Fechado' || lead.status === 'Perdido' || lead.status.startsWith('Agendado')
  );
  
  const [showModal, setShowModal] = useState(false);
  const [agendarData, setAgendarData] = useState('');
  const [observacao, setObservacao] = useState('');

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
    
    // Se o status for "Agendado", pré-preenche a data
    if (lead.status.startsWith('Agendado')) {
      const statusDateStr = lead.status.split(' - ')[1];
      if (statusDateStr) {
        const [dia, mes, ano] = statusDateStr.split('/');
        // Converte para o formato YYYY-MM-DD
        const formattedDate = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        setAgendarData(formattedDate);
      }
    }
  }, [lead.status]);

  const handleConfirm = () => {
    if (!status || status === 'Selecione o status') {
      alert('Selecione um status antes de confirmar!');
      return;
    }

    if (status === 'Agendar') {
        setShowModal(true);
    } else {
        onUpdateStatus(lead.id, status, lead.phone);
        setIsStatusConfirmed(true);
    }
  };
  
  const handleAlterar = () => {
    setIsStatusConfirmed(false);
    setShowModal(false);
  };

  const handleModalConfirm = () => {
      if (status === 'Agendar' && !agendarData) {
          alert('Por favor, selecione uma data para o agendamento.');
          return;
      }
      
      const novoStatus = status === 'Agendar' ? `Agendado - ${new Date(agendarData + 'T00:00:00').toLocaleDateString('pt-BR')}` : status;
      onUpdateStatus(lead.id, novoStatus, lead.phone, observacao);
      setIsStatusConfirmed(true);
      setShowModal(false);
      setAgendarData('');
      setObservacao('');
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

      {showModal && (
        <div style={{
          position: 'absolute',
          top: '50%',
          right: '20px',
          transform: 'translateY(-50%)',
          zIndex: 10,
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          <div>
            <label htmlFor={`agendar-data-${lead.id}`} style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Selecione a data:
            </label>
            <input
              type="date"
              id={`agendar-data-${lead.id}`}
              value={agendarData}
              onChange={(e) => setAgendarData(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label htmlFor={`observacao-${lead.id}`} style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Observações:
            </label>
            <textarea
              id={`observacao-${lead.id}`}
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Adicione observações sobre o agendamento..."
              rows="4"
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '100%',
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            ></textarea>
          </div>
          <button
            onClick={handleModalConfirm}
            disabled={!agendarData && status === 'Agendar'}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (!agendarData && status === 'Agendar') ? 'not-allowed' : 'pointer',
              opacity: (!agendarData && status === 'Agendar') ? 0.6 : 1
            }}
          >
            Salvar Agendamento
          </button>
        </div>
      )}
    </div>
  );
};

export default Lead;
