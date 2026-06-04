import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import OpenAI from 'openai';

const router = Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Mock database schemas and datasets for the onboarding/analytics context
const MOCK_SCHEMAS: Record<string, string> = {
  'sales': 'table name: sales, columns: [month (text), revenue (numeric), orders (integer)]',
  'products': 'table name: products, columns: [name (text), sales (integer), return_rate (numeric)]',
  'customers': 'table name: customers, columns: [customer_name (text), lifetime_value (numeric), signups (integer)]',
  'orders': 'table name: orders, columns: [quarter (text), sales (numeric)]'
};

// POST /api/query/nl
router.post('/nl', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { question, dataset_id } = req.body;

  if (!question || !dataset_id) {
    return res.status(400).json({ error: 'Question and dataset_id are required.' });
  }

  // Safety checks (reject DROP, DELETE, UPDATE, INSERT, ALTER)
  const unsafePatterns = /\b(drop|delete|update|insert|alter|truncate)\b/i;
  if (unsafePatterns.test(question)) {
    return res.status(400).json({ error: 'Unsafe operation detected. Only SELECT queries are permitted.' });
  }

  // 1. Check if it's one of the standard mock questions to guarantee zero-setup interactivity
  const normalizedQuestion = question.toLowerCase().trim();

  // Matcher for "Show me revenue by month this year"
  if (normalizedQuestion.includes('revenue by month') || normalizedQuestion.includes('revenue by month this year')) {
    return res.json({
      sql: 'SELECT month, SUM(revenue) AS monthly_revenue FROM sales GROUP BY month ORDER BY month_index;',
      columns: ['month', 'monthly_revenue'],
      rows: [
        { month: 'Jan', monthly_revenue: 15200 },
        { month: 'Feb', monthly_revenue: 18400 },
        { month: 'Mar', monthly_revenue: 22100 },
        { month: 'Apr', monthly_revenue: 24500 },
        { month: 'May', monthly_revenue: 28900 },
        { month: 'Jun', monthly_revenue: 31200 },
        { month: 'Jul', monthly_revenue: 35600 },
        { month: 'Aug', monthly_revenue: 38900 },
        { month: 'Sep', monthly_revenue: 41200 },
        { month: 'Oct', monthly_revenue: 45600 },
        { month: 'Nov', monthly_revenue: 49800 },
        { month: 'Dec', monthly_revenue: 53200 }
      ],
      chart_type_suggestion: 'line'
    });
  }

  // Matcher for "Which product has the highest return rate?"
  if (normalizedQuestion.includes('highest return rate') || normalizedQuestion.includes('return rate')) {
    return res.json({
      sql: 'SELECT name, return_rate FROM products ORDER BY return_rate DESC LIMIT 10;',
      columns: ['name', 'return_rate'],
      rows: [
        { name: 'Anomaly Real-time Engine', return_rate: 8.4 },
        { name: 'Cloud Core subscription', return_rate: 6.2 },
        { name: 'ML Forecast Add-on', stroke: 5.8, return_rate: 5.8 },
        { name: 'Custom DB Sync Connector', return_rate: 4.1 },
        { name: 'Data Pipeline API key', return_rate: 2.8 }
      ],
      chart_type_suggestion: 'bar'
    });
  }

  // Matcher for "Compare sales between Q1 and Q2"
  if (normalizedQuestion.includes('q1 and q2') || normalizedQuestion.includes('compare sales')) {
    return res.json({
      sql: 'SELECT quarter, SUM(sales) AS total_sales FROM orders GROUP BY quarter;',
      columns: ['quarter', 'total_sales'],
      rows: [
        { quarter: 'Q1', total_sales: 55700 },
        { quarter: 'Q2', total_sales: 95700 }
      ],
      chart_type_suggestion: 'bar'
    });
  }

  // Matcher for "Top 5 customers by lifetime value"
  if (normalizedQuestion.includes('top 5 customers') || normalizedQuestion.includes('lifetime value')) {
    return res.json({
      sql: 'SELECT customer_name, lifetime_value FROM customers ORDER BY lifetime_value DESC LIMIT 5;',
      columns: ['customer_name', 'lifetime_value'],
      rows: [
        { customer_name: 'Acme Systems', lifetime_value: 45000 },
        { customer_name: 'Globex Corp', lifetime_value: 38000 },
        { customer_name: 'Initech Inc', lifetime_value: 32000 },
        { customer_name: 'Umbrella Corp', lifetime_value: 29000 },
        { customer_name: 'Hooli', lifetime_value: 25000 }
      ],
      chart_type_suggestion: 'bar'
    });
  }

  // 2. OpenAI integration (if API KEY is active)
  if (openai) {
    try {
      const selectedSchema = MOCK_SCHEMAS[dataset_id] || MOCK_SCHEMAS.sales;
      const systemPrompt = `You are a data analyst writing clean PostgreSQL SELECT queries. 
Given this table schema:
${selectedSchema}

Write a PostgreSQL SELECT query to answer: "${question}"
Return ONLY the SQL, no explanation, no formatting blocks, and do not wrap in markdown \`\`\`sql or \`\`\`.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: question }],
        temperature: 0.1,
      });

      const rawSql = response.choices[0]?.message?.content?.trim() || '';
      
      // Secondary safety check on generated SQL
      if (unsafePatterns.test(rawSql)) {
        return res.status(400).json({ error: 'OpenAI generated query contained unsafe commands.' });
      }

      // Determine chart suggestion dynamically
      let chart_type_suggestion = 'table';
      const lowerSql = rawSql.toLowerCase();
      if (lowerSql.includes('date') || lowerSql.includes('month') || lowerSql.includes('year') || lowerSql.includes('time')) {
        chart_type_suggestion = 'line';
      } else if (lowerSql.includes('category') || lowerSql.includes('name') || lowerSql.includes('quarter') || lowerSql.includes('product')) {
        chart_type_suggestion = 'bar';
      }

      // Since the data table parsing is wired in step 8, return mock results for general LLM query calls
      return res.json({
        sql: rawSql,
        columns: ['Metric', 'Value'],
        rows: [
          { Metric: 'General Query Result A', Value: 1250 },
          { Metric: 'General Query Result B', Value: 2450 }
        ],
        chart_type_suggestion
      });
    } catch (err: any) {
      console.error('OpenAI execution error:', err.message);
      return res.status(500).json({ error: 'LLM failed to translate query.' });
    }
  }

  // 3. Static fallback response for unhandled questions when OpenAI is disconnected
  return res.json({
    sql: `SELECT name, sales FROM active_dataset LIMIT 4;`,
    columns: ['name', 'sales'],
    rows: [
      { name: 'Mock product alpha', sales: 450 },
      { name: 'Mock product beta', sales: 290 },
      { name: 'Mock product gamma', sales: 120 }
    ],
    chart_type_suggestion: 'bar'
  });
});

export default router;
