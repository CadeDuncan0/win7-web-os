import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import puppeteer, { type Browser, type HTTPResponse, type Page } from 'puppeteer'
import { z } from 'zod'

let browser: Browser | null = null
let page: Page | null = null
let lastNavRequestHeaders: Record<string, string> = {}

async function getPage(): Promise<Page> {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({ headless: false, devtools: true })
  }
  if (!page || page.isClosed()) {
    page = await browser.newPage()
    page.on('request', (req) => {
      if (req.isNavigationRequest()) {
        lastNavRequestHeaders = req.headers()
      }
    })
  }
  return page
}

const server = new McpServer({ name: 'proxy-verifier', version: '1.0.0' })

server.tool(
  'navigate',
  'Navigate to a URL and return the full response chain (status codes + redirect locations). Use for matrix rows 1–5, 7.',
  { url: z.string().describe('Absolute URL, e.g. http://localhost:3000/desktop') },
  async ({ url }) => {
    const p = await getPage()
    const chain: { status: number; url: string; location?: string }[] = []
    lastNavRequestHeaders = {}

    const onResponse = (resp: HTTPResponse) => {
      if (!resp.request().isNavigationRequest()) {
        return
      }
      const loc = resp.headers()['location']
      chain.push({ status: resp.status(), url: resp.url(), ...(loc ? { location: loc } : {}) })
    }

    p.on('response', onResponse)
    try {
      await p.goto(url, { waitUntil: 'load' })
    } catch (err) {
      return { content: [{ type: 'text', text: `Navigation error: ${String(err)}` }] }
    } finally {
      p.off('response', onResponse)
    }

    return { content: [{ type: 'text', text: JSON.stringify({ chain }, null, 2) }] }
  }
)

server.tool(
  'list_cookies',
  'List cookies for the current page. Filter by name substring, e.g. "sb-" for Supabase or "portfolio" for guest cookie. Use for row 6.',
  { filter: z.string().optional().describe('Optional name substring filter') },
  async ({ filter }) => {
    const p = await getPage()
    const all = await p.cookies()
    const cookies = filter ? all.filter((c) => c.name.includes(filter)) : all
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            cookies.map(({ name, value, domain, path }) => ({ name, value, domain, path })),
            null,
            2
          ),
        },
      ],
    }
  }
)

server.tool(
  'set_cookie',
  'Write a cookie by name/value on the given domain. Use to forge the Supabase session token to garbage for the row 8 security check.',
  {
    name: z.string().describe('Cookie name, e.g. "sb-<project-ref>-auth-token"'),
    value: z.string().describe('Cookie value — set to arbitrary garbage for the forgery test'),
    domain: z.string().optional().describe('Domain, defaults to localhost'),
  },
  async ({ name, value, domain = 'localhost' }) => {
    const p = await getPage()
    await p.setCookie({ name, value, domain, path: '/' })
    const preview = value.length > 40 ? `${value.slice(0, 40)}…` : value
    return { content: [{ type: 'text', text: `Set ${name}=${preview} on ${domain}` }] }
  }
)

server.tool(
  'delete_cookie',
  'Delete a cookie by name. Use to simulate sign-out and verify the row 7 redirect back to /login.',
  {
    name: z.string(),
    domain: z.string().optional().describe('Domain, defaults to localhost'),
  },
  async ({ name, domain = 'localhost' }) => {
    const p = await getPage()
    await p.deleteCookie({ name, domain })
    return { content: [{ type: 'text', text: `Deleted ${name} from ${domain}` }] }
  }
)

server.tool(
  'get_last_request_headers',
  'Return outgoing request headers captured during the most recent navigate() call. Use to verify the Cookie: header is present on the /desktop request (row 9).',
  {},
  async () => ({
    content: [{ type: 'text', text: JSON.stringify(lastNavRequestHeaders, null, 2) }],
  })
)

const transport = new StdioServerTransport()
await server.connect(transport)
