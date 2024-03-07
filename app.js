import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { notFound } from "./src/middlewares/notFound.js";
import { handleError } from "./src/middlewares/handleError.js";
import notesRoute from "./src/resources/notes/notes.routes.js";
dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// parse request data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//middleware
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Allow specific HTTP methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Allow specific headers
  next();
});

let data = [];

// api bodyParser
app.get("/", (req, res) => res.json(data).status(200));
app.post("/", (req, res) => {
  data = [...data, req.body];
  res.json(req.body).status(201);
});

// api routes
app.use("/translation", notesRoute);

app.use(notFound);
app.use(handleError);

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});

