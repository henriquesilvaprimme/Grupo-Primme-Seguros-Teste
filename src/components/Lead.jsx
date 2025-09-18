import React, { useState } from 'react';
import {
  Phone,
  MessageCircle,
  Clock,
  Briefcase,
  ThumbsUp,
  ThumbsDown,
  Calendar,
} from 'lucide-react';
import { getWhatsAppUrl } from './utils/whatsappUtils';

const Lead = ({ lead, onUpdateStatus, disabledConfirm }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showConfirmationPerdido, setShowConfirmationPerdido] = useState(false);
  
  // 🆕 NOVOS ESTADOS PARA AGENDAMENTO E OBSERVAÇÃO
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [observacaoAgendamento, setObservacaoAgendamento] = useState('');
  const [showAgendarFields, setShowAgendarFields] = useState(false);

  const phone = lead.phone.replace(/\D/g, '');
  const whatsAppUrl = getWhatsAppUrl(phone);

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setShowConfirmation(true);
    setShowConfirmationPerdido(false);
    setShowAgendarFields(status === 'Agendado'); // 🆕 Ativa os campos de agendamento se o status for "Agendado"
  };

  const handleConfirm = () => {
    let newStatus = selectedStatus;
    
    // 🆕 Inclui a data no status se for agendamento
    if (selectedStatus === 'Agendado' && dataAgendamento) {
        // Formata a data para DD/MM/AAAA
        const [ano, mes, dia] = dataAgendamento.split('-');
        newStatus = `Agendado - ${dia}/${mes}/${ano}`;
        
        // 🆕 A onUpdateStatus precisa de um terceiro parâmetro agora (para observações)
        // Você terá que ajustar o componente pai (Leads.jsx) para receber essa observação,
        // mas aqui no Lead.jsx, nós a passamos para a função.
        onUpdateStatus(lead.id, newStatus, lead.phone, observacaoAgendamento);
        
    } else if (selectedStatus === 'Agendado' && !dataAgendamento) {
      alert('Por favor, selecione uma data para o agendamento.');
      return;
    } else {
        // Para os outros status, a função onUpdateStatus já está ajustada
        onUpdateStatus(lead.id, newStatus, lead.phone);
    }
    
    setShowConfirmation(false);
    setShowConfirmationPerdido(false);
    setSelectedStatus('');
    setShowAgendarFields(false);
  };

  const handleConfirmPerdido = () => {
    onUpdateStatus(lead.id, selectedStatus);
    setShowConfirmation(false);
    setShowConfirmationPerdido(false);
    setSelectedStatus('');
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setShowConfirmationPerdido(false);
    setSelectedStatus('');
    setShowAgendarFields(false); // 🆕 Cancela e esconde os campos de agendamento
  };

  // Funções para lidar com os campos de Agendamento
  const handleDataChange = (e) => {
    setDataAgendamento(e.target.value);
  };

  const handleObservacaoChange = (e) => {
    setObservacaoAgendamento(e.target.value);
  };
  
  return (
    <div style={{ flex: 1 }}>
      <div style={{ marginBottom: '10px' }}>
        <strong>Nome:</strong> {lead.name}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <strong>Telefone:</strong> {lead.phone}
      </div>
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> {lead.status}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
        {/* Botão de Status */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          disabled={disabledConfirm}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: disabledConfirm ? 'not-allowed' : 'pointer',
            opacity: disabledConfirm ? 0.6 : 1,
          }}
        >
          {showOptions ? 'Cancelar' : 'Alterar Status'}
        </button>

        {/* Botão do WhatsApp */}
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '8px 16px',
            backgroundColor: '#25D366',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <MessageCircle size={20} /> WhatsApp
        </a>
      </div>

      {/* Opções de Status */}
      {showOptions && (
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleStatusChange('Em Contato')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <Phone size={20} style={{ marginRight: '5px' }} /> Em Contato
          </button>
          <button
            onClick={() => handleStatusChange('Sem Contato')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <Clock size={20} style={{ marginRight: '5px' }} /> Sem Contato
          </button>
          <button
            onClick={() => handleStatusChange('Agendado')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <Calendar size={20} style={{ marginRight: '5px' }} /> Agendar
          </button>
          <button
            onClick={() => handleStatusChange('Fechado')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <Briefcase size={20} style={{ marginRight: '5px' }} /> Fechado
          </button>
          <button
            onClick={() => {
              setSelectedStatus('Perdido');
              setShowConfirmationPerdido(true);
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <ThumbsDown size={20} style={{ marginRight: '5px' }} /> Perdido
          </button>
        </div>
      )}

      {/* 🆕 Novos campos para "Agendado" */}
      {showAgendarFields && (
          <div style={{ marginTop: '15px' }}>
              <div style={{ marginBottom: '10px' }}>
                  <label htmlFor="data-agendamento" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Data do Agendamento:
                  </label>
                  <input
                      type="date"
                      id="data-agendamento"
                      value={dataAgendamento}
                      onChange={handleDataChange}
                      style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
              </div>

              <div style={{ marginBottom: '10px' }}>
                  <label htmlFor="observacao-agendamento" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Observações:
                  </label>
                  <textarea
                      id="observacao-agendamento"
                      value={observacaoAgendamento}
                      onChange={handleObservacaoChange}
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

              {/* 🆕 Botão de Confirmação para Agendamento */}
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleConfirm}
                  disabled={!dataAgendamento}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !dataAgendamento ? 'not-allowed' : 'pointer',
                    opacity: !dataAgendamento ? 0.6 : 1,
                  }}
                >
                  <ThumbsUp size={20} style={{ marginRight: '5px' }} /> Confirmar Agendamento
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              </div>
          </div>
      )}

      {/* Confirmação para status Perdido */}
      {showConfirmationPerdido && (
        <div style={{ marginTop: '15px' }}>
          <p>Tem certeza que deseja marcar como {selectedStatus}?</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleConfirmPerdido}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Sim
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Não
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lead;
