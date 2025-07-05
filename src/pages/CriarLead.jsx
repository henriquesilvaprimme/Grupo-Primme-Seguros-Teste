const IDSPREADSHEET = '1zW0nwLL6H1QjNqXSCPDHmhyFdEfl0_ts_PrT1_lreMc'

function doPost(e) {
  try {
    var agora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss')

    // Abre a planilha pelo ID
    var planilha = SpreadsheetApp.openById(IDSPREADSHEET);

    // quando for alterar o status, vammos cair nesse caminho aqui, e redirecionar os clientes para as paginas correspondentes
    if (e.parameter.v == 'alterar_status') {


      var dados = JSON.parse(e.postData.contents);

      var aba = planilha.getSheetByName("Leads"); // Coloque o nome da aba aqui

      var todosLeads = aba.getRange("A2:J").getValues();

      // vamos pegar a posição do lead pelo telefone
      var data = todosLeads.map(function(r) { return r[5].trim(); });
      var newdataLead = data.indexOf(dados.phone.trim());

      if (newdataLead != -1) {

        const positionLead = newdataLead + 2
        aba.getRange(positionLead, 10).setValue(dados.status)

        // se fechado
        if (dados.status == 'Fechado') {

          var getLead = aba.getRange(positionLead, 1, 1, 10).getValues()
          getLead[0][7] = agora

          var phone = getLead[0][5];
          if (phone.toString().includes('+')) {
            getLead[0][5] = "'" + phone;
          }

          planilha.getSheetByName("Leads Fechados").appendRow(getLead[0])

          //aba.deleteRow(positionLead)   //.getRange(dados.lead, 1, 1, 10).de

        } else if (dados.status == 'Perdido') {

          var getLead = aba.getRange(positionLead, 1, 1, 10).getValues()
          getLead[0][7] = agora
          planilha.getSheetByName("Leads Perdidos").appendRow(getLead[0])

          //aba.deleteRow(positionLead)   //.getRange(dados.lead, 1, 1, 10).de

        } else {

          aba.getRange(positionLead, 10).setValue(dados.status)

        }

        aba.getRange(positionLead, 11).setValue(agora)

      }



      // quando o assunto for alterar atribuição...
    } else if (e.parameter.v == 'alterar_atribuido') {

      var dados = JSON.parse(e.postData.contents);

      var aba = planilha.getSheetByName("Leads"); // Coloque o nome da aba aqui

      var nomeUsuarioSheet = planilha.getSheetByName("Usuarios").getRange("A2:G").getValues()

      var data = nomeUsuarioSheet.map(function(r) { return parseInt(r[0]); });
      var newdata = data.indexOf(parseInt(dados.usuarioId));

      // caso encontrar o usuario, vamos iserir no lead correspondente
      if (newdata != -1) {
        // vamos salvar o usuario correto...
        aba.getRange(dados.id, 9).setValue(nomeUsuarioSheet[newdata][2])
        aba.getRange(dados.id, 11).setValue(agora)
      }

    } else if (e.parameter.v == 'alterar_seguradora') {

      var dados = JSON.parse(e.postData.contents);

      // SpreadsheetApp.openById("1nE8xVrsuVvpU2ALpcVhvqHmQ6XpRINFpv_SHz9v-ZQQ").getSheetByName("Página1").appendRow([JSON.stringify(e)])

      const sheetFechados = planilha.getSheetByName("Leads Fechados").getRange("A2:N").getValues()

      var dataget = sheetFechados.map(function(r) { return r[0].trim(); });
      var newdata = dataget.indexOf(dados.lead.ID);

      // caso encontrar o usuario, vamos iserir no lead correspondente
      if (newdata != -1) {
        const positionLead = newdata + 2
        // vamos salvar o usuario correto...

        let valorFormatado = (dados.lead.PremioLiquido / 100).toFixed(2).replace('.', ',');

        planilha.getSheetByName("Leads Fechados").getRange(positionLead, 11).setValue(dados.lead.Seguradora)
        planilha.getSheetByName("Leads Fechados").getRange(positionLead, 12).setValue(valorFormatado)
        planilha.getSheetByName("Leads Fechados").getRange(positionLead, 13).setValue(dados.lead.Comissao)
        planilha.getSheetByName("Leads Fechados").getRange(positionLead, 14).setValue(dados.lead.Parcelamento)

      }

      // vamos criar um usuario
    } else if (e.parameter.v == 'criar_usuario') {

      var dados = JSON.parse(e.postData.contents);

      var aba = planilha.getSheetByName("Usuarios").appendRow([
        dados.id,
        dados.usuario,
        dados.nome,
        dados.email,
        dados.senha,
        dados.status,
        dados.tipo
      ])
    } else if (e.parameter.v == 'alterar_usuario') {

      var dados = JSON.parse(e.postData.contents);

      var nomeUsuarioSheet = planilha.getSheetByName("Usuarios").getRange("A2:G").getValues()

      var data = nomeUsuarioSheet.map(function(r) { return parseInt(r[0]); });
      var newdata = data.indexOf(parseInt(dados.usuario.id));

      // caso encontrar o usuario, vamos iserir no lead correspondente
      if (newdata != -1) {
        const positionLead = newdata + 2
        if (dados.usuario.tipo != null) {
          if (dados.usuario.tipo == 'Usuário Comum') {
            planilha.getSheetByName("Usuarios").getRange(positionLead, 7).setValue('Usuario')
          } else {
            planilha.getSheetByName("Usuarios").getRange(positionLead, 7).setValue(dados.usuario.tipo)
          }
        }
        if (dados.usuario.status != null) {
          planilha.getSheetByName("Usuarios").getRange(positionLead, 6).setValue(dados.usuario.status)
        }
        if (dados.usuario.status != null) {
          planilha.getSheetByName("Usuarios").getRange(positionLead, 8).setValue(dados.usuario.status)
        }
      }
    } else if (e.parameter.v == 'criar_lead') {
      var dados = JSON.parse(e.postData.contents);

      var abaDestino = planilha.getSheetByName("Leads Fechados");

      if (!abaDestino) {
        Logger.log("Erro: A aba 'Leads Fechados' não foi encontrada.");
        return ContentService.createTextOutput("Erro: Aba 'Leads Fechados' não encontrada.").setMimeType(ContentService.MimeType.TEXT);
      }

      var novaLinhaLeadFechado = [
        dados.ID,
        dados.name,
        dados.vehicleModel,
        dados.vehicleYearModel,
        dados.city,
        dados.phone,
        dados.insurer,
        dados.Data,
        dados.Responsavel,
        dados.Status
      ];

      abaDestino.appendRow(novaLinhaLeadFechado);

      Logger.log("Novo lead criado com sucesso na aba 'Leads Fechados'. ID: " + dados.ID);
      return ContentService.createTextOutput("Success: Lead criado com sucesso em 'Leads Fechados'.").setMimeType(ContentService.MimeType.TEXT);
    }
  } catch (erro) {
    Logger.log("Erro na função doPost: " + erro.toString());
    return ContentService.createTextOutput("Erro: " + erro).setMimeType(ContentService.MimeType.TEXT);
  }
}

