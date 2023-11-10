import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "./auth";

const router = express.Router();

const client = new PrismaClient();

const select = {
  id: true,
  createdAt: true,
  updatedAt: true,
  title: true,
  content: true,
  userId: true,
  user: {
    select: {
      account: true,
    },
  },
};

router.post("/", verifyToken, async (req: any, res) => {
  try {
    const { title, content } = req.body;
    const { account } = req;

    if (
      !title ||
      title.trim().length === 0 ||
      !content ||
      content.trim().length === 0
    ) {
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

    const post = await client.post.create({
      data: {
        title,
        content,
        userId: user.id,
      },
    });

    return res.json({ ok: true, post });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      message: "Server error.",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const { page } = req.query;

    if (!page) {
      return res.status(400).json({
        ok: false,
        message: "Not exist page.",
      });
    }

    const posts = await client.post.findMany({
      skip: +page * 10,
      take: 10,
      orderBy: {
        id: "desc",
      },
      select,
    });

    return res.json({ ok: true, posts });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      message: "Server error.",
    });
  }
});

router.get("/count", async (req, res) => {
  try {
    const posts = await client.post.findMany();

    return res.json({ ok: true, count: posts.length });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      message: "Server error.",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (typeof +id !== "number") {
      return res.status(400).json({
        ok: false,
        message: "Post id is not number.",
      });
    }

    const post = await client.post.findUnique({
      where: {
        id: +id,
      },
      select,
    });

    if (!post) {
      return res.status(400).json({
        ok: false,
        message: "Not exist post.",
      });
    }

    return res.json({ ok: true, post });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      message: "Server error.",
    });
  }
});

router.put("/:id", verifyToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const { account } = req;

    if (isNaN(+id)) {
      return res.status(400).json({
        ok: false,
        message: "Post id is not number.",
      });
    }

    if (!title && !content) {
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

    const existPost = await client.post.findUnique({
      where: {
        id: +id,
      },
    });

    if (!existPost || existPost.userId !== user.id) {
      return res.status(400).json({
        ok: false,
        message: "Can not access.",
      });
    }

    const updatedPost = await client.post.update({
      where: {
        id: +id,
      },
      data: {
        title: title ? title : existPost.title,
        content: content ? content : existPost.content,
      },
    });

    return res.json({ ok: true, post: updatedPost });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      message: "Server error.",
    });
  }
});

router.delete("/:id", verifyToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { account } = req;

    if (isNaN(+id)) {
      return res.status(400).json({
        ok: false,
        message: "Post id is not number.",
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

    const existPost = await client.post.findUnique({
      where: {
        id: +id,
      },
    });

    if (!existPost || existPost.userId !== user.id) {
      return res.status(400).json({
        ok: false,
        message: "Can not access.",
      });
    }

    const deletedPost = await client.post.delete({
      where: {
        id: +id,
      },
    });

    return res.json({
      ok: true,
      post: deletedPost,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      ok: false,
      message: "Server error.",
    });
  }
});

export default router;
