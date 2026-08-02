import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await UserModel.create({
      email,
      name,
      passwordHash,
    });

    const secret = process.env.JWT_SECRET || 'mediaflow_super_secret_jwt_key_2026';
    const token = jwt.sign({ userId: newUser._id.toString(), email: newUser.email }, secret, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      user: {
        _id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const secret = process.env.JWT_SECRET || 'mediaflow_super_secret_jwt_key_2026';
    const token = jwt.sign({ userId: user._id.toString(), email: user.email }, secret, {
      expiresIn: '7d',
    });

    return res.json({
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
}
