const fs = require('fs');
const report = JSON.parse(fs.readFileSync('C:/Users/utsav sharma/Desktop/Mishra Classess/lint_report.json', 'utf8'));

const hookErrors = {};
report.forEach(file => {
  const hooksIssues = file.messages.filter(m => m.ruleId && m.ruleId.startsWith('react-hooks/'));
  if (hooksIssues.length > 0) {
    hookErrors[file.filePath] = hooksIssues.map(i => ({ rule: i.ruleId, line: i.line }));
  }
});

console.log(JSON.stringify(hookErrors, null, 2));
