const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const isMatch = require("date-fns/isMatch");

const dbPath = path.join(__dirname, "todoApplication.db");

const app = express();
app.use(express.json());

let db = null;

const initilizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, (request, response) => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initilizeDbAndServer();

const priorityValArray = ["HIGH", "MEDIUM", "LOW"];
const statusValArray = ["TO DO", "IN PROGRESS", "DONE"];
const categoryValArray = ["WORK", "HOME", "LEARNING"];

//API -1
// const result = format(new Date(2023, 9, 15), "MM-dd-yyyy");
// console.log(result);

// hast only status

const convertToCamelCase = (dbObject) => {
  return {
    id: dbObject.id,
    todo: `${dbObject.todo}`,
    priority: `${dbObject.priority}`,
    status: `${dbObject.status}`,
    category: `${dbObject.category}`,
    dueDate: `${dbObject.due_date}`,
  };
};

const hasStatus = (query) => {
  return (
    query.status !== undefined &&
    query.category === undefined &&
    query.priority === undefined &&
    query.search_q === undefined
  );
};
const hasPriority = (query) => {
  return (
    query.status === undefined &&
    query.category === undefined &&
    query.priority !== undefined &&
    query.search_q === undefined
  );
};

const hasCategory = (query) => {
  return (
    query.status === undefined &&
    query.category !== undefined &&
    query.priority === undefined &&
    query.search_q === undefined
  );
};

const hasPriorityAndStatus = (query) => {
  return (
    query.status !== undefined &&
    query.category === undefined &&
    query.priority !== undefined &&
    query.search_q === undefined
  );
};

const hasSearch_q = (query) => {
  return (
    query.status === undefined &&
    query.category === undefined &&
    query.priority === undefined
  );
  query.search_q !== "";
};

const hasCategoryAndStatus = (query) => {
  return (
    query.status !== undefined &&
    query.category !== undefined &&
    query.priority === undefined &&
    query.search_q === undefined
  );
};

const hasCategoryAndPriority = (query) => {
  return (
    query.status === undefined &&
    query.category !== undefined &&
    query.priority !== undefined &&
    query.search_q === undefined
  );
};

