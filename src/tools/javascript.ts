/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { z } from 'zod';
import { defineTool, type ToolFactory } from './tool.js';

const executeJavaScript: ToolFactory = captureSnapshot => defineTool({
  capability: 'core',

  schema: {
    name: 'browser_execute_js',
    title: 'Execute JavaScript',
    description: 'Execute JavaScript code in the browser context and return the result',
    inputSchema: z.object({
      code: z.string().describe('JavaScript code to execute in the browser context')
    }),
    type: 'destructive', // Since JS can modify page state
  },

  handle: async (context, params) => {
    const tab = context.currentTabOrDie();
    
    const code = [
      `// Execute JavaScript code`,
      `const result = await page.evaluate(() => {`,
      `  ${params.code}`,
      `});`,
      `console.log('JavaScript execution result:', result);`
    ];

    const action = async () => {
      try {
        const result = await tab.page.evaluate(params.code);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ 
              success: true, 
              result: result,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text" as const, 
            text: JSON.stringify({
              success: false,
              error: errorMessage,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      }
    };

    return {
      code,
      action,
      captureSnapshot,
      waitForNetwork: false,
    };
  },
});

export default (captureSnapshot: boolean) => [executeJavaScript(captureSnapshot)]; 