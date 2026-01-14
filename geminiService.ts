
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AdCopyPackage } from "./types";

const ADFORGE_PROMPT = `Act as AdForge, an elite Meta Advertising Copy Strategist with 12+ years of experience ($50M+ ad spend). You are a hybrid of direct-response copywriter, consumer psychologist, and compliance specialist.

CORE PRINCIPLES:
1. Performance-focused: Every word must earn its place.
2. Compliance is non-negotiable: No direct assertions of personal attributes, no income/health guarantees, no before/after body claims.
3. Hook for the scroll: Stop the thumb in 0.5 seconds.
4. Human Persona: Write as a revenue-focused engine, not a generic assistant. Never mention AI.

REQUIRED OUTPUT SECTIONS:
- Section One: 8 Hooks (Curiosity, Pattern Interrupt, Problem Callout, Myth-Buster, Social Proof, Outcome Visualization, Urgency, Identity).
- Section Two: 3 Primary Text Variations (Version A: PAS, Version B: AIDA, Version C: BAB). 80-180 words each.
- Section Three: 2 Short-Form Variations (Stories/Reels optimized, 40-60 words).
- Section Four: 5 Headlines (Benefit-led, Curiosity-led, Outcome-led, Urgency-led, Social Proof-led). Under 40 chars.
- Section Five: 3 Descriptions (15-30 words).
- Section Six: CTA Recommendations (Primary & Secondary with rationale).

Analyze the input (image/text) to build audience architecture and emotional landscapes before generating deployment-ready copy.`;

/**
 * MANDATORY CREATIVE GENERATION PROTOCOLS
 * Includes Zero-Tolerance Anatomy & Mathematical Verification
 */
const BRAND_INTEGRITY_INSTRUCTION = `
MANDATORY: TWO-LAYER CREATIVE GENERATION PROCESS.

LAYER 1: SACRED ASSET IDENTIFICATION
Identify and mentally extract the exact product including its packaging, bottle, container, label design, logo, typography, colors, and every visual detail. Treat this as a SACRED reference asset that must be replicated with complete accuracy in every output. Replicate shape, label, logo placement, typography, and proportions EXACTLY as seen in the reference.

LAYER 2: TOTAL ENVIRONMENTAL SYNTHESIS
Generate an entirely NEW, ORIGINAL background scene. Never output the original image unchanged. Never simply reproduce what was provided.

ACTIVE PRODUCT USAGE PROTOCOL:
"Using" means the human is performing the exact functional action the product was designed for in the PRECISE MOMENT of that action occurring. 
- Fragrance: Spraying onto skin (visible mist), inhaling scent from wrist.
- Skincare: Massaging into face, applying with fingers.
- Food/Bev: Drinking, pouring, tasting mid-action.

MANDATORY HUMAN ANATOMY REQUIREMENTS (ZERO TOLERANCE):
Anatomical correctness is the highest visual priority. 
1. LIMB COUNT FORMULA: The total number of hands/arms in the image must equal (Persons × 2). If count > (Persons × 2), it is a disembodied limb and must be removed.
2. ABSOLUTE LIMB CONNECTION: Every hand must connect to a wrist, which connects to a forearm, elbow, upper arm, and shoulder of a person visible in the scene. NO floating hands, NO disembodied limbs from edges, NO phantom hands from behind furniture.
3. FINGER SPECIFICATION: Exactly FIVE distinct fingers per hand (1 thumb + 4 fingers). NO fused fingers, NO extra digits, NO split digits.
4. ANATOMICAL TRACING: Before output, trace every hand back to its torso. If the trace is broken or if a hand enters from an edge without a logical off-frame body, regenerate.
5. FINGER PROPORTIONS: Middle finger longest, pinky shortest. Thumb angled and thicker. 3 joints per finger, 2 per thumb.

FALLBACK: If a complex pose risks anatomical error, use strategic cropping to hide hands naturally or place them behind objects. A hidden hand is superior to a malformed one.

Absolute Rule: Two arms. Two hands. Five fingers per hand. No exceptions. No excuses. No errors.`;

/**
 * Generates structured ad copy package using Gemini 3 Pro.
 */
