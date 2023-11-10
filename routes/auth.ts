import express, { NextFunction, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router = express.Router();

const client = new PrismaClient();

interface JwtPayload {
  account: string;
}

// 로그인
router.post("/", async (req, res) => {
  try {
    const { account, password } = req.body;

    if (!account || !password) {
      return res.status(400).json({
        ok: false,
        message: "Not exist data.",
      });
    }

    const user = await client.user.findUnique({
      where: {
        account,
      },
    });

    if (!user) {
      return res.status(400).json({
        ok: false,
        message: "Not exist user.",
      });
    }

    const comparedPassword = bcrypt.compareSync(password, user.password);

    if (!comparedPassword) {
      return res.status(400).json({
        ok: false,
        message: "Incorrect password.",
      });
    }

    const token = jwt.sign({ account: user.account }, process.env.JWT_SECRET!);

    return res.json({
      ok: true,
      token,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      message: "Server Error.",
    });
  }
});

export const verifyToken = (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization.substring(7);

    if (!token) {
      return res.status(400).json({
        ok: false,
        message: "Not exist token.",
      });
    }

    const { account } = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JwtPayload;

    req.account = account;

    next();
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      message: "Server Error.",
    });
  }
};

export default router;
