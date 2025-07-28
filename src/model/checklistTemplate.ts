import mongoose, {Schema,Document} from "mongoose";

export interface Template extends Document {
    scope: string,
    categories: {
        name: string;
        items:{
            text: string;
            tooltip?: string;
        }[];
    }[];
}

const TemplateItemSchema = new Schema({
  text: { type: String, required: true },
  tooltip: { type: String, default: null }
});

const TemplateCategorySchema = new Schema({
  name: { type: String, required: true },
  items: [TemplateItemSchema]
});

const TemplateSchema = new Schema({
  scope: { type: String, required: true, unique: true },
  categories: [TemplateCategorySchema]
});

const TemplateModel =
  mongoose.models.Template || mongoose.model<Template>("Template", TemplateSchema);

export default TemplateModel;

