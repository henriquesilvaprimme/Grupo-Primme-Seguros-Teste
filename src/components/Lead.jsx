import React, { useState, useEffect } from 'react';
import { Mail, Phone, Calendar, MapPin, Loader, CheckCircle, XCircle } from 'lucide-react';

const Lead = ({ lead, onUpdateStatus, disabledConfirm, agendamento, onAgendamentoChange, onConfirmAgendamento, onAlterarAgendamento }) => {
  const [statusTemp, setStatusTemp] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setStatusTemp(lead.status);
  }, [lead.status]);

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatusTemp(newStatus);
    if (newStatus !== 'Agendado') {
      onUpdateStatus(lead.id, newStatus);
    }
  };

  const handleConfirm = async () => {
    if (statusTemp === 'Agendado') {
      await onConfirmAgendamento(lead.id, agendamento);
    } else {
      await onUpdateStatus(lead.id, statusTemp);
    }
  };

  const handleAlterar = () => {
    onAlterarAgendamento(lead.id);
  };

  const isAgendadoAndConfirmed = lead.status === 'Agendado' && lead.agendamento;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h3 style={{ margin: 0 }}>{lead.name}</h3>
        {lead.responsavel && (
          <span
            style={{
              fontSize: '12px',
              backgroundColor: '#e9e9e9',
              padding: '4px 8px',
              borderRadius: '12px',
              color: '#555',
            }}
          >
            {lead.responsavel}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={16} /> {lead.email}
        </p>
        <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Phone size={16} /> {lead.phone}
        </p>
        {lead.status === 'Agendado' && (
          <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} />
            <input 
              type="date" 
              value={agendamento || lead.agendamento || ''} 
              onChange={(e) => onAgendamentoChange(e.target.value)} 
              disabled={isAgendadoAndConfirmed}
              style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }} 
            />
          </p>
        )}
        {lead.localizacao && (
          <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={16} /> {lead.localizacao}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <select value={statusTemp} onChange={handleStatusChange} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
          <option value="Em Contato">Em Contato</option>
          <option value="Sem Contato">Sem Contato</option>
          <option value="Agendado">Agendado</option>
          <option value="Fechado">Fechado</option>
          <option value="Perdido">Perdido</option>
        </select>
        
        {isAgendadoAndConfirmed ? (
          <button
            onClick={handleAlterar}
            disabled={isUpdating}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: isUpdating ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }}
          >
            Alterar
          </button>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={disabledConfirm || isUpdating}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: (disabledConfirm || isUpdating) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              opacity: (disabledConfirm || isUpdating) ? 0.6 : 1,
            }}
          >
            {isUpdating ? <Loader className="animate-spin" size={18} /> : 'Confirmar'}
          </button>
        )}
        
      </div>
    </div>
  );
};

export default Lead;
