const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Find all instances of useState that read from localStorage
  const regex = /const \[([a-zA-Z0-9_]+), ([a-zA-Z0-9_]+)\] = useState(?:<[^>]+>)?\(\(\) => \{\s*if \(typeof window !== 'undefined'\) \{\s*try \{\s*(?:const [a-zA-Z0-9_]+ = )?localStorage\.getItem\('([^']+)'\);\s*return [^;]+;\s*\} catch\([^\)]+\) \{\}\s*\}\s*return ([^;]+);\s*\}\);/g;
  
  let match;
  let useStates = [];
  let useEffects = [];
  
  // It's a bit tricky with full regex because some have intermediate logic (like "const cached = ... return cached ? ...").
  // Let's do a simpler approach: replace the specific pattern we know.
  // We know the pattern is:
  /*
  const [var, setVar] = useState<Type>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('...');
        return cached ? JSON.parse(cached) : DEFAULT;
      } catch(e) {}
    }
    return DEFAULT;
  });
  */
  
  // We'll just print out files that have this to know which ones to fix manually.
  if (content.includes("if (typeof window !== 'undefined') {") && content.includes("localStorage.getItem")) {
    console.log("Found in: " + filePath);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    let full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      processFile(full);
    }
  });
}

walk('src/app');
