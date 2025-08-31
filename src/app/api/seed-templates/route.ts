
import fs from "fs";
import path from "path";
import dbConnect from "@/lib/dbConnect";
import TemplateModel from "@/model/checklistTemplate";

export async function POST(){
    await dbConnect();
    try {
        const filePath = path.join(process.cwd(),"src","scripts","templates","web.json");
        const fileContent = fs.readFileSync(filePath,"utf-8");
        const webTemplate = JSON.parse(fileContent);

        const exists = await TemplateModel.findOne({scope: webTemplate.scope});
        if(exists){
            return Response.json({
                success: false,
                message:  `⚠️ Template for '${webTemplate.scope}' already exists.`,
            },{status: 409})
        }
        await TemplateModel.create(webTemplate);
           return Response.json({
                success: true,
                message:   `✅ Template for '${webTemplate.scope}' seeded.`,
            },{status: 201})
    } catch (error) {
         console.error("Seeding error:", error);
           return Response.json({
                success: false,
                message:  "❌ Failed to seed template",
            },{status: 500})
    }
}