import dbConnect from "@/lib/dbConnect";
import { NextRequest } from "next/server";
import TemplateModel from "@/model/checklistTemplate";

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ scope: string }> }
) {
  const { scope } = await params;

  if (!scope || typeof scope !== "string") {
    return Response.json(
      { success: false, message: "Scope is required as a query parameter" }, 
      { status: 400 }
    );
  }
  
  try {
    await dbConnect();
    const template = await TemplateModel.findOne({ scope });
    
    if (!template) {
      return Response.json(
        { success: false, message: `No template found for scope: ${scope}` }, 
        { status: 404 }
      );
    }
    
    return Response.json({ success: true, template });
  } catch (error) {
    console.error("Error fetching template:", error);
    return Response.json(
      { success: false, message: "error getting template" }, 
      { status: 500 }
    );
  }
}