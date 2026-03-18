import mongoose from "mongoose";

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const otpSchema = new Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 },
    attempts: { type: Number, default: 0 }
});

const User = new Schema({
    email: { type: String, unique: true },
    password: String,
    name: String,
    refreshTokens: { type: [String],
    default: [] }
})

const Todo = new Schema({
    title: String,
    description: { type: String, default: null },
    done: Boolean,
    userId: ObjectId,
    createdAt: { type: Date, default: Date.now },
    dueDate: { type: Date, default: null }
})

const userModel = mongoose.model('user', User);
const TodoModel = mongoose.model('todos', Todo);
const otpModel = mongoose.model('otp', otpSchema);

export { userModel, TodoModel, otpModel };
