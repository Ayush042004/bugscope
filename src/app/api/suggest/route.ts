import { NextRequest } from "next/server";
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'edge';
export const maxDuration = 30;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request:NextRequest){
    try {
        const {scope} = await request.json();

            const prompt = `
You are an expert in security testing and bug bounty checklists.

A user is working on a security checklist for a project with the scope: **${scope}**.

Based on this scope, suggest:
1. Important security checks they might need to include
2. One-line solutions/remediation for each item
3. Group suggestions into relevant categories

Respond ONLY in this JSON format:

{
  "suggestions": [
    {
      "category": "Example Category",
      "items": [
        {
          "text": "Example check to perform",
          "solution": "One-line remediation for the check"
        }
      ]
    }
  ]
}
Avoid any explanations. Only return a clean JSON response.
`;
 const model = genAI.getGenerativeModel({model: 'gemini-2.5-flash'});
 const result = await model.generateContent(prompt);
 const response = result.response;
 const text = response.text();

    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const jsonString = text.slice(jsonStart, jsonEnd);
    const parsed = JSON.parse(jsonString);

    return Response.json({success: true, data: parsed},{status: 200})
        
    } catch (error) {
        console.error('Gemini AI Suggestion Error:', error);
         return Response.json(
      {
        success: false,
        message: 'Failed to get AI suggestions',
      },
      { status: 500 }
    );
    }
}