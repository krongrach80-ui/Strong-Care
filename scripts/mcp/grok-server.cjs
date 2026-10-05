#!/usr/bin/env node
/**
 * Grok MCP Server for Antigravity IDE
 * Provides an MCP tool 'ask_grok' to query xAI's Grok models.
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

function sendResponse(id, result, error = null) {
  const response = {
    jsonrpc: '2.0',
    id: id,
  };
  if (error) {
    response.error = error;
  } else {
    response.result = result;
  }
  process.stdout.write(JSON.stringify(response) + '\n');
}

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let message;
  try {
    message = JSON.parse(trimmed);
  } catch (err) {
    return;
  }

  const { id, method, params } = message;

  if (method === 'initialize') {
    sendResponse(id, {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: 'grok-mcp-server',
        version: '1.0.0',
      },
    });
    return;
  }

  if (method === 'notifications/initialized') {
    return;
  }

  if (method === 'ping') {
    sendResponse(id, {});
    return;
  }

  if (method === 'tools/list') {
    sendResponse(id, {
      tools: [
        {
          name: 'ask_grok',
          description:
            'Ask xAI Grok (grok-2-latest) for coding help, architecture recommendations, debugging, or code review. Use this tool whenever the user requests Grok assistance.',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: {
                type: 'string',
                description: 'The question, task prompt, or code snippet to send to Grok.',
              },
              system_instruction: {
                type: 'string',
                description:
                  'Optional instructions for Grok behavior or role (e.g. "Senior Software Architect").',
              },
              model: {
                type: 'string',
                description: 'Optional model name (defaults to "grok-2-latest" or "grok-beta").',
              },
            },
            required: ['prompt'],
          },
        },
      ],
    });
    return;
  }

  if (method === 'tools/call') {
    const toolName = params?.name;
    const args = params?.arguments || {};

    if (toolName === 'ask_grok') {
      const apiKey = process.env.XAI_API_KEY || '';
      if (!apiKey || apiKey === 'YOUR_XAI_API_KEY_HERE') {
        sendResponse(id, {
          content: [
            {
              type: 'text',
              text: '⚠️ XAI_API_KEY is not configured yet. Please set your xAI API Key in mcp_config.json under mcpServers.grok.env.XAI_API_KEY.',
            },
          ],
        });
        return;
      }

      const model = args.model || process.env.XAI_MODEL || 'grok-2-latest';
      const prompt = args.prompt || '';
      const systemInstruction =
        args.system_instruction ||
        'You are Grok, an advanced AI developed by xAI, acting as an expert pair programmer and software architect.';

      try {
        const payload = {
          model: model,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt },
          ],
          temperature: 0.7,
        };

        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errText = await res.text();
          sendResponse(id, {
            content: [
              {
                type: 'text',
                text: `❌ xAI API Error (Status ${res.status}): ${errText}`,
              },
            ],
            isError: true,
          });
          return;
        }

        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || 'No content returned from Grok.';

        sendResponse(id, {
          content: [
            {
              type: 'text',
              text: reply,
            },
          ],
        });
      } catch (err) {
        sendResponse(id, {
          content: [
            {
              type: 'text',
              text: `❌ Connection Error: ${err.message}`,
            },
          ],
          isError: true,
        });
      }
      return;
    }

    sendResponse(id, null, {
      code: -32601,
      message: `Tool not found: ${toolName}`,
    });
    return;
  }

  if (id !== undefined) {
    sendResponse(id, null, {
      code: -32601,
      message: `Method not found: ${method}`,
    });
  }
});
