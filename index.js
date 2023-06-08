import axios from "axios";
import express from "express";
import Redis from "redis";

const app = express();
app.use(express.json());

const redisClient = Redis.createClient();

// its reusable function to cache and fetch data
const cacheOrFetchData = (key, callback) => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await redisClient.get(key);
      if (data) {
        resolve(JSON.parse(data));
      } else {
        const freshData = await callback();
        redisClient.setEx(key, 400, JSON.stringify(freshData));
        resolve(freshData);
      }
    } catch (error) {
      reject(error.message);
    }
  });
};

app.get("/photos", async (req, res) => {
  try {
    const photos = await cacheOrFetchData("photos", async () => {
      const { data } = await axios.get(
        "https://jsonplaceholder.typicode.com/photos"
      );
      return data;
    });
    res.json(photos);
  } catch (error) {
    res.json(error.message);
  }
});

app.get("/todos", async (req, res) => {
  try {
    const todoId = req.query.todoId;
    // todos:${todoId} is just a name so we can provide any name we want
    const todos = await cacheOrFetchData(`todos:${todoId}`, async () => {
      const { data } = await axios.get(
        `https://jsonplaceholder.typicode.com/todos/${todoId}`
      );
      return data;
    });
    res.json(todos);
  } catch (error) {
    res.json(error.message);
  }
});

app.listen(3000, () => {
  redisClient
    .connect()
    .then(() => console.log("conncted to server & redis succesfully"));
});
