import express, { NextFunction, Request, Response } from 'express';
import Nano from 'nano';
import jwt from 'jsonwebtoken'
import fs from 'fs'

const app = express();
app.use(express.json());

const url = process.env.SERVER_URL
if(typeof url === 'undefined') throw new Error('SERVER_URL environment variable must be set.');
const nano = Nano(url);
const usersDb = nano.db.use('users');

const errorJson = (msg: string, err: unknown) => ({ error: msg, details: err })
const tryIt = (req: Request, res: Response, procedure: (req: Request, res: Response) => Promise<void>, failuremsg: string) => {
  try {
    procedure(req, res)
  } catch (error) {
    res.status(500).json(errorJson(failuremsg, error))
  }
}

const getKey = () => fs.readFileSync('/etc/user-manager/keypair/private.key', 'utf8')

app.post('/login', async (req: Request, res: Response) => {
  const login = async (req: Request, res: Response) => {
    const session_test = await usersDb.auth(req.body.username, req.body.password)
    const payload = {
      userId: session_test.name,
      roles: session_test.roles
    }
    /*
    TODO
    - make sure permissions are correctly set on key files
    - run auth service as particular user
    */
    const token = jwt.sign(payload, getKey(), { algorithm: 'RS256', expiresIn: '1h' });

    res.status(200).json({ token })
  }
  tryIt(req, res, login, 'Error logging in')
})

app.post('/register', async (req: Request, res: Response) => {
  const registerUser = async (req: Request, res: Response) => {
    // TODO: document types in same database?
    // TODO: separate user db vs same db?
    const response = await usersDb.insert(req.body)
    res.status(201).json(response)
  }
  tryIt(req, res, registerUser, 'Error registering user')
})

interface UserPayload {
  roles: string[]
}

const userManagerGuard = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (typeof token === 'undefined' || token === null) {
    return res.sendStatus(401).json({ msg: 'You do not appear to have a JWT'})
  }
  jwt.verify(token, getKey(), (err, user) => {
    if (err) {
      return res.sendStatus(403).json({ msg: 'Your JWT is invalid' })
    }
    if (user && (user as UserPayload).roles.includes('UserManager')) {
      next()
    }
    else {
      return res.sendStatus(403).json({ msg: 'YOU SHALL NOT PASS' })
    }
  })
}

app.post('/create-user', userManagerGuard, async (req: Request, res: Response) => {
  const createUser = async (req: Request, res: Response) => {
    const response = await usersDb.insert(req.body)
    res.status(201).json(response)
  }
  tryIt(req, res, createUser, 'Error creating user')
})

app.get('/get-users', async (req: Request, res: Response) => {
  const getUsers = async (req: Request, res: Response) => {
    const response = await usersDb.list({ include_docs: true });
    const users = response.rows.map(row => row.doc);
    res.status(200).json(users);
  }
  tryIt(req, res, getUsers, 'Error fetching users')
})

const port = 4000;
app.listen(port, () => console.log(`Server running on port ${port}`));
