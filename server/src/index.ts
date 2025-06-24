import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { AppDataSource } from "./config/postgres-db";
import option1FileRouter from "./routes/option_1/file.route";
import option2FileRouter from "./routes/option_2/file2.route";
import authRouter from "./routes/auth.route";
dotenv.config();
const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(cors({}));

const PORT = process.env.PORT;

//use router
app.use(authRouter);

//Option 1 Routes
app.use("/option_1", option1FileRouter);
//Option 2 Routes
app.use("/option_2", option2FileRouter);
//init
AppDataSource.initialize()
  .then(() => {
    console.log("Connected to PostgreSQL!");
    app.listen(PORT, () => {
      console.log(`Sever is running at http://localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.log("Failed to connect to PostgreSQL", e);
  });
