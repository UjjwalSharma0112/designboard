import bcrypt from "bcryptjs";

import User from "../models/user.model";
import { generateToken } from "../utils/generateToken";
import { Invite } from "../models/invite.model";

export const signupUser = async (
  name: string,
  email: string,
  password: string,
  inviteCode: string,
) => {
  const validInvite = await Invite.findOne({ code: inviteCode });
  if (!validInvite || validInvite.used) {
    throw new Error("Invalid Invite Code");
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exist");
  }
  const hashPassword = await bcrypt.hash(password, 13);

  const user = await User.create({
    name,
    email,
    password: hashPassword,
  });
  const token = generateToken(user.id);
  if (user) {
    validInvite.used = true; //if user is created then invalid the code
    await validInvite.save();
  }
  return { token, name };
};

export const signinUser = async (email: string, password: string) => {
  const user = await User.findOne({
    email,
  });
  if (!user) throw new Error("Invalid credentials");
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) throw new Error("Invalid credentials");
  const token = generateToken(user.id);
  return { token, name: user.name };
};
