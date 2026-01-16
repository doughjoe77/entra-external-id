import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { expressjwt as jwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// --- Load environment variables ---
const PORT = process.env.PORT || 4000;
const JWK_URI = process.env.JWK_URI;
const AUDIENCE = process.env.AUDIENCE;
const ISSUER = process.env.ISSUER;

// --- Basic middleware ---
app.use(cors());
app.use(express.json());

// --- Swagger setup ---
const swaggerDocument = YAML.load('./swagger.yaml');
swaggerDocument.info.title = process.env.SWAGGER_TITLE || swaggerDocument.info.title;
swaggerDocument.info.version = process.env.SWAGGER_VERSION || swaggerDocument.info.version;

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- JWT auth middleware (Azure AD compatible) ---
const jwtCheck = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: JWK_URI
  }),
  algorithms: ['RS256'],
  audience: AUDIENCE,
  issuer: process.env.ISSUER
  
});

// --- Simple random daily tasks generator ---
function generateDailyTasks(dateString) {
  const baseTasks = [
    'Review pull requests',
    'Write documentation',
    'Refactor legacy code',
    'Plan sprint backlog',
    'Pair program with a teammate',
    'Investigate production logs',
    'Update CI/CD pipeline',
    'Write unit tests',
    'Research new tech',
    'Clean up TODOs in code'
  ];

  const seed = dateString.split('-').join('');
  let random = parseInt(seed, 10) || Date.now();

  function nextRand() {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  }

  const tasks = baseTasks
    .map((title, index) => ({
      id: `${dateString}-${index}`,
      title,
      completed: nextRand() > 0.6
    }))
    .sort(() => nextRand() - 0.5)
    .slice(0, 5);

  return tasks;
}

// --- Protected route ---
app.get('/tasks', jwtCheck, (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const tasks = generateDailyTasks(today);

  res.json({
    date: today,
    tasks
  });
});

// --- Unprotected test route ---
app.get('/tasks-test', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const tasks = generateDailyTasks(today);

  res.json({
    date: today,
    tasks,
    note: "This endpoint does NOT require a JWT"
  });
});


// --- Error handler for auth ---
app.use((err, req, res, next) => {
  console.error(err);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid or missing token' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Daily Tasks API running on http://localhost:${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/docs`);
});
