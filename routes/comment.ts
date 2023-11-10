import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "./auth";

const router = express.Router();

const client = new PrismaClient();

const select = {
  id: true,
  createdAt: true,
  updatedAt: true,
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
    const { content, postId } = req.body;
    const { account } = req;

    if (!content || content.trim().length === 0 || !postId) {
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

    const comment = await client.comment.create({
      data: {
        content,
        userId: user.id,
        postId: +postId,
      },
    });

    return res.json({ ok: true, comment });
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
    const { postId } = req.query;

    if (!postId) {
      return res.status(400).json({
        ok: false,
        message: "Not exist post id.",
      });
    }

    const comments = await client.comment.findMany({
      where: {
        postId: +postId,
      },
      select,
    });

    return res.json({
      ok: true,
      comments,
    });
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

    if (!id) {
      return res.status(400).json({
        ok: false,
        message: "Not exist comment id.",
      });
    }

    const comment = await client.comment.findUnique({
      where: {
        id: +id,
      },
    });

    return res.json({
      ok: true,
      comment,
    });
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
    const { content } = req.body;
    const { account } = req;

    if (isNaN(+id)) {
      return res.status(400).json({
        ok: false,
        message: "Comment id is not a number.",
      });
    }

    if (!content) {
      return res.status(400).json({
        ok: false,
        message: "Not exist content.",
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

    const existComment = await client.comment.findUnique({
      where: {
        id: +id,
      },
    });

    if (!existComment || existComment.userId !== user.id) {
      return res.status(400).json({
        ok: false,
        message: "Can not access.",
      });
    }

    const updatedComment = await client.comment.update({
      where: {
        id: +id,
      },
      data: {
        content,
      },
    });

    return res.json({ ok: true, comment: updatedComment });
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
        message: "Comment id is not a number.",
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

    const existComment = await client.comment.findUnique({
      where: {
        id: +id,
      },
    });

    if (!existComment || existComment.userId !== user.id) {
      return res.status(400).json({
        ok: false,
        message: "Can not access.",
      });
    }

    const deletedComment = await client.comment.delete({
      where: {
        id: +id,
      },
    });

    return res.json({
      ok: true,
      comment: deletedComment,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      message: "Server error.",
    });
  }
});

export default router;
