import mongoose , {Schema,Document} from "mongoose";

 export interface ChecklistItem {
    text: string;
    checked: boolean;
    tooltip?: string;
 }


 export interface ChecklistCategory {
    name: string;
    items: ChecklistItem[];
 }

 export interface Checklist extends Document {
    userId?: mongoose.Types.ObjectId;
    scope: string;
    categories: ChecklistCategory[];
    notes?: string;
 }

 const ChecklistItemSchema = new mongoose.Schema<ChecklistItem>({
    text: {
        type: String,
        required: true,
    },
    checked: {
        type: Boolean,
        default: false
    },
    tooltip: {
        type: String,
        default: null
    },
 });

 const ChecklistCategorySchema = new mongoose.Schema<ChecklistCategory>({
    name: {
        type: String,
        required: true,
    },
    items: {
        type: [ChecklistItemSchema],
        default: []
    }
 })

 const ChecklistSchema: Schema<Checklist> = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    scope: {
        type: String,
        required: true,
    },
    categories: {
        type: [ChecklistCategorySchema],
        default:[]
    },
    notes: {
        type: String,
        default: ''
    }
 })

 const ChecklistModel =
  (mongoose.models.Checklist as mongoose.Model<Checklist>) ||
  mongoose.model<Checklist>('Checklist', ChecklistSchema);

export default ChecklistModel;