function doGet(e) {
  const IDSPREADSHEET = '1zW0nwLL6H1QjNqXSCPDHmhyFdEfl0_ts_PrT1_lreMc'

  if (e.parameter.v == 'pegar_usuario') {
    var planilha = SpreadsheetApp.openById(IDSPREADSHEET);
    var aba = planilha.getSheetByName("Usuarios");
    var dados = aba.getDataRange().getValues();

    var cabecalho = dados[0];
    var resultado = [];

    for (var i = 1; i < dados.length; i++) {
      var linha = {};
      for (var j = 0; j < cabecalho.length; j++) {
        linha[cabecalho[j]] = String(dados[i][j]);
      }
      resultado.push(linha);
    }


    var resposta = JSON.stringify(resultado);

    return ContentService
      .createTextOutput(resposta)
      .setMimeType(ContentService.MimeType.JSON);

  } else if (e.parameter.v == 'pegar_clientes_fechados') {

    const resultado = joinUsersClosed()

    var resposta = JSON.stringify(resultado);

    return ContentService
      .createTextOutput(resposta)
      .setMimeType(ContentService.MimeType.JSON);

  } else if (e.parameter.v == 'getLeads') {

    const resultado = gerarJSONPersonalizado()

    var resposta = JSON.stringify(resultado);

    return ContentService
      .createTextOutput(resposta)
      .setMimeType(ContentService.MimeType.JSON);

  } else if (e.parameter.v == 'listar_nomes_usuarios') {
    var planilha = SpreadsheetApp.openById(IDSPREADSHEET);
    var abaUsuarios = planilha.getSheetByName("Usuarios");

    if (!abaUsuarios) {
      Logger.log("Erro: Aba 'Usuarios' não encontrada.");
      return ContentService.createTextOutput("Erro: Aba 'Usuarios' não encontrada.").setMimeType(ContentService.MimeType.TEXT);
    }

    // A correção está nesta linha: garantindo que pegamos o intervalo correto
    // Se "nome" é a 3ª coluna, ela é a coluna C. Se o cabeçalho estiver na linha 1, os dados começam na linha 2.
    // getRange(linhaInicial, colunaInicial, numLinhas, numColunas)
    // Então, para a coluna C a partir da linha 2 até a última linha:
    var dadosUsuarios = abaUsuarios.getRange(2, 3, abaUsuarios.getLastRow() - 1, 1).getValues(); // Linha 2, Coluna 3 (C), todas as linhas restantes, 1 coluna

    var nomesUsuarios = [];
    if (dadosUsuarios) {
      // Filtra valores vazios e mapeia para uma lista simples de nomes
      nomesUsuarios = dadosUsuarios.map(function(row) {
        // row é uma array com um único elemento (a célula da coluna C)
        return row[0] ? String(row[0]).trim() : null; // Converte para string e remove espaços
      }).filter(function(name) {
        return name !== null && name !== ""; // Remove nulls e strings vazias
      });
    }

    var resposta = JSON.stringify(nomesUsuarios);
    return ContentService
      .createTextOutput(resposta)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function gerarJSONPersonalizado() {

  var sheet = SpreadsheetApp.openById(IDSPREADSHEET).getSheetByName("Leads"); // sua aba
  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();

  var jsonList = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];

    var editadoValue = row[10] ? row[10] : row[7];

    var editadoValue = row[10] ? formatarDataManual(row[10]) : formatarDataManual(row[7]);

    var rowNumber = i + 1

    var obj = {
      "id": rowNumber,
      "name": row[1],
      "vehiclemodel": row[2],
      "vehicleyearmodel": row[3],
      "city": row[4],
      "phone": row[5],
      "insurancetype": row[6],
      "data": formatarDataManual(row[7]),
      "responsavel": row[8],
      "status": row[9],
      "editado": editadoValue
    };

    jsonList.push(obj);
  }

  Logger.log(JSON.stringify(jsonList, null, 2)); // log formatado
  return jsonList;
}

