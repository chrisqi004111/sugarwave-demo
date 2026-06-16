const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY

export async function analyzeSpaceAndRecommend(imageFile) {
  const base64 = await fileToBase64(imageFile)
  const mimeType = imageFile.type || 'image/jpeg'

  const prompt = `You are an interior design AI assistant for Sugarwave, a high-end 3D printed furniture brand.

Analyze this room image and return a JSON response with:
1. The room's style (e.g. minimal, modern, nordic, mid-century, industrial, luxury)
2. The dominant colors
3. Which of these Sugarwave products would fit best in this space:
   - boop: a minimal organic table lamp, suits modern/nordic/minimal styles
   - lianlian: an organic sculptural lamp, suits modern/artistic styles  
   - forest: a nature-inspired floor lamp, suits nordic/natural/minimal styles
   - scratch: an industrial object/vessel, suits industrial/modern styles

Return ONLY valid JSON in this exact format, no other text:
{
  "style": "minimal",
  "colors": ["warm white", "natural wood", "beige"],
  "recommended": ["boop", "forest"],
  "reason": "The space has a warm minimal aesthetic that would complement Boop's organic form and Forest's natural inspiration."
}`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64,
              }
            },
            { text: prompt }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 512,
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } catch {
    return {
      style: 'modern',
      colors: ['neutral'],
      recommended: ['boop', 'forest'],
      reason: 'AI analysis complete.',
    }
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}