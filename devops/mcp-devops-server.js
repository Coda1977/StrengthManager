
#!/usr/bin/env node

/**
 * MCP DevOps Server
 * 
 * A custom Model Context Protocol server that provides tools for managing
 * Vercel, GoDaddy, Resend, and Supabase integrations.
 * 
 * This server exposes tools that Claude Code can call directly to:
 * - Deploy and manage Vercel projects
 * - Configure DNS records in GoDaddy
 * - Set up email domains in Resend
 * - Monitor Supabase health and migrations
 * - Orchestrate unified deployments
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { execSync } from 'child_process';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
let config = {};
try {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (error) {
  console.error('Warning: Could not load config.json:', error.message);
}

// Utility function for making HTTPS requests
function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Vercel API helpers
async function vercelAPI(endpoint, method = 'GET', data = null) {
  const options = {
    hostname: 'api.vercel.com',
    path: endpoint,
    method: method,
    headers: {
      'Authorization': `Bearer ${config.vercel?.token}`,
      'Content-Type': 'application/json'
    }
  };

  return await httpsRequest(options, data);
}

// GoDaddy API helpers
async function godaddyAPI(endpoint, method = 'GET', data = null) {
  const options = {
    hostname: 'api.godaddy.com',
    path: `/v1${endpoint}`,
    method: method,
    headers: {
      'Authorization': `sso-key ${config.godaddy?.key}:${config.godaddy?.secret}`,
      'Content-Type': 'application/json'
    }
  };

  return await httpsRequest(options, data);
}

// Resend API helpers
async function resendAPI(endpoint, method = 'GET', data = null) {
  const options = {
    hostname: 'api.resend.com',
    path: endpoint,
    method: method,
    headers: {
      'Authorization': `Bearer ${config.resend?.apiKey}`,
      'Content-Type': 'application/json'
    }
  };

  return await httpsRequest(options, data);
}

// Execute shell command safely
function execCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
}

// Tool implementations
const tools = {
  // Vercel Tools
  async vercel_deploy({ projectPath = '.', production = false }) {
    const prodFlag = production ? '--prod' : '';
    const result = execCommand(`cd ${projectPath} && vercel ${prodFlag}`);
    
    if (result.success) {
      return {
        success: true,
        message: 'Deployment initiated successfully',
        url: result.output.trim(),
        output: result.output
      };
    }
    
    return {
      success: false,
      error: result.error,
      stderr: result.stderr
    };
  },

  async vercel_deployment_status({ deploymentId }) {
    try {
      const response = await vercelAPI(`/v13/deployments/${deploymentId}`);
      
      if (response.statusCode === 200) {
        return {
          success: true,
          deployment: response.body
        };
      }
      
      return {
        success: false,
        error: `API returned status ${response.statusCode}`,
        body: response.body
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  async vercel_logs({ deploymentId, limit = 100 }) {
    try {
      const response = await vercelAPI(
        `/v2/deployments/${deploymentId}/events?limit=${limit}`
      );
      
      if (response.statusCode === 200) {
        return {
          success: true,
          logs: response.body
        };
      }
      
      return {
        success: false,
        error: `API returned status ${response.statusCode}`,
        body: response.body
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  async vercel_list_domains({ projectId }) {
    try {
      const response = await vercelAPI(`/v9/projects/${projectId}/domains`);
      
      if (response.statusCode === 200) {
        return {
          success: true,
          domains: response.body.domains || []
        };
      }
      
      return {
        success: false,
        error: `API returned status ${response.statusCode}`,
        body: response.body
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  async vercel_add_domain({ projectId, domain }) {
    try {
      const response = await vercelAPI(
        `/v10/projects/${projectId}/domains`,
        'POST',
        { name: domain }
      );
      
      if (response.statusCode === 200 || response.statusCode === 201) {
        return {
          success: true,
          domain: response.body
        };
      }
      
      return {
        success: false,
        error: `API returned status ${response.statusCode}`,
        body: response.body
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  async vercel_env_vars({ projectId, action = 'list', key, value, target = ['production', 'preview', 'development'] }) {
    try {
      if (action === 'list') {
        const response = await vercelAPI(`/v9/projects/${projectId}/env`);
        return {
          success: response.statusCode === 200,
          envVars: response.body?.envs || [],
          error: response.statusCode !== 200 ? response.body : null
        };
      }
      
      if (action === 'add') {
        const response = await vercelAPI(
          `/v10/projects/${projectId}/env`,
          'POST',
          { key, value, target, type: 'encrypted' }
        );
        return {
          success: response.statusCode === 200 || response.statusCode === 201,
          envVar: response.body,
          error: response.statusCode >= 400 ? response.body : null
        };
      }
      
      if (action === 'delete') {
        const response = await vercelAPI(
          `/v9/projects/${projectId}/env/${key}`,
          'DELETE'
        );
        return {
          success: response.statusCode === 200 || response.statusCode === 204,
          error: response.statusCode >= 400 ? response.body : null
        };
      }
      
      return {
        success: false,
        error: `Unknown action: ${action}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // GoDaddy Tools
  async godaddy_list_dns({ domain }) {
    try {
      const response = await godaddyAPI(`/domains/${domain}/records`);
      
      if (response.statusCode === 200) {
        return {
          success: true,
          records: response.body
        };
      }
      
      return {
        success: false,
        error: `API returned status ${response.statusCode}`,
        body: response.body
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  async godaddy_update_dns({ domain, records }) {
    try {
      const response = await godaddyAPI(
        `/domains/${domain}/records`,
        'PATCH',
        records
      );
      
      if (response.statusCode === 200) {
        return {
          success: true,
          message: 'DNS records updated successfully'
        };
      }
      
      return {
        success: false,
        error: `API returned status ${response.statusCode}`,
        body: response.body
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  async godaddy_add_dns({ domain, type, name, data, ttl = 3600, priority = 0 }) {
    try {
      const record = { type, name, data, ttl };
      if (type === 'MX') record.priority = priority;
      
      const response = await godaddyAPI(
        `/domains/${domain}/records`,
        'PATCH',
        [record]
      );
      
      if (response.statusCode === 200) {
        return {
          success: true,
          message: 'DNS record added successfully',
          record
        };
      }
      
      return {
        success: false,
        error: `API returned status ${response.statusCode}`,
        body: response.body
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Resend Tools
  async resend_add_domain({ domain }) {
    try {
      const response = await resendAPI('/domains', 'POST', { name: domain });
      
      if (response.statusCode === 201) {
        return {
          success: true,
          domain: response.body
        };
      }
      
      return {
        success: false,
        error: `API returned status ${response.statusCode}`,
        body: response.body
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  async resend_verify_domain({ domainId }) {
    try {
      const response = await resendAPI(`/domains/${domainId}/verify`, 'POST');
      
      if (response.statusCode === 200) {
        return {
          success: true,
          verification: response.body
        };
      }
      
      return {
        success: false,
        error: `API returned status ${response.statusCode}`,
        body: response.body
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  async resend_list_domains() {
    try {
      const response = await resendAPI('/domains');
      
      if (response.statusCode === 200) {
        return {
          success: true,
          domains: response.body.data || []
        };
      }
      
      return {
        success: false,
        error: `API returned status ${response.statusCode}`,
        body: response.body
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Supabase Tools
  async supabase_status({ projectRef }) {
    const result = execCommand(`supabase status --project-ref ${projectRef}`);
    return {
      success: result.success,
      output: result.output,
      error: result.error
    };
  },

  async supabase_migrations({ action = 'list', projectRef }) {
    const commands = {
      list: `supabase migration list --project-ref ${projectRef}`,
      up: `supabase db push --project-ref ${projectRef}`,
      status: `supabase migration repair --status --project-ref ${projectRef}`
    };
    
    const result = execCommand(commands[action] || commands.list);
    return {
      success: result.success,
      output: result.output,
      error: result.error
    };
  },

  async supabase_health({ projectUrl }) {
    try {
      const url = new URL('/rest/v1/', projectUrl);
      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'GET',
        headers: {
          'apikey': config.supabase?.anonKey || ''
        }
      };
      
      const response = await httpsRequest(options);
      
      return {
        success: response.statusCode === 200,
        statusCode: response.statusCode,
        healthy: response.statusCode === 200
      };
    } catch (error) {
      return {
        success: false,
        healthy: false,
        error: error.message
      };
    }
  },

  // Orchestration Tools
  async deploy_full_stack({ projectPath = '.', domain, production = false }) {
    const results = {
      steps: [],
      success: true
    };

    // Step 1: Deploy to Vercel
    results.steps.push({ step: 'vercel_deploy', status: 'starting' });
    const deployResult = await tools.vercel_deploy({ projectPath, production });
    results.steps[0].status = deployResult.success ? 'success' : 'failed';
    results.steps[0].result = deployResult;
    
    if (!deployResult.success) {
      results.success = false;
      return results;
    }

    // Extract deployment ID from URL
    const deploymentUrl = deployResult.url;
    const deploymentId = deploymentUrl.split('/').pop()?.split('-').pop();

    // Step 2: Wait for deployment to complete
    if (deploymentId) {
      results.steps.push({ step: 'wait_for_deployment', status: 'starting' });
      let attempts = 0;
      let deployed = false;
      
      while (attempts < 30 && !deployed) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
        const status = await tools.vercel_deployment_status({ deploymentId });
        
        if (status.success && status.deployment.readyState === 'READY') {
          deployed = true;
          results.steps[1].status = 'success';
          results.steps[1].result = status;
        }
        attempts++;
      }
      
      if (!deployed) {
        results.steps[1].status = 'timeout';
        results.success = false;
      }
    }

    // Step 3: Configure domain if provided
    if (domain && config.vercel?.projectId) {
      results.steps.push({ step: 'configure_domain', status: 'starting' });
      const domainResult = await tools.vercel_add_domain({
        projectId: config.vercel.projectId,
        domain
      });
      results.steps[2].status = domainResult.success ? 'success' : 'failed';
      results.steps[2].result = domainResult;
    }

    return results;
  },

  async sync_dns_records({ domain, vercelProjectId }) {
    const results = {
      steps: [],
      success: true
    };

    // Get Vercel domain configuration
    results.steps.push({ step: 'get_vercel_config', status: 'starting' });
    const vercelDomains = await tools.vercel_list_domains({ projectId: vercelProjectId });
    results.steps[0].status = vercelDomains.success ? 'success' : 'failed';
    results.steps[0].result = vercelDomains;

    if (!vercelDomains.success) {
      results.success = false;
      return results;
    }

    // Find the domain configuration
    const domainConfig = vercelDomains.domains.find(d => d.name === domain);
    
    if (!domainConfig) {
      results.success = false;
      results.error = 'Domain not found in Vercel project';
      return results;
    }

    // Update GoDaddy DNS records
    results.steps.push({ step: 'update_godaddy_dns', status: 'starting' });
    
    const dnsRecords = [];
    if (domainConfig.verification) {
      dnsRecords.push({
        type: 'TXT',
        name: '_vercel',
        data: domainConfig.verification[0].value,
        ttl: 3600
      });
    }

    // Add A record pointing to Vercel
    dnsRecords.push({
      type: 'A',
      name: '@',
      data: '76.76.21.21', // Vercel's IP
      ttl: 3600
    });

    const dnsResult = await tools.godaddy_update_dns({ domain, records: dnsRecords });
    results.steps[1].status = dnsResult.success ? 'success' : 'failed';
    results.steps[1].result = dnsResult;

    if (!dnsResult.success) {
      results.success = false;
    }

    return results;
  }
};

// Create MCP server
const server = new Server(
  {
    name: 'devops-orchestrator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'vercel_deploy',
        description: 'Deploy a project to Vercel',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the project directory (default: current directory)',
            },
            production: {
              type: 'boolean',
              description: 'Deploy to production (default: false)',
            },
          },
        },
      },
      {
        name: 'vercel_deployment_status',
        description: 'Get the status of a Vercel deployment',
        inputSchema: {
          type: 'object',
          properties: {
            deploymentId: {
              type: 'string',
              description: 'The deployment ID',
            },
          },
          required: ['deploymentId'],
        },
      },
      {
        name: 'vercel_logs',
        description: 'Get logs from a Vercel deployment',
        inputSchema: {
          type: 'object',
          properties: {
            deploymentId: {
              type: 'string',
              description: 'The deployment ID',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of log entries (default: 100)',
            },
          },
          required: ['deploymentId'],
        },
      },
      {
        name: 'vercel_list_domains',
        description: 'List all domains for a Vercel project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The Vercel project ID',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'vercel_add_domain',
        description: 'Add a domain to a Vercel project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The Vercel project ID',
            },
            domain: {
              type: 'string',
              description: 'The domain name to add',
            },
          },
          required: ['projectId', 'domain'],
        },
      },
      {
        name: 'vercel_env_vars',
        description: 'Manage environment variables for a Vercel project',
        inputSchema: {
          type: 'object',
          properties: {
            projectId: {
              type: 'string',
              description: 'The Vercel project ID',
            },
            action: {
              type: 'string',
              enum: ['list', 'add', 'delete'],
              description: 'Action to perform (default: list)',
            },
            key: {
              type: 'string',
              description: 'Environment variable key (required for add/delete)',
            },
            value: {
              type: 'string',
              description: 'Environment variable value (required for add)',
            },
            target: {
              type: 'array',
              items: { type: 'string' },
              description: 'Target environments (default: all)',
            },
          },
          required: ['projectId'],
        },
      },
      {
        name: 'godaddy_list_dns',
        description: 'List DNS records for a GoDaddy domain',
        inputSchema: {
          type: 'object',
          properties: {
            domain: {
              type: 'string',
              description: 'The domain name',
            },
          },
          required: ['domain'],
        },
      },
      {
        name: 'godaddy_update_dns',
        description: 'Update DNS records for a GoDaddy domain',
        inputSchema: {
          type: 'object',
          properties: {
            domain: {
              type: 'string',
              description: 'The domain name',
            },
            records: {
              type: 'array',
              description: 'Array of DNS records to update',
            },
          },
          required: ['domain', 'records'],
        },
      },
      {
        name: 'godaddy_add_dns',
        description: 'Add a DNS record to a GoDaddy domain',
        inputSchema: {
          type: 'object',
          properties: {
            domain: {
              type: 'string',
              description: 'The domain name',
            },
            type: {
              type: 'string',
              description: 'Record type (A, CNAME, TXT, MX, etc.)',
            },
            name: {
              type: 'string',
              description: 'Record name',
            },
            data: {
              type: 'string',
              description: 'Record data',
            },
            ttl: {
              type: 'number',
              description: 'Time to live in seconds (default: 3600)',
            },
            priority: {
              type: 'number',
              description: 'Priority for MX records (default: 0)',
            },
          },
          required: ['domain', 'type', 'name', 'data'],
        },
      },
      {
        name: 'resend_add_domain',
        description: 'Add a domain to Resend',
        inputSchema: {
          type: 'object',
          properties: {
            domain: {
              type: 'string',
              description: 'The domain name',
            },
          },
          required: ['domain'],
        },
      },
      {
        name: 'resend_verify_domain',
        description: 'Verify a domain in Resend',
        inputSchema: {
          type: 'object',
          properties: {
            domainId: {
              type: 'string',
              description: 'The Resend domain ID',
            },
          },
          required: ['domainId'],
        },
      },
      {
        name: 'resend_list_domains',
        description: 'List all domains in Resend',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'supabase_status',
        description: 'Get Supabase project status',
        inputSchema: {
          type: 'object',
          properties: {
            projectRef: {
              type: 'string',
              description: 'The Supabase project reference',
            },
          },
          required: ['projectRef'],
        },
      },
      {
        name: 'supabase_migrations',
        description: 'Manage Supabase migrations',
        inputSchema: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['list', 'up', 'status'],
              description: 'Migration action (default: list)',
            },
            projectRef: {
              type: 'string',
              description: 'The Supabase project reference',
            },
          },
          required: ['projectRef'],
        },
      },
      {
        name: 'supabase_health',
        description: 'Check Supabase project health',
        inputSchema: {
          type: 'object',
          properties: {
            projectUrl: {
              type: 'string',
              description: 'The Supabase project URL',
            },
          },
          required: ['projectUrl'],
        },
      },
      {
        name: 'deploy_full_stack',
        description: 'Orchestrate a full deployment: Vercel deploy, wait for completion, configure domain',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the project directory',
            },
            domain: {
              type: 'string',
              description: 'Domain to configure (optional)',
            },
            production: {
              type: 'boolean',
              description: 'Deploy to production',
            },
          },
        },
      },
      {
        name: 'sync_dns_records',
        description: 'Sync DNS records between Vercel and GoDaddy',
        inputSchema: {
          type: 'object',
          properties: {
            domain: {
              type: 'string',
              description: 'The domain name',
            },
            vercelProjectId: {
              type: 'string',
              description: 'The Vercel project ID',
            },
          },
          required: ['domain', 'vercelProjectId'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (tools[name]) {
      const result = await tools[name](args || {});
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: `Unknown tool: ${name}`,
          }),
        },
      ],
      isError: true,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack,
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('DevOps MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});