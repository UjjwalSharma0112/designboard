import { Request, Response } from "express";

import { signupUser, signinUser } from "../services/auth.service";

type SignupBody = {
  name: string;
  email: string;
  password: string;
  inviteCode: string;
};

type SigninBody = {
  email: string;
  password: string;
};

export const signup = async (
  req: Request<{}, {}, SignupBody>,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password, inviteCode } = req.body;

    const result = await signupUser(name, email, password, inviteCode);

    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};
export const signin = async (
  req: Request<{}, {}, SigninBody>,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await signinUser(email, password);

    res.json(result);
  } catch (error: any) {
    res.status(401).json({
      message: error.message,
    });
  }
};
