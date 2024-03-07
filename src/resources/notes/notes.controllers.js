import { pool } from "../../db/connect.js";
import { createCustomError } from "../../errors/customErrors.js";
import { tryCatchWrapper } from "../../middlewares/tryCatchWrapper.js";

/**
 * @returns note object
 */
async function getTranslations(langpair, q) {
  let sql, result;
  if (langpair === 'tr|id') {
    sql = `
          SELECT 
            tr.uraian AS segment, 
            id.uraian as translation,
            id.created_by,
            id.last_updated_by,
            id.created_at,
            id.updated_at
          FROM indonesian_translations id
            INNER JOIN turkish_words tr ON id.turkish_word_id = tr.id 
          WHERE 
            LOWER(tr.uraian) LIKE LOWER(CONCAT('%', ?, '%'))
          
          `;
  } else if (langpair === 'id|tr') {
    sql = `
          SELECT 
            id.uraian as segment, 
            tr.uraian as translation,
            tr.created_by,
            tr.last_updated_by,
            tr.created_at,
            tr.updated_at
          FROM turkish_words tr
            INNER JOIN indonesian_translations id ON id.turkish_word_id = tr.id 
          WHERE 
            LOWER(id.uraian) LIKE LOWER(CONCAT('%', ?, '%'))
          
          `;
  }
  
  [result] = await pool.query(sql, [q]);
    return Array.isArray(result) ? result : [result];
}

/**
 * @description Get result
 * @route GET /get?:langpair&:q
 */
export const getLangPairs = tryCatchWrapper(async function (req, res, next) {
  // const { langpair, q } = req.params;
  const langpair = req.query.langpair;
  const q = req.query.q;
  
  const results = await getTranslations(langpair, q);
  
  let source, target;
  const parts = langpair.split("|");

  source = parts[0]; // Menghasilkan "tr"
  target = parts[1]; // Menghasilkan "id"

  const responseData = {
    "translatedText": q
  };

  const matches = [];
  
  results.forEach((item, index) => {
    const match = {
        "id": index + 1,
        "segment": item.segment,
        "translation": item.translation,
        "source": source,
        "target": target,
        "created-by": item.created_by,
        "last-updated-by": item.last_updated_by,
        "create-date": item.created_at,
        "last-update-date": item.updated_at,
        "model": "neural"
    };
    matches.push(match);
  });

  const response = {
    "responseData": responseData,
    "quotaFinished": false,
    "mtLangSupported": null,
    "responseDetails": "",
    "responseStatus": 200,
    "responderId": null,
    "exception_code": null,
    "matches": matches
  };
  return res.status(200).json(response);
});


/**
 * @description Create note
 * @route POST /notes
 */
export const create = tryCatchWrapper(async function (req, res, next) {
  const { turkishWord, indonesianTranslation } = req.body;

  if (!turkishWord || !indonesianTranslation)
      return next(createCustomError("All fields are required", 400));

  try {
      const [turkishWordResult] = await pool.query(
          "INSERT INTO turkish_words (uraian) VALUES (?)",
          [turkishWord]
      );

      const turkishWordId = turkishWordResult.insertId;

      await pool.query(
          "INSERT INTO indonesian_translations (turkish_word_id, uraian) VALUES (?, ?)",
          [turkishWordId, indonesianTranslation]
      );

      return res.status(201).json({ message: "Translation has been created" });
  } catch (error) {
      console.error("Error creating translation:", error);
      return next(createCustomError("Translation creation failed", 500));
  }
});

export const createBatch = tryCatchWrapper(async function (req, res, next) {
  const translations = req.body;

  try {
      for (const translation of translations) {
          const { turkishWord, indonesianTranslation } = translation;

          if (!turkishWord || !indonesianTranslation)
              return next(createCustomError("All fields are required", 400));

          const [turkishWordResult] = await pool.query(
              "INSERT INTO turkish_words (uraian) VALUES (?)",
              [turkishWord]
          );

          const turkishWordId = turkishWordResult.insertId;

          await pool.query(
              "INSERT INTO indonesian_translations (turkish_word_id, uraian) VALUES (?, ?)",
              [turkishWordId, indonesianTranslation]
          );
      }

      return res.status(201).json({ message: "Translations have been created" });
  } catch (error) {
      console.error("Error creating translations:", error);
      return next(createCustomError("Translation creation failed", 500));
  }
});


/**
 * @description Update 
 * @route PATCH /notes/:id
 */
export const update = tryCatchWrapper(async function (req, res, next) {
  const { id } = req.params;
  const { title, contents } = req.body;

  if (!id || !title || !contents)
    return next(createCustomError("All fields are required", 400));

  const note = await getNote(id);
  if (!note) return next(createCustomError("note not found", 404));

  let sql = "UPDATE notes SET title = ? , contents = ? WHERE id = ?";
  await pool.query(sql, [title, contents, id]);

  return res.status(201).json({ message: "note has been updated" });
});

/**
 * @description Delete note
 * @route DELETE /notes/:id
 */
export const delete_ = tryCatchWrapper(async function (req, res, next) {
  const { id } = req.params;

  if (!id) return next(createCustomError("Id is required", 400));

  const note = await getNote(id);
  if (!note) return next(createCustomError("note not found", 404));

  let sql = "DELETE FROM notes WHERE id = ?";
  await pool.query(sql, [id]);

  return res.status(200).json({ message: "note has been deleted" });
});

