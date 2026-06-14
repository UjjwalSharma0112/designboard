import "dotenv/config";
import app from "./app";
import mongoose from "mongoose";

async function start() {
  try {
    const PORT = process.env.PORT || 8080;
    
    mongoose.connect(process.env.MONGO_URI!).then(() => {
      app.listen(PORT, () => {
        console.log(`Running on ${PORT}`);
      });
    });
  } catch (e) {
    console.log(e);
  }
}

start();
