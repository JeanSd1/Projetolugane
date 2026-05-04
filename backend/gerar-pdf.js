const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Criar diretório de PDFs se não existir
const pdfDir = path.join(__dirname, 'relatorios-pdf');
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

function gerarRelatorioPDF(historico, estadisticasMes, ano, mes) {
  return new Promise((resolve, reject) => {
    try {
      // Nome do arquivo
      const mesStr = String(mes).padStart(2, '0');
      const anoStr = String(ano);
      const nomeArquivo = `relatorio_${historico.telefone}_${anoStr}-${mesStr}.pdf`;
      const caminhoSaida = path.join(pdfDir, nomeArquivo);

      // Criar documento PDF
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        bufferPages: true
      });

      // Stream de escrita
      const stream = fs.createWriteStream(caminhoSaida);
      doc.pipe(stream);

      // ==========================
      // CABEÇALHO
      // ==========================
      doc.fillColor('#667eea');
      doc.fontSize(28).font('Helvetica-Bold').text('RELATÓRIO DE ATENDIMENTO', {
        align: 'center'
      });

      doc.fillColor('#333');
      doc.fontSize(11).font('Helvetica').text(`${ano}-${mesStr}`, {
        align: 'center'
      });

      doc.moveTo(40, doc.y + 5).lineTo(555, doc.y + 5).stroke('#667eea');
      doc.moveDown(0.5);

      // ==========================
      // INFORMAÇÕES DO CLIENTE
      // ==========================
      doc.fillColor('#333').fontSize(14).font('Helvetica-Bold').text('Informações do Cliente');
      doc.fontSize(11).font('Helvetica');

      const clientInfo = [
        { label: 'Nome:', valor: historico.nome_cliente || 'Sem nome' },
        { label: 'Telefone:', valor: historico.telefone },
        { label: 'Período:', valor: `${ano}-${mesStr}` }
      ];

      clientInfo.forEach((info) => {
        doc.fillColor('#666').text(`${info.label} `, { continued: true });
        doc.fillColor('#333').text(info.valor);
      });

      doc.moveDown(0.5);

      // ==========================
      // RESUMO DO MÊS
      // ==========================
      doc.fillColor('#333').fontSize(14).font('Helvetica-Bold').text('Resumo do Mês');
      doc.fontSize(11).font('Helvetica');

      const resumoMes = [
        { label: 'dias com atendimento:', valor: estadisticasMes.total_dias_com_atendimento },
        { label: 'Total de atendimentos:', valor: estadisticasMes.total_atendimentos },
        {
          label: 'Tempo total:',
          valor: `${estadisticasMes.tempo_total_minutos} minutos`
        },
        {
          label: 'Tempo médio/atendimento:',
          valor: `${(estadisticasMes.tempo_total_minutos / Math.max(estadisticasMes.total_atendimentos, 1)).toFixed(0)} minutos`
        }
      ];

      resumoMes.forEach((item) => {
        doc.fillColor('#666').text(`${item.label} `, { continued: true });
        doc.fillColor('#667eea').font('Helvetica-Bold').text(item.valor);
        doc.font('Helvetica');
      });

      doc.moveDown(0.5);

      // ==========================
      // ESTATÍSTICAS GERAIS
      // ==========================
      doc.fillColor('#333').fontSize(14).font('Helvetica-Bold').text('Estatísticas Gerais');
      doc.fontSize(11).font('Helvetica');

      const statsGerais = [
        {
          label: 'Total de atendimentos (histórico):',
          valor: historico.total_atendimentos || 0
        },
        {
          label: 'Tempo médio de atendimento (histórico):',
          valor: `${historico.tempo_medio_atendimento?.toFixed(0) || 0} minutos`
        }
      ];

      statsGerais.forEach((item) => {
        doc.fillColor('#666').text(`${item.label} `, { continued: true });
        doc.fillColor('#667eea').font('Helvetica-Bold').text(item.valor);
        doc.font('Helvetica');
      });

      doc.moveDown(0.5);

      // ==========================
      // DÚVIDAS FREQUENTES
      // ==========================
      if (historico.duvidas_frequentes && historico.duvidas_frequentes.length > 0) {
        doc.fillColor('#333').fontSize(14).font('Helvetica-Bold').text('Dúvidas Frequentes');
        doc.fontSize(10).font('Helvetica');

        historico.duvidas_frequentes.slice(0, 5).forEach((duvida, idx) => {
          doc.fillColor('#667eea').text(`${idx + 1}. `, { continued: true });
          doc.fillColor('#333').text(
            `${duvida.texto} (${duvida.frequencia} vezes)`
          );
        });

        doc.moveDown(0.5);
      }

      // ==========================
      // DETALHAMENTO DIÁRIO (se houver dados)
      // ==========================
      if (estadisticasMes.dias && estadisticasMes.dias.length > 0) {
        doc.fillColor('#333').fontSize(14).font('Helvetica-Bold').text('Detalhamento Diário');
        doc.fontSize(9).font('Helvetica');

        // Cabeçalho da tabela
        doc.fillColor('#667eea').rect(40, doc.y, 515, 20).fill();
        doc.fillColor('white').font('Helvetica-Bold');
        doc.text('Data', 50, doc.y + 5, { width: 100 });
        doc.text('Atendimentos', 150, doc.y - 15, { width: 100 });
        doc.text('Tempo Total (min)', 250, doc.y - 15, { width: 150 });
        doc.moveDown(1.2);

        // Linhas da tabela
        doc.fillColor('#333').font('Helvetica');
        let alternar = false;

        estadisticasMes.dias.forEach((dia) => {
          if (alternar) {
            doc.rect(40, doc.y, 515, 18).fill('#f5f5f5');
          }

          const data = new Date(dia.data);
          const dataFormatada = data.toLocaleDateString('pt-BR');

          doc.fillColor('#333').text(dataFormatada, 50, doc.y + 3, {
            width: 100
          });
          doc.text(dia.total_atendimentos.toString(), 150, doc.y - 15, {
            width: 100
          });
          doc.text(dia.tempo_total_minutos.toString(), 250, doc.y - 15, {
            width: 150
          });

          doc.moveDown(1.1);
          alternar = !alternar;
        });

        doc.moveDown(0.5);
      }

      // ==========================
      // RODAPÉ
      // ==========================
      doc.fontSize(9).fillColor('#999');
      doc.text(
        `Relatório de atendimento gerado em ${new Date().toLocaleDateString(
          'pt-BR'
        )} às ${new Date().toLocaleTimeString('pt-BR')}`,
        { align: 'center' }
      );

      // Finalizar documento
      doc.end();

      // Resolver quando o arquivo for salvo
      stream.on('finish', () => {
        resolve({
          sucesso: true,
          caminho: caminhoSaida,
          nomeArquivo,
          url: `/relatorios-pdf/${nomeArquivo}`
        });
      });

      doc.on('error', (err) => {
        reject(err);
      });

    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  gerarRelatorioPDF,
  pdfDir
};
