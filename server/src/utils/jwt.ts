import jwt from "jsonwebtoken";

export const generateToken = (id: number, email: string) => {
  return jwt.sign({ id, email }, process.env.JWT_KEY!, {
    expiresIn: "1d",
  });
};
