let db = 'mssql';

const dbs = {
 mssql : {
    fieldPrepend: '[',
    fieldAppend: ']',
    unionFrom: ''
  },
 mysql : {
    fieldPrepend: '`',
    fieldAppend: '`',
    unionFrom: ''
  },
 oracle : {
    fieldPrepend: '"',
    fieldAppend: '"',
    unionFrom: ' FROM DUAL'
  },
};

const query_type = { INSERT: 'INSERT', SELECT: 'SELECT', UPDATE: 'UPDATE', DELETE: 'DELETE', CREATE: 'CREATE' };

const parseExcel = text => text.split('\n').map(l => l.split('\t').filter(r => r)).filter(c => c.length !== 0);

const generateColMarkup = data => {
  $('#cols').empty();
  
  let cols = data[0];
  let testRow = data[1]; 
  
  // TODO: Add date test with moment.
  
  cols.forEach((c,i) => {
    let type = `
        <select id="type" id="type-${i}">
          <option value="INT" ${(!isNaN(testRow[i])) ? 'selected="selected"' : ''}>INT</option>
          <option value="VARCHAR" ${(isNaN(testRow[i])) ? 'selected="selected"' : ''}>VARCHAR</option>
          <option value="VARCHAR2">VARCHAR2</option>
          <option value="DATE">DATE</option>
          <option value="DATETIME">DATETIME</option>
        </select>`;
    
    $('#cols').append(
      `<tr id="col">
        <td>${c}</td>
        <td><input type="text" class="form-control" id="as-${i}" value="${c}" /></td>
        <td>${type}</td>
        <td><input type="text" class="form-control" id="template-${i}" /></td>
        <td><input type="checkbox" value="${i}" id="key-${i}" ${(i === 0) ? 'checked="checked"' : ''} /></td>
        </tr>`);
  });
};

const getKeys = () => {
  let keys = [];
  $('input[id^=key-]:checked').each(function () { keys.push(parseInt($(this).val())); });
  return keys;
}

const getTypes = () => {
  let types = [];
  $('select[id^=type] option:selected').each(function () { types.push($(this).val());  });
  return types;
}

const generateSQL = (table, data, type) => {
  let [prepend, append,union] = [dbs[db].fieldPrepend, dbs[db].fieldAppend, dbs[db].unionFrom];
  let headerRow = data[0];
  let keys = getKeys();
  let types = getTypes();
  let preScript = '';
  
  $('#sql').empty();
  
  console.log(getTypes());
  if (type === query_type.CREATE) {
    cols = headerRow.reduce((h, c, i) => {return h += `\t${dbs[db].fieldPrepend}${c}${dbs[db].fieldAppend} AS ${types[i]}${(i+1 ===  headerRow.length) ? '' : ', '}\n`;
    }, '');
    preScript = `CREATE TABLE ${table}(\n${cols});`;
  }
  $('#sql').append(preScript);
  
  data.shift();
  data.forEach((r,j) => {
    let preStmt = '';
    switch (type) {
      case query_type.SELECT:
        preStmt = 'SELECT ';
        break;
      case query_type.INSERT:
        let cols = headerRow.reduce((h, c, i) => {return h += `${dbs[db].fieldPrepend}${c}${dbs[db].fieldAppend}${(i+1 ===  headerRow.length) ? '' : ', '}`;
        }, '');
        preStmt = `INSERT INTO ${table}(${cols}) VALUES (`;
        break;
      case query_type.UPDATE:
        preStmt = `UPDATE ${table} SET `;
        break;
      case query_type.DELETE:
        preStmt = `DELETE ${table} `;
        break;
    }
    
    $('#sql').append(preStmt);
        
    let where = 'WHERE ';
    r.forEach((c,i) => {
      let quote = isNaN(c) ? `'` : '';
      let as = $(`#as-${i}`).val();
      let template = $(`#template-${i}`).val();
      let content = template.replace(/{f}/g , c) || c;
	  content = `${quote}${quote ? content.replace(/'/g , "''") : content}${quote}`;
      as = `${prepend}${as}${append}`;
      let inner = `${as} = ${content}`;
      where += keys.includes(i) ? `${(keys[0] !== i) ? ' AND ' : ''}` + inner : '';
      
      let stmt = '';
      switch (type) {
        case query_type.SELECT:
          stmt = `${content} AS ${as}${(i+1 === r.length) ? '' : ', '}`;
          break;
        case query_type.INSERT:
          stmt = `${content}${(i+1 === r.length) ? '' : ', '}`;
          break;
        case query_type.UPDATE:
          stmt = `${inner}${(i+1 === r.length) ? '' : ', '}`;
          break;
      }
      $('#sql').append(stmt);
    });
    
    let postStmt = '';
    switch (type) {
      case query_type.SELECT:
        postStmt = `${(j+1 === data.length) ? '' : union + '\nUNION ALL '}\n`;
        break;
      case query_type.INSERT:
        postStmt = '); \n';
        break;
      case query_type.DELETE:
      case query_type.UPDATE:
        postStmt = ` ${where}; \n`;
        break;
    }
    $('#sql').append(postStmt);
          
  });
};

$('#excel').on('change', () => {
  let data = parseExcel($('#excel').val());
  if (data.length > 2)
    generateColMarkup(data);
});

$('#convert').on('click', () => { 
  let data = parseExcel($('#excel').val());
  if (data.length > 1)
    generateSQL('table_name', data, query_type[$('input:radio[name="querytype"]:checked').val()]);
});

$('#dbname').on('change', () => {
  db = $('#dbname').val();
});

$(function () {
  $('[data-toggle="tooltip"]').tooltip()
});