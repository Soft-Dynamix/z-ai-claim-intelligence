import ZAI from 'z-ai-web-dev-sdk'

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

export async function getAIClient() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

export interface VisionAnalysisResult {
  success: boolean
  content?: string
  error?: string
}

export interface ChatResult {
  success: boolean
  content?: string
  error?: string
}

// Analyze image using VLM
export async function analyzeImage(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<VisionAnalysisResult> {
  try {
    const zai = await getAIClient()
    
    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image_url', 
              image_url: { 
                url: `data:${mimeType};base64,${imageBase64}` 
              } 
            }
          ]
        }
      ],
      thinking: { type: 'disabled' }
    })

    const content = response.choices[0]?.message?.content
    
    if (!content) {
      return { success: false, error: 'No response from AI' }
    }

    return { success: true, content }
  } catch (error) {
    console.error('Vision analysis error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Chat completion using LLM
export async function chatCompletion(
  systemPrompt: string,
  userMessage: string
): Promise<ChatResult> {
  try {
    const zai = await getAIClient()
    
    const response = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      thinking: { type: 'disabled' }
    })

    const content = response.choices[0]?.message?.content
    
    if (!content) {
      return { success: false, error: 'No response from AI' }
    }

    return { success: true, content }
  } catch (error) {
    console.error('Chat completion error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Structured output with JSON parsing
export async function structuredAnalysis<T>(
  systemPrompt: string,
  userMessage: string,
  imageBase64?: string,
  mimeType?: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const zai = await getAIClient()
    
    let messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>
    
    if (imageBase64 && mimeType) {
      messages = [
        { 
          role: 'user', 
          content: [
            { type: 'text', text: `${systemPrompt}\n\n${userMessage}\n\nRespond with valid JSON only.` },
            { 
              type: 'image_url', 
              image_url: { 
                url: `data:${mimeType};base64,${imageBase64}` 
              } 
            }
          ]
        }
      ]
    } else {
      messages = [
        { role: 'assistant', content: `${systemPrompt}\n\nRespond with valid JSON only.` },
        { role: 'user', content: userMessage }
      ]
    }

    const response = imageBase64 && mimeType
      ? await zai.chat.completions.createVision({
          messages: messages as Array<{ role: 'user'; content: Array<{ type: string; text?: string; image_url?: { url: string } }> }>,
          thinking: { type: 'disabled' }
        })
      : await zai.chat.completions.create({
          messages: messages as Array<{ role: 'assistant' | 'user'; content: string }>,
          thinking: { type: 'disabled' }
        })

    const content = response.choices[0]?.message?.content
    
    if (!content) {
      return { success: false, error: 'No response from AI' }
    }

    // Try to parse JSON from the response
    try {
      // Extract JSON from markdown code blocks if present
      let jsonStr = content
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim()
      }
      
      const data = JSON.parse(jsonStr) as T
      return { success: true, data }
    } catch {
      return { success: false, error: 'Failed to parse JSON response' }
    }
  } catch (error) {
    console.error('Structured analysis error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
