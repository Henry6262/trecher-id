import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Use Groq for speed (latency is law)
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * AI Assistant API for Trench-ID / X-Pro Extension.
 * Provides data-grounded reasoning about traders and tokens.
 */
export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();
    const { handle, mint } = context || {};

    let dataContext = '';

    // 1. If a handle is detected, pull their stats from DB
    if (handle) {
      const user = await prisma.user.findUnique({
        where: { username: handle },
        include: {
          rankings: { where: { period: '7d' }, take: 1 },
          wallets: { include: { trades: { take: 5, orderBy: { lastTradeAt: 'desc' } } } }
        }
      });

      if (user) {
        const rank = user.rankings[0]?.rank || 'Unranked';
        const trades = user.wallets.flatMap(w => w.trades);
        dataContext += `[VERIFIED DATA FOR @${handle}]:
- Current Rank: #${rank}
- Recent Trades: ${trades.map(t => `${t.tokenSymbol} (PnL: ${t.pnlSol.toFixed(2)} SOL)`).join(', ')}
`;
      }
    }

    // 2. If a token mint is detected, pull holder info
    if (mint) {
      const trades = await prisma.walletTrade.findMany({
        where: { tokenMint: mint, pnlSol: { gt: 0 } },
        include: { wallet: { include: { user: true } } },
        take: 3
      });

      if (trades.length > 0) {
        dataContext += `\n[VERIFIED DATA FOR TOKEN ${mint}]:
- Smart Money: ${trades.map(t => `@${t.wallet.user.username}`).join(', ')} are currently in profit on this token.
`;
      }
    }

    // 3. Construct the prompt for Groq
    const systemPrompt = `You are "Degen Oracle", the AI assistant for web3me.
Your goal is to provide verified, data-grounded alpha. 
Never larp. If you don't have data, say so.
Current Date: ${new Date().toISOString()}

${dataContext}

Answer the user's query based on the data provided above. Keep it brief, professional, and degen-friendly.`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.2,
        max_tokens: 500
      })
    });

    const aiData = await response.json();
    return NextResponse.json({ 
      answer: aiData.choices[0]?.message?.content || "I couldn't process that query, fam.",
      contextUsed: dataContext !== ''
    });

  } catch (error) {
    console.error('[API_CHAT_POST] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
