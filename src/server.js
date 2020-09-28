import express from "express";
import bodyParser from "body-parser";
import { MongoClient } from "mongodb";
import path from "path";

const app = express();
app.use(express.static(path.join(__dirname, "/build")));

app.use(bodyParser.json());

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      useNewUrlParser: true,
    });
    const db = client.db("my-loan");

    await operations(db);

    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connecting to db", error });
  }
};

app.get("/api/loans/:name", async (req, res) => {
  withDB(async (db) => {
    const loanName = req.params.name;

    const loanInfo = await db.collection("loans").findOne({ name: loanName });
    res.status(200).json(loanInfo);
  }, res);
});

app.post("/api/loans/:name/rating", async (req, res) => {
  withDB(async (db) => {
    const loanName = req.params.name;

    const loanInfo = await db.collection("loans").findOne({ name: loanName });
    await db.collection("loans").updateOne(
      { name: loanName },
      {
        $set: {
          rating: loanInfo.rating + 1,
        },
      }
    );
    const updatedLoanInfo = await db
      .collection("loans")
      .findOne({ name: loanName });

    res.status(200).json(updatedLoanInfo);
  }, res);
});

app.post("/api/loans/:name/add-comment", (req, res) => {
  const { username, text } = req.body;
  const loanName = req.params.name;

  withDB(async (db) => {
    const loanInfo = await db.collection("loans").findOne({ name: loanName });
    await db.collection("loans").updateOne(
      { name: loanName },
      {
        $set: {
          comments: loanInfo.comments.concat({ username, text }),
        },
      }
    );
    const updatedLoanInfo = await db
      .collection("loans")
      .findOne({ name: loanName });

    res.status(200).json(updatedLoanInfo);
  }, res);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/build/index.html"));
});

app.listen(8000, () => console.log("Listening on port 8000"));
