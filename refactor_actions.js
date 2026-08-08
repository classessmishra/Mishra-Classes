const fs = require('fs');
const path = require('path');

const actionsDir = path.join(__dirname, 'src', 'actions');
const files = fs.readdirSync(actionsDir);

files.forEach(file => {
  if (file.endsWith('.ts')) {
    const filePath = path.join(actionsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip auth.ts and profile.ts as they are already updated or handled manually
    if (file === 'auth.ts' || file === 'profile.ts') return;

    let modified = false;

    // 1. Replace the import
    if (content.includes('import { supabase } from "@/lib/supabase";')) {
      content = content.replace(
        'import { supabase } from "@/lib/supabase";',
        'import { createClient } from "@/utils/supabase/server";'
      );
      modified = true;
    }

    // 2. Inject `const supabase = await createClient();` at the beginning of exported async functions
    // We'll use a regex to find `export async function name(...) {`
    const functionRegex = /export\s+async\s+function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/g;
    
    content = content.replace(functionRegex, (match) => {
      // Don't inject if it's already there (though it shouldn't be)
      modified = true;
      return match + '\n  const supabase = await createClient();';
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Refactored ${file}`);
    }
  }
});
