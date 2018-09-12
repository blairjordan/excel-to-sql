let db = 'mssql';

const dbs = {
 mssql : {
    fieldPrepend: '[',
    fieldAppend: ']',
  },
 mysql : {
    fieldPrepend: '`',
    fieldAppend: '`',
  },
 oracle : {
    fieldPrepend: '"',
    fieldAppend: '"',
  },
};

const parseExcel = text => text.split('\n').map(l => l.split('\t').filter(r => r)).filter(c => c.length !== 0);

const generateColMarkup = cols => {
  $('#cols').empty();
  cols.forEach((c,i) => {
    $('#cols').append(
      `<tr id="col">
       <td>${c}</td>
       <td><input type="text" class="form-control" id="as-${i}" value="${c}" /></td>
       <td><input type="text" class="form-control" id="template-${i}" /></td>
       </tr>`);
  });
};

const generateSQL = data => {
  $('#sql').empty();
  data.shift();
  data.forEach((r,j) => {
    $('#sql').append('SELECT ');
    r.forEach((c,i) => {
      let quote = isNaN(c) ? `'` : '';
      let as = $(`#as-${i}`).val();
      let template = $(`#template-${i}`).val();
      $('#sql').append(`${quote}${template.replace(/{f}/g , c) || c}${quote} AS ${dbs[db].fieldPrepend}${as}${dbs[db].fieldAppend}${(i+1 === r.length) ? '' : ', '}`);
    });
     $('#sql').append(`${(j+1 === data.length) ? '' : '\nUNION ALL'}\n`);
  });
};

$('#excel').on('change', () => {
  let data = parseExcel($('#excel').val());
  if (data.length > 1)
    generateColMarkup(data[0]);
});

$('#convert').on('click', () => { 
  let data = parseExcel($('#excel').val());
  if (data.length > 1)
    generateSQL(data);
});

$('#dbname').on('change', () => {
  db = $('#dbname').val();
});

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
});