app.get("/todos/", async (request, response) => {
  console.log("hii");
  const { status, category, priority, search_q = "" } = request.query;
  console.log(request.query);
  let getTdoQuery = "";
  let dbResponse = null;
  switch (true) {
    case hasStatus(request.query):
      if (statusValArray.includes(status)) {
        getTdoQuery = `SELECT * FROM todo 
        WHERE status = '${status}';`;
        console.log("has status");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

      break;
    case hasPriority(request.query):
      if (priorityValArray.includes(priority)) {
        getTdoQuery = `SELECT * FROM todo 
        WHERE priority = '${priority}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategory(request.query):
      if (categoryValArray.includes(category)) {
        getTdoQuery = `SELECT * FROM todo 
        WHERE category = '${category}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasPriorityAndStatus(request.query):
      if (
        priorityValArray.includes(priority) &&
        statusValArray.includes(status)
      ) {
        getTdoQuery = `SELECT * FROM todo 
        WHERE priority = '${priority}' AND 
        status ='${status}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority And Status");
      }
      break;
    case hasSearch_q(request.query):
      if (true) {
        getTdoQuery = `SELECT * FROM todo 
        WHERE todo LIKE '%${search_q}%';`;
      } else {
        response.status(400);
        response.send("Invalid Search");
      }
      break;
    case hasCategoryAndStatus(request.query):
      if (
        categoryValArray.includes(category) &&
        statusValArray.includes(status)
      ) {
        getTdoQuery = `SELECT * FROM todo 
        WHERE category = '${category}' AND 
        status ='${status}';`;
      } else {
        response.send(400);
        response.send("Invalid Todo Category And Status");
      }
      break;
    case hasCategoryAndPriority(request.query):
      if (
        priorityValArray.includes(priority) &&
        categoryValArray.includes(category)
      ) {
        getTdoQuery = `SELECT * FROM todo 
        WHERE priority = '${priority}' AND 
        category ='${category}';`;
      } else {
        response.send(400);
        response.send("Invalid Todo Category And Priority");
      }

      break;
    default:
      response.send("Enter valid search option");
      break;
  }

  if (getTdoQuery !== "") {
    dbResponse = await db.all(getTdoQuery);
    const requiredFormat = dbResponse.map((each) => convertToCamelCase(each));
    response.send(requiredFormat);
  }
  console.log(search_q);
});

// API 2 get todo By id

app.get("/todos/:todoId/", async (request, response) => {
  const todoId = request.params.todoId;
  if (todoId !== undefined) {
    const getTodoByIdQuery = `SELECT * 
    FROM todo 
    WHERE id = ${todoId};`;
    const dbResponse = await db.get(getTodoByIdQuery);
    const todoItem = convertToCamelCase(dbResponse);
    response.send(todoItem);
    console.log(dbResponse);
  } else {
    response.status(400);
    response.send("Invalid Id");
  }
});

// API 3 agenda

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoByDate = `SELECT * FROM todo
    WHERE 
    due_date = '${newDate}';`;
    const dbResponse = await db.all(getTodoByDate);
    const todoItems = dbResponse.map((each) => convertToCamelCase(each));
    response.send(todoItems);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API 4 POST
const isPostHasVsalidValues = (priority, status, category) => {
  return (
    priorityValArray.includes(priority) &&
    statusValArray.includes(status) &&
    categoryValArray.includes(category)
  );
};

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, dueDate, category } = request.body;
  const isValidDate = isValid(new Date(dueDate));
  const isMatchDate = isMatch(dueDate, "yyyy-MM-dd");
  const isValidPost = isPostHasVsalidValues(priority, status, category);
  if (isMatchDate && isMatchDate && isValidPost) {
    const newDate = format(new Date(dueDate), "yyyy-MM-dd");
    const addTodoSqlQuery = `INSERT INTO todo (id,todo,priority,status,category,due_date)
       VALUES
       (${id},
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${newDate}');`;

    const dbResponse = await db.run(addTodoSqlQuery);
    response.send("Todo Successfully Added");
  } else {
    response.status(400);
    if (priorityValArray.includes(priority) !== true) {
      response.send("Invalid Todo Priority");
    } else if (statusValArray.includes(status) !== true) {
      response.send("Invalid Todo Status");
    } else if (categoryValArray.includes(category) !== true) {
      response.send("Invalid Todo Category");
    } else if (isValidDate !== true) {
      response.send("Invalid Due Date");
    }
  }

  //
});

//API
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { id, todo, priority, status, category, dueDate } = request.body;
  let getUpdateSqlQuery = "";
  switch (true) {
    case todo !== undefined:
      if (todo !== "") {
        getUpdateSqlQuery = `UPDATE todo 
              SET
              todo = '${todo}'
              WHERE id = ${todoId};`;
        await db.run(getUpdateSqlQuery);
        response.send("Todo Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo");
      }

      break;
    case hasPriority(request.body):
      if (priorityValArray.includes(priority)) {
        getUpdateSqlQuery = `UPDATE todo
                SET
                priority = '${priority}'
                WHERE id = ${todoId};`;
        await db.run(getUpdateSqlQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategory(request.body):
      if (categoryValArray.includes(category)) {
        getUpdateSqlQuery = `UPDATE todo 
              SET 
              category = '${category}'
              WHERE 
              id = ${todoId}`;
        await db.run(getUpdateSqlQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case dueDate !== undefined:
      if (isValid(new Date(dueDate), "yyyy-MM-dd")) {
        const updatedDate = format(new Date(dueDate), "yyyy-MM-dd");
        getUpdateSqlQuery = `UPDATE todo
            SET
            due_date = '${updatedDate}'
            WHERE
            id = ${todoId};`;
        await db.run(getUpdateSqlQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    case hasStatus(request.body):
      if (statusValArray.includes(status)) {
        getUpdateSqlQuery = `UPDATE todo
                SET
                status = '${status}'
                WHERE 
                id = ${todoId};`;
        await db.run(getUpdateSqlQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }

    default:
      response.status(400);
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  if (todoId !== undefined) {
    const deleteTodoSqlQuery = `DELETE FROM todo
      WHERE 
      id = ${todoId};`;
    await db.run(deleteTodoSqlQuery);
    response.send("Todo Deleted");
  } else {
    response.status(400);
    response.send("invalid Todo Id ");
  }
});

module.exports = app;