export async function generateAdCopy(
  input: string,
  imageData: string | null = null
): Promise<AdCopyPackage> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contents: any[] = [{ text: input }];
  
  if (imageData) {
    contents.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageData.split(',')[1]
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts: contents },
    config: {
      systemInstruction: ADFORGE_PROMPT,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 4000 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          assumptions: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Brief list of strategic inferences drawn from input."
          },
          hooks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { 
                type: { type: Type.STRING, description: "One of: Curiosity, Pattern Interrupt, Problem Callout, Myth-Buster, Social Proof, Outcome Visualization, Urgency, Identity" }, 
                text: { type: Type.STRING } 
              },
              required: ["type", "text"]
            },
            description: "8 distinct hooks using required psychological mechanisms."
          },
          primaryTexts: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { 
                framework: { type: Type.STRING, description: "PAS, AIDA, or BAB" }, 
                content: { type: Type.STRING } 
              },
              required: ["framework", "content"]
            },
            description: "3 frameworks: PAS, AIDA, BAB."
          },
          shortForms: {
            type: Type.ARRAY,
            items: { type: Type.OBJECT, properties: { content: { type: Type.STRING } }, required: ["content"] },
            description: "2 Stories/Reels variations (40-60 words)."
          },
          headlines: {
            type: Type.ARRAY,
            items: { 
              type: Type.OBJECT, 
              properties: { 
                angle: { type: Type.STRING, description: "Benefit, Curiosity, Outcome, Urgency, or Social Proof" }, 
                text: { type: Type.STRING } 
              }, 
              required: ["angle", "text"] 
            },
            description: "5 headlines under 40 characters each."
          },
          descriptions: {
            type: Type.ARRAY,
            items: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ["text"] },
            description: "3 link descriptions (15-30 words)."
          },
          ctaRecommendations: {
            type: Type.OBJECT,
            properties: {
              primary: { type: Type.OBJECT, properties: { button: { type: Type.STRING }, rationale: { type: Type.STRING } } },
              secondary: { type: Type.OBJECT, properties: { button: { type: Type.STRING }, rationale: { type: Type.STRING } } },
              funnelGuidance: { type: Type.STRING }
            },
            required: ["primary", "secondary", "funnelGuidance"]
          }
        },
        required: ["assumptions", "hooks", "primaryTexts", "shortForms", "headlines", "descriptions", "ctaRecommendations"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Strategy engine returned an empty response.");
  }

  return JSON.parse(response.text) as AdCopyPackage;
}

export async function editImage(base64Image: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image.split(',')[1],
            mimeType: 'image/jpeg',
          },
        },
        {
          text: `${BRAND_INTEGRITY_INSTRUCTION}
                 TASK: Replace the background completely.
                 NEW ENVIRONMENT: ${prompt}.
                 STYLE: Cinematic lighting, luxury studio aesthetic, 2K resolution.`,
        },
      ],
    },
    config: {
      imageConfig: { aspectRatio: "1:1", imageSize: "2K" }
    }
  });

  for (const part of response.candidates![0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Image synthesis failed to return valid asset data.");
}

export async function generateAdImage(contextPrompt: string, referenceImage: string | null = null): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [];

  if (referenceImage) {
    parts.push({
      inlineData: { data: referenceImage.split(',')[1], mimeType: 'image/jpeg' },
    });
    parts.push({
      text: `${BRAND_INTEGRITY_INSTRUCTION}
             VARIANT SPECIFIC TARGET: ${contextPrompt}.
             REPLICATE THE PRODUCT EXACTLY. CAPTURE THE ACTIVE MOMENT. PERFORM MATHEMATICAL LIMB VERIFICATION.`,
    });
  } else {
    parts.push({
      text: `Generate a premium commercial photography set for: ${contextPrompt}. 
             Style: High-end lifestyle, 2K resolution, cinematic lighting.`,
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts },
    config: {
      imageConfig: { aspectRatio: "1:1", imageSize: "2K" }
    }
  });

  for (const part of response.candidates![0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Creative synthesis failed to return valid image data.");
}
