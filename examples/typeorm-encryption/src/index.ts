import initDataSource from "./data-source";
import {User} from "./entity/User";
import { Request, Response} from "express";
import * as express from "express";
import {Config} from "./config";
import {Server} from "http";
import {DataSource} from "typeorm";

export default async function main(config: Config): Promise<{
  server: Server;
  dataSource: DataSource;
}> {
  const app = express();
  app.use(express.json());

  const dataSource = await initDataSource(config);
  const userRepository = dataSource.getRepository(User);

  // Create a new user
  app.post("/users", async (req: Request, res: Response) => {
    try {
      const user = userRepository.create(req.body);
      const addedUser = await userRepository.save(user);
      res.status(201).send(addedUser);
    } catch (error: any) {
      res.status(400).send(error);
    }
  });

  // Get all users
  app.get("/users", async (_req: Request, res: Response) => {
    try {
      const users = await userRepository.find();
      res.send(users);
    } catch (error: any) {
      console.error(error);
      res.status(500).send(JSON.stringify(error));
    }
  });

  // Get a user by ID
  app.get("/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await userRepository.findOne({
        where: {
          id: Number(req.params.id),
        },
      });
      if (!user) {
        res.sendStatus(404);
      } else {
        res.send(user);
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).send(JSON.stringify(error));
    }
  });

  // Update a user by ID
  app.put("/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await userRepository.findOne({
        where: {
          id: Number(req.params.id),
        },
      });
      if (!user) {
        res.sendStatus(404);
      } else {
        userRepository.merge(user, req.body);
        await userRepository.save(user);
        res.send(user);
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).send(JSON.stringify(error));
    }
  });

  // Delete a user by ID
  app.delete("/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await userRepository.findOne({
        where: {
          id: Number(req.params.id),
        },
      });
      if (!user) {
        res.sendStatus(404);
      } else {
        await userRepository.remove(user);
        res.sendStatus(204);
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).send(JSON.stringify(error));
    }
  });

  const server = app.listen(config.port, () => {
    console.log(`[server]: Server is running at http://localhost:${config.port}`);
  });

  return {
    server,
    dataSource,
  };
}
