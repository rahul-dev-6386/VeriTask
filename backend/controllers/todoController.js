import { TodoModel } from "../../db.js";

async function todoHandler(req, res) {
    const title = req.body.title;
    const description = req.body.description;
    const userId = req.userId;
    const dueDate = req.body.dueDate;
    try {
        const todo = await TodoModel.create({
            title,
            description: description || null,
            userId,
            done: false,
            dueDate: dueDate || null,
            createdAt: new Date()
        });

        res.json({
            message: "Todo created",
            todo: todo
        });
    }
    catch (err) {
        res.status(500).json({
            message: "Error creating todo"
        });
    }
}
async function viewtodo(req, res) {
    const userId = req.userId;
    const todos = await TodoModel.find({
        userId: userId
    })
    res.json({
        todos
    })
}

async function delTasks(req, res) {
    const userId = req.userId;
    const todoId = req.body.todoId;
    const result = await TodoModel.deleteOne({
        _id: todoId,
        userId: userId
    })
    res.json({
        message: "Todo deleted",
        result: result
    })
}
async function modifyTodo(req, res) {
    const todoId = req.body.todoId;
    const userId = req.userId;
    const done = req.body.done;

    await TodoModel.updateOne(
        {
            _id: todoId,
            userId: userId
        },
        {
            done: done
        }
    );

    res.json({
        message: "Todo updated"
    });
}

export { todoHandler, viewtodo, delTasks, modifyTodo };
