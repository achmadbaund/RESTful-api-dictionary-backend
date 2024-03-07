import express from "express";
import {
  create,
  createBatch,
  delete_,
  update,
  getLangPairs,
} from "./notes.controllers.js";

const router = express.Router();

router.route("/post").post(create);
router.route("/batch").post(createBatch);
router.get('/get', getLangPairs);
router.route("/:id").patch(update).delete(delete_);

export default router;