function formatarDataManual(valor) {
  if (!(valor instanceof Date)) return null;

  var ano = valor.getFullYear();
  var mes = String(valor.getMonth() + 1).padStart(2, '0');
  var dia = String(valor.getDate()).padStart(2, '0');
  var hora = String(valor.getHours()).padStart(2, '0');
  var minuto = String(valor.getMinutes()).padStart(2, '0');
  var segundo = String(valor.getSeconds()).padStart(2, '0');

  return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}.000Z`;
}

function joinUsersClosed() {
  const planilha = SpreadsheetApp.openById(IDSPREADSHEET);

  var abaUsers = planilha.getSheetByName("Usuarios");
  var dadosUsers = abaUsers.getDataRange().getValues();

  var abaLeads = planilha.getSheetByName("Leads Fechados");
  var dadosLeads = abaLeads.getDataRange().getValues();

  var colunasUsers = dadosUsers[0];
  var colunasLeads = dadosLeads[0];

  dadosUsers.shift();
  dadosLeads.shift();

  var mapaUsuarios = {};
  dadosUsers.forEach(function(user) {
    var id = user[2];
    mapaUsuarios[id] = user;
  });

  var dadosCombinados = dadosLeads.map(function(lead) {
    var idUsuario = lead[8];
    var dadosUsuario = mapaUsuarios[idUsuario] || [];

    // Formatando datas nas colunas 7 (índice 6) e 10 (índice 9) se tiverem valor
    if (lead[7]) {
      lead[7] = formatarDataManual(lead[7]);
    }

    var objLead = {};
    colunasLeads.forEach(function(coluna, i) {
      objLead[coluna] = lead[i];
    });

    colunasUsers.forEach(function(coluna, i) {
      objLead[coluna] = dadosUsuario[i] || "";
    });

    return objLead;
  });

  return dadosCombinados;
}

function filterDadosByUser() {

  const planilha = SpreadsheetApp.openById(IDSPREADSHEET);
  // vamos pegar os usuarios ativos....

  var abaUsers = planilha.getSheetByName("Usuarios");
  var dadosUsers = abaUsers.getDataRange().getValues();

  // pegando usuarios ativo e que não são admin
  var usuariosFiltrados = dadosUsers.filter(function(linha, index) {
    // Ignorar o cabeçalho na primeira linha
    if (index === 0) return false;

    var status = linha[5]; // Coluna 6
    var tipo = linha[6];   // Coluna 7

    return status === 'Ativo' && tipo !== 'Admin';
  });

  var abaLeads = planilha.getSheetByName("Leads Fechados");
  var dadosLeads = abaLeads.getDataRange().getValues();


  var resultado = [];

  usuariosFiltrados.forEach(function(nomeUsuario) {
    var leadsDoUsuario = dadosLeads.filter(function(lead) {
      return lead[8] === nomeUsuario[2];
    });

    // Contagem por seguradora
    var contagemSeguradoras = {};
    var somaPremioLiquido = 0;
    var somaComissao = 0;
    var somaParcelamento = 0;
    var qtdParcelamento = 0;
    var qtdLeads = leadsDoUsuario.length;

    leadsDoUsuario.forEach(function(lead) {
      var seguradora = lead[10] || "";
      if (seguradora == 'Porto Seguro') {
        seguradora = 'porto'
      } else if (seguradora == 'Itau Seguros') {
        seguradora = 'itau'
      } else if (seguradora == 'Azul Seguros') {
        seguradora = 'azul'
      } else if (seguradora == "Demais Seguradoras") {
        seguradora = 'demais'
      }
      if (!contagemSeguradoras[seguradora]) {
        contagemSeguradoras[seguradora] = 0;
      }
      contagemSeguradoras[seguradora]++;

      // Soma prêmio líquido (coluna 12)
      var premio = parseFloat(lead[11]) || 0;
      somaPremioLiquido += premio;

      // Soma comissão (coluna 13)
      var comissao = parseFloat(lead[12]) || 0;
      somaComissao += comissao;

      // Soma parcelamento (coluna 14)
      var parcelamentoStr = lead[13];
      if (parcelamentoStr) {
        var parcelamento = parseInt(parcelamentoStr.toString().replace("x", ""), 10);
        if (!isNaN(parcelamento)) {
          somaParcelamento += parcelamento;
          qtdParcelamento++;
        }
      }
    });

    var mediaComissao = qtdLeads > 0 ? somaComissao / qtdLeads : 0;
    var mediaParcelamento = qtdParcelamento > 0 ? somaParcelamento / qtdParcelamento : 0;

    resultado.push({
      usuario: nomeUsuario[2],
      vendas: qtdLeads,
      seguradoras: contagemSeguradoras,
      premioLiquido: somaPremioLiquido.toFixed(2),
      comissao: mediaComissao.toFixed(2),
      parcelamento: mediaParcelamento.toFixed(2)
    });
  });

  // Exibir no log
  Logger.log(resultado);

  return resultado

}
