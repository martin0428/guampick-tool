export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 
  const { title, apiKey } = req.body;
  if (!apiKey || !title) return res.status(400).json({ error: 'Missing title or apiKey' });
 
  const SYSTEM_PROMPT = `You are a product manager for GuamPick, a Korea-to-Guam Shopify store.
Given a product title, do THREE things:
1. Classify into the correct Shopify Type from the list below
2. Translate/clean the title to natural English for US/Guam shoppers
3. Write a SHORT 2-3 sentence English product description (plain text, no HTML tags)
 
Available Types (use EXACTLY one):
Beauty > Skincare
Beauty > Hair Care
Beauty > Body Care
Beauty > Mask Packs
Beauty > Sun Care
Beauty > Perfume & Fragrance
Korean Food > Kimchi
Korean Food > Fresh Produce
Korean Food > Snacks & Chips
Korean Food > Bread & Bakery
Korean Food > Banchan (Side Dishes)
Korean Food > Sauces & Condiments
Korean Food > Health & Supplements
Korean Food > Packaged Foods
Fashion > Women's Clothing
Fashion > Men's Clothing
Fashion > Kids Clothing
Fashion > Swimwear & Beachwear
Fashion > Shoes & Sandals
Fashion > Accessories
Sports & Outdoors > Exercise & Fitness
Sports & Outdoors > Golf
Sports & Outdoors > Swimming
Sports & Outdoors > Outdoor & Camping
Home & Living > Household Supplies
Home & Living > Kitchenware
Home & Living > Home & Interior
Baby & Kids > Baby Care
Baby & Kids > Toys & Games
Stationery & Office
Automotive
Flowers & Gifts
Pet Supplies
$1 Bakery
Other
 
TRANSLATION RULES:
- Keep brand names as-is (농심→Nongshim, 오뚜기→Ottogi, 삼양→Samyang)
- Include size/count at end (e.g. "200g x 3")
- Max ~60 characters
- If already in good English, keep or lightly polish only
 
DESCRIPTION: 2-3 sentences max, plain English, no HTML. Mention key features and use case.
 
Respond ONLY with valid JSON (no markdown, no backticks):
{"type":"Stationery & Office","title_en":"Sanrio Character Stationery Set","description":"A cute Korean-style desk organizer kit featuring beloved Sanrio characters. Perfect for school or home use.","confidence":0.92}`;
 
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Product title: ${title}` }]
      })
    });
 
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });
 
    const text = data.content?.map(c => c.text || '').join('') || '{}';
    const result = JSON.parse(text.replace(/```json|```/g, '').trim());
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
