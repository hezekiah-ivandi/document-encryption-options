import { Request } from "express";

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}
