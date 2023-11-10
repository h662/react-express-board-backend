import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { verifyToken } from "./auth";

const router = express.Router();

const client = new PrismaClient();

// User 생성
router.post("/", async (req, res) => {
  try {
    const { account, password } = req.body;

    if (
      !account ||
      !password ||
      account.trim().length === 0 ||
      password.trim().length === 0
    ) {
      return res.status(400).json({
        ok: false,
        message: "Not exist data.",
      });
    }

    const existUser = await client.user.findUnique({
      where: {
        account,
      },
    });

    if (existUser) {
      return res.status(400).json({
        ok: false,
        message: "Already exist user.",
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await client.user.create({
      data: {
        account,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ account: user.account }, process.env.JWT_SECRET!);

    return res.json({ ok: true, token });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      message: "Server Error.",
    });
  }
});

router.post("/me", verifyToken, async (req: any, res) => {
  try {
    const { account } = req;

    const user = await client.user.findUnique({
      where: {
        account,
      },
      select: {
        account: true,
      },
    });

    if (!user) {
      return res.status(400).json({
        ok: false,
        message: "Not exist user.",
      });
    }

    return res.json({ ok: true, user });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      ok: false,
      message: "Server error.",
    });
  }
});

export default router;
