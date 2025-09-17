import React, { useState } from 'react';
import { Mail, Phone, Calendar } from 'lucide-react';

const Lead = ({ lead, onUpdateStatus, disabledConfirm, datasAgendadas, setDatasAgendadas }) => {
  const [status, setStatus] = useState(lead.status || '');
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [dataAgendamento, setDataAgendamento] = useState(datasAgendadas[lead.id] || '');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Mapeamento de status para cores
  const statusColors = {
    'Em Contato': '#007bff',
    'Sem Contato': '#dc3545',
    'Agendamento': '#ffc107',
    'Fechado': '#28a745',
    'Perdido': '#6c757d',
  };

  const handleSelectStatus = (e) => {
    const selectedStatus = e.target.value;
    setStatus(selectedStatus);
    // Mostra o date picker apenas se o status "Agendamento" for selecionado
    if (selectedStatus === 'Agendamento') {
      setShowDatePicker(true);
    } else {
      setShowDatePicker(false);
    }
  };

  const handleDataChange = (e) => {
    const data = e.target.value;
    setDataAgendamento(data);
    setDatasAgendadas(prev => ({
      ...prev,
      [lead.id]: data,
    }));
  };

  const handleConfirm = () => {
    // Se o status for "Agendamento" e não houver data, impede o envio
    if (status === 'Agendamento' && !dataAgendamento) {
        alert('Por favor, selecione uma data para o agendamento.');
        return;
    }
    // Caso contrário, continua com a atualização normal
    onUpdateStatus(lead.id, status, lead.phone);
    setShowStatusOptions(false);
  };
  
  // CORREÇÃO: Função para formatar o número de telefone
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phoneNumber;
  };
  
  const leadStatusStyle = {
    color: 'white',
    backgroundColor: statusColors[lead.status] || '#6c757d',
    padding: '4px 8px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '14px',
    display: 'inline-block',
    whiteSpace: 'nowrap',
  };

  return (
    <div>
      <h3 style={{ margin: '0 0 5px 0' }}>{lead.name}</h3>
      <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
        <strong>Status: </strong>
        <span style={leadStatusStyle}>{lead.status}</span>
      </p>

      <ul style={{ listStyleType: 'none', padding: 0, margin: '15px 0' }}>
        <li style={{ marginBottom: '5px' }}>
          <a href={`mailto:${lead.email}`} style={{ textDecoration: 'none', color: '#333' }}>
            <Mail size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
            {lead.email}
          </a>
        </li>
        <li style={{ marginBottom: '5px' }}>
          <a href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#333' }}>
            <Phone size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
            {formatPhoneNumber(lead.phone)}
          </a>
        </li>
      </ul>

      {/* Ações de status */}
      {lead.status === 'Novo' || lead.status === 'Agendamento' || showStatusOptions ? (
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              value={status}
              onChange={handleSelectStatus}
              style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">Mudar Status</option>
              <option value="Em Contato">Em Contato</option>
              <option value="Sem Contato">Sem Contato</option>
              <option value="Fechado">Fechado</option>
              <option value="Perdido">Perdido</option>
              <option value="Agendamento">Agendamento</option>
            </select>
            <button
              onClick={handleConfirm}
              disabled={disabledConfirm || !status}
              style={{
                padding: '5px 12px',
                backgroundColor: (disabledConfirm || !status) ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: (disabledConfirm || !status) ? 'not-allowed' : 'pointer',
              }}
            >
              Confirmar
            </button>
          </div>
          {/* NOVO: Input de data que aparece ao selecionar "Agendamento" */}
          {showDatePicker && (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={20} style={{ color: '#555' }} />
              <input
                type="date"
                value={dataAgendamento}
                onChange={handleDataChange}
                style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginTop: '10px' }}>
          <button
            onClick={() => setShowStatusOptions(true)}
            style={{
              padding: '5px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Mudar Status
          </button>
        </div>
      )}
    </div>
  );
};

export default Lead;
