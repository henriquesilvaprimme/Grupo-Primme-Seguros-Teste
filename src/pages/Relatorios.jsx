import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const Relatorios = () => {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [loading, setLoading] = useState(false);

  const GOOGLE_APPS_SCRIPT_RELATORIO_URL = 'https://script.google.com/macros/s/AKfycby8vujvd5ybEpkaZ0kwZecAWOdaL0XJR84oKJBAIR9dVYeTCv7iSdTdHQWBb7YCp349/exec';

  const gerarRelatorio = async () => {
    if (!dataInicio || !dataFim) {
      alert('Selecione as datas de início e fim.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_RELATORIO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          v: 'gerar_relatorio_excel',
          dataInicio,
          dataFim
        })
      });

      const dados = await response.json();

      const file = await fetch('/Renovacao - Primme - Julho 2025.xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets['Apolices'];

      const inicioLinha = 2;
      const merges = [];

      dados.forEach((item, index) => {
        const linha = inicioLinha + index;
        worksheet[`A${linha}`] = { v: item.VigenciaFinal };
        worksheet[`B${linha}`] = { v: item.name };
        worksheet[`F${linha}`] = { v: item.Seguradora };
        worksheet[`G${linha}`] = { v: item.PremioLiquido };
        worksheet[`H${linha}`] = { v: item.Comissao };

        // Mesclar B até E
        merges.push({ s: { r: linha - 1, c: 1 }, e: { r: linha - 1, c: 4 } });
      });

      worksheet['!merges'] = merges;

      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), 'Relatorio_Preenchido.xlsx');

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar o relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Gerar Relatório de Apólices</h2>
      <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
        <div>
          <label className="block text-sm font-medium">Data Início</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Data Fim</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <button
          onClick={gerarRelatorio}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Gerando...' : 'Gerar Relatório'}
        </button>
      </div>
    </div>
  );
};

export default Relatorios;
