const fs = require('fs');
const path = require('path');

const API_ROUTES = [
  'src/app/api/razorpay/callback/route.ts',
  'src/app/api/razorpay/create-order/route.ts',
  'src/app/api/razorpay/verify/route.ts',
  'src/app/api/debug/route.ts',
  'src/app/api/debug-schema/route.ts',
  'src/app/api/fix-db/route.ts'
];

const SERVER_LAYOUTS = [
  'src/app/(dashboard)/admin/layout.tsx',
  'src/app/(dashboard)/teacher/layout.tsx',
  'src/components/student/MobileTopBar.tsx' // Uses dynamic import
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  const forwardPath = filePath.replace(/\\/g, '/');
  let changed = false;

  if (API_ROUTES.some(r => forwardPath.endsWith(r))) {
    // API Route - replace with Admin Client
    if (content.includes('import { supabase } from "@/lib/supabase"')) {
      content = content.replace(
        /import \{ supabase \} from "@\/lib\/supabase";?/g,
        `import { createClient } from "@supabase/supabase-js";\n\nconst supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";\nconst supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";\nconst supabase = createClient(supabaseUrl, supabaseServiceKey);`
      );
      changed = true;
    }
    if (content.includes("import { supabase } from '@/lib/supabase'")) {
      content = content.replace(
        /import \{ supabase \} from '@\/lib\/supabase';?/g,
        `import { createClient } from "@supabase/supabase-js";\n\nconst supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";\nconst supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";\nconst supabase = createClient(supabaseUrl, supabaseServiceKey);`
      );
      changed = true;
    }
  } else if (SERVER_LAYOUTS.some(r => forwardPath.endsWith(r))) {
    if (content.includes('import { supabase } from "@/lib/supabase"')) {
      content = content.replace(
        /import \{ supabase \} from "@\/lib\/supabase";?/g,
        'import { createClient } from "@/utils/supabase/server";\n// Note: You must call `await createClient()` inside the server component'
      );
      changed = true;
    }
    // Handle dynamic import
    if (content.includes('const { supabase } = await import("@/lib/supabase")')) {
      content = content.replace(
        /const \{ supabase \} = await import\("@\/lib\/supabase"\);?/g,
        'const { createClient } = await import("@/utils/supabase/server");\n        const supabase = await createClient();'
      );
      changed = true;
    }
    if (content.includes("const { supabase } = await import('@/lib/supabase')")) {
      content = content.replace(
        /const \{ supabase \} = await import\('@\/lib\/supabase'\);?/g,
        "const { createClient } = await import('@/utils/supabase/client');\n      const supabase = createClient();"
      );
      changed = true;
    }
  } else {
    // Client Component
    if (content.includes('import { supabase } from "@/lib/supabase"')) {
      content = content.replace(
        /import \{ supabase \} from "@\/lib\/supabase";?/g,
        'import { createClient } from "@/utils/supabase/client";\nconst supabase = createClient();'
      );
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

const baseDir = path.join(__dirname, 'src');
processDirectory(baseDir);
console.log('Done.');
